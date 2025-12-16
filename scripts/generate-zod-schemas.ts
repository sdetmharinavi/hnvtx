// scripts/generate-zod-schemas.ts
import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import { ValidationConfig, loadValidationConfig } from "@/utils/zod-validation.config";

interface PropertyInfo {
  name: string;
  type: string;
  isOptional: boolean;
  isNullable: boolean;
}

interface TypeInfo {
  name: string;
  properties: PropertyInfo[];
}

class TypeScriptToZodConverter {
  private sourceFile: ts.SourceFile;
  private checker: ts.TypeChecker; // @typescript-eslint/no-unused-vars
  private config: ValidationConfig;

  constructor(filePath: string) {
    const program = ts.createProgram([filePath], {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
    });
    this.sourceFile = program.getSourceFile(filePath)!;
    this.checker = program.getTypeChecker();
    this.config = loadValidationConfig();
  }

  extractTypes(): TypeInfo[] {
    const types: TypeInfo[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isTypeAliasDeclaration(node) && ts.isIdentifier(node.name)) {
        const typeName = node.name.text;

        // Skip Json and Database helper types
        if (typeName === "Json" || typeName === "Database") {
          return;
        }

        if (ts.isTypeLiteralNode(node.type)) {
          const properties = this.extractProperties(node.type);
          types.push({ name: typeName, properties });
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(this.sourceFile);
    return types;
  }

  private extractProperties(typeNode: ts.TypeLiteralNode): PropertyInfo[] {
    const properties: PropertyInfo[] = [];

    for (const member of typeNode.members) {
      if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
        const name = member.name.text;
        const isOptional = !!member.questionToken;

        if (member.type) {
          const typeInfo = this.analyzeType(member.type);
          properties.push({
            name,
            type: typeInfo.type,
            isOptional,
            isNullable: typeInfo.isNullable,
          });
        }
      }
    }

    return properties;
  }

  private analyzeType(typeNode: ts.TypeNode): {
    type: string;
    isNullable: boolean;
  } {
    if (ts.isUnionTypeNode(typeNode)) {
      const types = typeNode.types.map((t) => this.analyzeType(t));
      const hasNull = types.some((t) => t.type === "null");
      const nonNullTypes = types.filter((t) => t.type !== "null");

      if (nonNullTypes.length === 1) {
        return {
          type: nonNullTypes[0].type,
          isNullable: hasNull || nonNullTypes[0].isNullable,
        };
      } else {
        const unionTypes = nonNullTypes.map((t) => t.type).join(" | ");
        return {
          type: unionTypes,
          isNullable: hasNull,
        };
      }
    }

    if (ts.isToken(typeNode) && typeNode.kind >= ts.SyntaxKind.FirstKeyword && typeNode.kind <= ts.SyntaxKind.LastKeyword) {
      switch (typeNode.kind) {
        case ts.SyntaxKind.StringKeyword: return { type: "string", isNullable: false };
        case ts.SyntaxKind.NumberKeyword: return { type: "number", isNullable: false };
        case ts.SyntaxKind.BooleanKeyword: return { type: "boolean", isNullable: false };
        case ts.SyntaxKind.NullKeyword: return { type: "null", isNullable: false };
        case ts.SyntaxKind.UndefinedKeyword: return { type: "undefined", isNullable: false };
      }
    }

    if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
      const typeName = typeNode.typeName.text;
      if (typeName === "Json") {
        return { type: "Json", isNullable: false };
      }
      return { type: typeName, isNullable: false };
    }

    if (ts.isLiteralTypeNode(typeNode)) {
      if (ts.isStringLiteral(typeNode.literal)) {
        return { type: `"${typeNode.literal.text}"`, isNullable: false };
      }
      if (ts.isNumericLiteral(typeNode.literal)) {
        return { type: typeNode.literal.text, isNullable: false };
      }
    }

    const printer = ts.createPrinter();
    const typeText = printer.printNode(ts.EmitHint.Unspecified, typeNode, this.sourceFile);
    return { type: typeText, isNullable: false };
  }

  private typeToZodSchema(type: string, isNullable: boolean, fieldName?: string, tableName?: string): string {
    const customRule = this.config.customRules.find(
      (rule) => rule.fieldName === fieldName && this.matchesTableName(rule.tableName, tableName)
    );
    if (customRule) {
      return isNullable ? `${customRule.validation}.nullable()` : customRule.validation;
    }
    
    if (type.includes('"') && type.includes("|")) {
      const literalValues = type.split(" | ").map((v) => v.trim());
      const zodEnum = `z.enum([${literalValues.join(", ")}])`;
      return isNullable ? `${zodEnum}.nullable()` : zodEnum;
    }

    if (type.endsWith('[]')) {
      const baseType = type.slice(0, -2);
      const baseSchema = this.typeToZodSchema(baseType, false, fieldName, tableName);
      const arraySchema = `z.array(${baseSchema})`;
      return isNullable ? `${arraySchema}.nullable()` : arraySchema;
    }

    if (type.startsWith('"') && type.endsWith('"')) {
      const literal = `z.literal(${type})`;
      return isNullable ? `${literal}.nullable()` : literal;
    }

    let zodType: string;
    switch (type) {
      case 'Json': zodType = 'JsonSchema'; break;
      case "string": zodType = this.getSmartStringValidation(fieldName || "", tableName); break;
      case "number": zodType = this.getSmartNumberValidation(fieldName || "", tableName); break;
      case "boolean": zodType = "z.boolean()"; break;
      case "null": zodType = "z.null()"; break;
      case "undefined": zodType = "z.undefined()"; break;
      default:
        if (type.includes('"') && type.includes('|')) {
          const literalValues = type.split(' | ').map((v) => v.trim());
          zodType = `z.enum([${literalValues.join(', ')}])`;
        } else if (type.trim() === 'unknown' || type.trim() === '') {
          zodType = 'z.any()';
        } else {
          zodType = 'z.string()';
        }
    }

    return isNullable ? `${zodType}.nullable()` : zodType;
  }

  private getSmartStringValidation(fieldName: string, tableName?: string): string {
    void tableName; // reserved for future use
    const lowerName = fieldName.toLowerCase();
    for (const rule of this.config.stringRules) {
      for (const pattern of rule.fieldPatterns) {
        if (this.matchesPattern(lowerName, pattern)) {
          return rule.validation;
        }
      }
    }
    return 'z.string()';
  }

  private getSmartNumberValidation(fieldName: string, tableName?: string): string {
    void tableName;
    const lowerName = fieldName.toLowerCase();
    for (const rule of this.config.numberRules) {
      for (const pattern of rule.fieldPatterns) {
        if (this.matchesPattern(lowerName, pattern)) {
          return rule.validation;
        }
      }
    }
    return "z.number()";
  }

  private matchesTableName(ruleTableName?: string, actualTableName?: string): boolean {
    if (!ruleTableName) return true;
    if (!actualTableName) return false;
    return actualTableName.toLowerCase().includes(ruleTableName.toLowerCase());
  }

  private matchesPattern(fieldName: string, pattern: string): boolean {
    if (pattern.startsWith("^") && pattern.endsWith("$")) {
      return new RegExp(pattern).test(fieldName);
    }
    if (pattern.includes("*") || pattern.includes(".") || pattern.includes("^") || pattern.includes("$") || pattern.includes("[") || pattern.includes("]")) {
      return new RegExp(pattern).test(fieldName);
    }
    return fieldName.includes(pattern);
  }

  generateZodSchemas(types: TypeInfo[]): string {
    let output = "// Auto-generated Zod schemas from flattened-types.ts\n\n";
    output += 'import { z } from "zod";\n\n';
    output += 'import { UserRole } from "@/types/user-roles";\n\n';
    output += 'import { JsonSchema } from "@/types/custom";\n\n';

    const tableTypes = types.filter((t) => t.name.endsWith("Row") || t.name.endsWith("Insert") || t.name.endsWith("Update"));
    const viewTypes = types.filter((t) => t.name.includes("v_"));
    const enumTypes = types.filter((t) => !t.name.endsWith("Row") && !t.name.endsWith("Insert") && !t.name.endsWith("Update") && !t.name.startsWith("Auth")); // Exclude AuthEnums

    if (tableTypes.length > 0) {
      output += "// ============= TABLE SCHEMAS =============\n\n";
      for (const type of tableTypes) output += this.generateTypeSchema(type);
    }

    if (viewTypes.length > 0) {
      output += "// ============= VIEW SCHEMAS =============\n\n";
      for (const type of viewTypes) output += this.generateTypeSchema(type);
    }

    if (enumTypes.length > 0) {
      output += "// ============= ENUM SCHEMAS =============\n\n";
      for (const type of enumTypes) {
        if (type.properties.length === 0) continue;
        output += this.generateTypeSchema(type);
      }
    }

    output += "// ============= TYPE EXPORTS =============\n\n";
    for (const type of types) {
      // Exclude internal Auth types from exports if they slipped through
      if (!type.name.startsWith("Auth") || type.name.startsWith("AuthUsers")) {
          if (type.properties.length > 0) {
            const schemaName = `${type.name.charAt(0).toLowerCase()}${type.name.slice(1)}Schema`;
            output += `export type ${type.name}Schema = z.infer<typeof ${schemaName}>;\n`;
          }
      }
    }

    return output;
  }

  private toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  private generateTypeSchema(type: TypeInfo): string {
    if (type.properties.length === 0) return "";

    const baseTableName = type.name.replace(/(Row|Insert|Update)$/, "");
    const snakeCaseTableName = this.toSnakeCase(baseTableName);
    const schemaName = `${type.name.charAt(0).toLowerCase()}${type.name.slice(1)}Schema`;
    
    let output = `export const ${schemaName} = z.object({\n`;

    for (const prop of type.properties) {
      const zodType = this.typeToZodSchema(
        prop.type,
        prop.isNullable,
        prop.name,
        snakeCaseTableName
      );
      const finalType = prop.isOptional ? `${zodType}.optional()` : zodType;
      output += `  ${prop.name}: ${finalType},\n`;
    }

    output += "});\n\n";
    return output;
  }
}

async function main() {
  try {
    const flattenedTypesPath = path.join(process.cwd(), "types/flattened-types.ts");
    if (!fs.existsSync(flattenedTypesPath)) {
      console.error("❌ flattened-types.ts not found. Run gen:flattened first.");
      process.exit(1);
    }

    console.log("🔍 Converting TypeScript types to Zod schemas...");
    const converter = new TypeScriptToZodConverter(flattenedTypesPath);
    const types = converter.extractTypes();
    console.log(`✅ Found ${types.length} types to convert`);

    const zodSchemas = converter.generateZodSchemas(types);
    const outputPath = path.join(process.cwd(), "schemas/zod-schemas.ts");
    fs.writeFileSync(outputPath, zodSchemas, "utf-8");
    console.log(`🎉 Generated Zod schemas: ${outputPath}`);
  } catch (error) {
    console.error("❌ Error generating Zod schemas:", error);
    process.exit(1);
  }
}

main();