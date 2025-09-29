import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

interface TableInfo {
  name: string;
  schema: string;
  row?: string;
  insert?: string;
  update?: string;
}

interface ViewInfo {
  name: string;
  schema: string;
  row?: string;
}

interface EnumInfo {
  name: string;
  schema: string;
  values: string[];
}

class SupabaseTypeExtractor {
  private sourceFile: ts.SourceFile;
  private checker: ts.TypeChecker;

  constructor(filePath: string) {
    const program = ts.createProgram([filePath], {});
    this.sourceFile = program.getSourceFile(filePath)!;
    this.checker = program.getTypeChecker();
  }

  extract() {
    const tables: TableInfo[] = [];
    const views: ViewInfo[] = [];
    const enums: EnumInfo[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isTypeAliasDeclaration(node) && node.name.text === 'Database') {
        this.extractFromDatabaseType(node, tables, views, enums);
      }
      ts.forEachChild(node, visit);
    };

    visit(this.sourceFile);
    return { tables, views, enums };
  }

  private extractFromDatabaseType(
    node: ts.TypeAliasDeclaration,
    tables: TableInfo[],
    views: ViewInfo[],
    enums: EnumInfo[]
  ) {
    if (!ts.isTypeLiteralNode(node.type)) return;

    for (const member of node.type.members) {
      if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
        const schemaName = member.name.text;
        if (member.type && ts.isTypeLiteralNode(member.type)) {
          this.extractFromSchema(member.type, schemaName, tables, views, enums);
        }
      }
    }
  }

  private extractFromSchema(
    schemaNode: ts.TypeLiteralNode,
    schemaName: string,
    tables: TableInfo[],
    views: ViewInfo[],
    enums: EnumInfo[]
  ) {
    for (const member of schemaNode.members) {
      if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
        const sectionName = member.name.text;

        if (
          sectionName === 'Tables' &&
          member.type &&
          ts.isTypeLiteralNode(member.type)
        ) {
          this.extractTables(member.type, schemaName, tables);
        } else if (
          sectionName === 'Views' &&
          member.type &&
          ts.isTypeLiteralNode(member.type)
        ) {
          this.extractViews(member.type, schemaName, views);
        } else if (
          sectionName === 'Enums' &&
          member.type &&
          ts.isTypeLiteralNode(member.type)
        ) {
          this.extractEnums(member.type, schemaName, enums);
        }
      }
    }
  }

  private extractTables(
    tablesNode: ts.TypeLiteralNode,
    schemaName: string,
    tables: TableInfo[]
  ) {
    for (const member of tablesNode.members) {
      if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
        const tableName = member.name.text;
        const tableInfo: TableInfo = { name: tableName, schema: schemaName };

        if (member.type && ts.isTypeLiteralNode(member.type)) {
          this.extractTableStructure(member.type, tableInfo);
        }

        tables.push(tableInfo);
      }
    }
  }

  private extractTableStructure(
    tableNode: ts.TypeLiteralNode,
    tableInfo: TableInfo
  ) {
    for (const member of tableNode.members) {
      if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
        const propertyName = member.name.text;

        if (propertyName === 'Row' && member.type) {
          tableInfo.row = this.typeToString(member.type);
        } else if (propertyName === 'Insert' && member.type) {
          tableInfo.insert = this.typeToString(member.type);
        } else if (propertyName === 'Update' && member.type) {
          tableInfo.update = this.typeToString(member.type);
        }
      }
    }
  }

  private extractViews(
    viewsNode: ts.TypeLiteralNode,
    schemaName: string,
    views: ViewInfo[]
  ) {
    for (const member of viewsNode.members) {
      if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
        const viewName = member.name.text;
        const viewInfo: ViewInfo = { name: viewName, schema: schemaName };

        if (member.type && ts.isTypeLiteralNode(member.type)) {
          this.extractViewStructure(member.type, viewInfo);
        }

        views.push(viewInfo);
      }
    }
  }

  private extractViewStructure(
    viewNode: ts.TypeLiteralNode,
    viewInfo: ViewInfo
  ) {
    for (const member of viewNode.members) {
      if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
        const propertyName = member.name.text;

        if (propertyName === 'Row' && member.type) {
          viewInfo.row = this.typeToString(member.type);
        }
      }
    }
  }

  private extractEnums(
    enumsNode: ts.TypeLiteralNode,
    schemaName: string,
    enums: EnumInfo[]
  ) {
    for (const member of enumsNode.members) {
      if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
        const enumName = member.name.text;
        const enumInfo: EnumInfo = {
          name: enumName,
          schema: schemaName,
          values: [],
        };

        if (member.type && ts.isUnionTypeNode(member.type)) {
          enumInfo.values = this.extractUnionValues(member.type);
        }

        enums.push(enumInfo);
      }
    }
  }

  private extractUnionValues(unionNode: ts.UnionTypeNode): string[] {
    const values: string[] = [];

    for (const type of unionNode.types) {
      if (ts.isLiteralTypeNode(type) && ts.isStringLiteral(type.literal)) {
        values.push(type.literal.text);
      }
    }

    return values;
  }

  private typeToString(node: ts.TypeNode): string {
    const printer = ts.createPrinter();
    return printer.printNode(ts.EmitHint.Unspecified, node, this.sourceFile);
  }
}

function generateFlattenedTypes(
  tables: TableInfo[],
  views: ViewInfo[],
  enums: EnumInfo[]
): string {
  let output = '// Auto-generated from types/supabase-types.ts\n\n';

  // Import the Json type
  output += 'import type { Json, Database } from "@/types/supabase-types";\n\n';

  // Generate table types
  output += '// ============= TABLES =============\n\n';

  for (const table of tables) {
    const capitalizedName =
      table.name.charAt(0).toUpperCase() + table.name.slice(1);
    const schemaPrefix =
      table.schema === 'public' ? '' : `${capitalizeFirst(table.schema)}`;

    if (table.row) {
      output += `export type ${schemaPrefix}${capitalizedName}Row = ${table.row};\n\n`;
    }

    if (table.insert) {
      output += `export type ${schemaPrefix}${capitalizedName}Insert = ${table.insert};\n\n`;
    }

    if (table.update) {
      output += `export type ${schemaPrefix}${capitalizedName}Update = ${table.update};\n\n`;
    }
  }

  // Generate view types
  if (views.length > 0) {
    output += '// ============= VIEWS =============\n\n';

    for (const view of views) {
      const capitalizedName =
        view.name.charAt(0).toUpperCase() + view.name.slice(1);
      const schemaPrefix =
        view.schema === 'public' ? '' : `${capitalizeFirst(view.schema)}`;

      if (view.row) {
        output += `export type ${schemaPrefix}${capitalizedName}Row = ${view.row};\n\n`;
      }
    }
  }

  // Generate enum types
  if (enums.length > 0) {
    output += '// ============= ENUMS =============\n\n';

    for (const enumInfo of enums) {
      const capitalizedName =
        enumInfo.name.charAt(0).toUpperCase() + enumInfo.name.slice(1);
      const schemaPrefix =
        enumInfo.schema === 'public'
          ? ''
          : `${capitalizeFirst(enumInfo.schema)}`;
      const unionType = enumInfo.values.map((v) => `"${v}"`).join(' | ');

      output += `export type ${schemaPrefix}${capitalizedName} = ${unionType};\n\n`;
    }
  }

  // Generate lists of table and view names for runtime checks
  output += '// ============= HELPERS =============\n\n';

  const tableNamesArray = tables.map(t => `"${t.name}"`).join(',\n  ');
  output += `export const tableNames = [\n  ${tableNamesArray}\n] as const;\n\n`;

  const viewNamesArray = views.map(v => `"${v.name}"`).join(',\n  ');
  output += `export const viewNames = [\n  ${viewNamesArray}\n] as const;\n\n`;

  return output;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Main execution
async function main() {
  try {
    const supabaseTypesPath = path.join(
      process.cwd(),
      'types/supabase-types.ts'
    );

    if (!fs.existsSync(supabaseTypesPath)) {
      console.error(
        '❌ types/supabase-types.ts not found in current directory'
      );
      process.exit(1);
    }

    console.log('🔍 Extracting types from types/supabase-types.ts...');

    const extractor = new SupabaseTypeExtractor(supabaseTypesPath);
    const { tables, views, enums } = extractor.extract();

    console.log(
      `✅ Found ${tables.length} tables, ${views.length} views, ${enums.length} enums`
    );

    const flattenedTypes = generateFlattenedTypes(tables, views, enums);
    const outputPath = path.join(process.cwd(), 'types/flattened-types.ts');

    fs.writeFileSync(outputPath, flattenedTypes, 'utf-8');

    console.log(`🎉 Generated flattened types: ${outputPath}`);

    // Log summary
    console.log('\n📊 Summary:');
    tables.forEach((table) => {
      const types = [
        table.row && 'Row',
        table.insert && 'Insert',
        table.update && 'Update',
      ]
        .filter(Boolean)
        .join(', ');
      console.log(`  📋 ${table.schema}.${table.name}: ${types}`);
    });

    if (views.length > 0) {
      views.forEach((view) => {
        console.log(`  👁️  ${view.schema}.${view.name}: Row`);
      });
    }

    if (enums.length > 0) {
      enums.forEach((enumInfo) => {
        console.log(
          `  🔤 ${enumInfo.schema}.${enumInfo.name}: ${enumInfo.values.length} values`
        );
      });
    }
  } catch (error) {
    console.error('❌ Error generating flattened types:', error);
    process.exit(1);
  }
}

main();
