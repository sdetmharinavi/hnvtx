const fs = require('fs');
const path = require('path');

class NextJsAppRouterUnusedFileFinder {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.allFiles = new Set();
    this.referencedFiles = new Set();
    this.excludePatterns = [
      /node_modules/,
      /\.next/,
      /\.git/,
      /dist/,
      /build/,
      /coverage/,
      /\.test\./,
      /\.spec\./,
      /\.d\.ts$/,
      /next\.config\.(js|mjs|ts)$/,
      /tailwind\.config\.(js|ts)$/,
      /postcss\.config\.js$/,
      /package\.json$/,
      /README\.md$/,
      /\.env/,
      /tsconfig\.json$/,
      /jsconfig\.json$/
    ];
    this.extensions = ['.js', '.jsx', '.ts', '.tsx'];
  }

  getAllFiles(dir = this.projectRoot) {
    const files = [];
    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !this.shouldExclude(fullPath)) {
          files.push(...this.getAllFiles(fullPath));
        } else if (stat.isFile() && this.isValidExtension(fullPath) && !this.shouldExclude(fullPath)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }

    return files;
  }

  shouldExclude(filePath) {
    return this.excludePatterns.some(pattern => pattern.test(filePath));
  }

  isValidExtension(filePath) {
    return this.extensions.some(ext => filePath.endsWith(ext));
  }

  extractReferences(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const references = new Set();

      // Enhanced patterns for App Router
      const patterns = [
        // ES6 imports
        /import\s+(?:.*?\s+from\s+)?['"`]([^'"`]+)['"`]/g,
        // Dynamic imports
        /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
        // Require statements
        /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
        // Next.js dynamic imports
        /dynamic\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
        // Link href patterns
        /href\s*=\s*['"`]([^'"`]+)['"`]/g,
        // Router push/replace patterns
        /(?:push|replace)\s*\(\s*['"`]([^'"`]+)['"`]/g,
        // Image src patterns for local images
        /src\s*=\s*['"`](\/[^'"`]+)['"`]/g,
        // Route handlers and metadata references
        /route\s*:\s*['"`]([^'"`]+)['"`]/g
      ];

      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          let importPath = match[1];
          
          // Skip external URLs and node_modules
          if (importPath.startsWith('http') || importPath.startsWith('//') || 
              (!importPath.startsWith('.') && !importPath.startsWith('/') && !importPath.startsWith('@/'))) {
            continue;
          }

          // Handle Next.js @ alias
          if (importPath.startsWith('@/')) {
            importPath = path.join(this.projectRoot, importPath.substring(2));
          }
          // Resolve relative paths
          else if (importPath.startsWith('.')) {
            importPath = path.resolve(path.dirname(filePath), importPath);
          }
          // Handle absolute paths from root
          else if (importPath.startsWith('/')) {
            importPath = path.join(this.projectRoot, 'public', importPath);
            if (fs.existsSync(importPath)) {
              references.add(importPath);
              continue;
            }
            // If not in public, might be a route reference
            continue;
          }

          // Try to resolve the file
          this.resolveFileReference(importPath, references);
        }
      });

      // Special case: look for metadata exports that might reference files
      const metadataMatches = content.match(/export\s+const\s+metadata\s*=\s*{[\s\S]*?}/);
      if (metadataMatches) {
        const iconMatches = metadataMatches[0].match(/icon\s*:\s*['"`]([^'"`]+)['"`]/g);
        if (iconMatches) {
          iconMatches.forEach(match => {
            const iconPath = match.match(/['"`]([^'"`]+)['"`]/)[1];
            if (iconPath.startsWith('/')) {
              const fullIconPath = path.join(this.projectRoot, 'public', iconPath);
              if (fs.existsSync(fullIconPath)) {
                references.add(fullIconPath);
              }
            }
          });
        }
      }

      return references;
    } catch (error) {
      console.warn(`Error reading file ${filePath}:`, error.message);
      return new Set();
    }
  }

  resolveFileReference(importPath, references) {
    // Try the path as-is
    if (fs.existsSync(importPath)) {
      references.add(importPath);
      return;
    }

    // Try with extensions
    for (const ext of this.extensions) {
      const withExt = importPath + ext;
      if (fs.existsSync(withExt)) {
        references.add(withExt);
        return;
      }
    }
    
    // Try index files
    for (const ext of this.extensions) {
      const indexFile = path.join(importPath, `index${ext}`);
      if (fs.existsSync(indexFile)) {
        references.add(indexFile);
        return;
      }
    }

    // Try common Next.js file patterns in the directory
    const nextJsFiles = ['page', 'layout', 'loading', 'error', 'not-found', 'route', 'template', 'default'];
    for (const fileName of nextJsFiles) {
      for (const ext of this.extensions) {
        const nextJsFile = path.join(importPath, `${fileName}${ext}`);
        if (fs.existsSync(nextJsFile)) {
          references.add(nextJsFile);
        }
      }
    }
  }

  // Enhanced Next.js App Router special file detection
  isNextJsAppRouterSpecialFile(filePath) {
    const relativePath = path.relative(this.projectRoot, filePath).replace(/\\/g, '/');
    
    const appRouterPatterns = [
      // Root layout is always used
      /^app\/layout\.(js|jsx|ts|tsx)$/,
      
      // Page files in app directory
      /^app\/.*\/page\.(js|jsx|ts|tsx)$/,
      /^app\/page\.(js|jsx|ts|tsx)$/,
      
      // Layout files
      /^app\/.*\/layout\.(js|jsx|ts|tsx)$/,
      
      // Loading UI
      /^app\/.*\/loading\.(js|jsx|ts|tsx)$/,
      
      // Error UI
      /^app\/.*\/error\.(js|jsx|ts|tsx)$/,
      /^app\/.*\/global-error\.(js|jsx|ts|tsx)$/,
      
      // Not found
      /^app\/.*\/not-found\.(js|jsx|ts|tsx)$/,
      
      // Route handlers (API routes)
      /^app\/.*\/route\.(js|ts)$/,
      
      // Template files
      /^app\/.*\/template\.(js|jsx|ts|tsx)$/,
      
      // Default files (for parallel routes)
      /^app\/.*\/default\.(js|jsx|ts|tsx)$/,
      
      // Metadata files
      /^app\/.*\/(icon|apple-icon|favicon)\.(ico|jpg|jpeg|png|svg)$/,
      /^app\/.*\/opengraph-image\.(jpg|jpeg|png|gif)$/,
      /^app\/.*\/twitter-image\.(jpg|jpeg|png|gif)$/,
      /^app\/.*\/(robots|sitemap)\.(txt|xml|js|ts)$/,
      
      // Legacy pages directory (if still exists)
      /^pages\/.*\.(js|jsx|ts|tsx)$/,
      /^pages\/api\/.*\.(js|ts)$/,
      
      // Root special files
      /^middleware\.(js|ts)$/,
      /^instrumentation\.(js|ts)$/,
      
      // Config files that might be used
      /^app\/globals\.css$/,
      /^styles\/globals\.css$/,
    ];

    return appRouterPatterns.some(pattern => pattern.test(relativePath));
  }

  // Check if file is in public directory
  isPublicAsset(filePath) {
    const relativePath = path.relative(this.projectRoot, filePath).replace(/\\/g, '/');
    return relativePath.startsWith('public/');
  }

  // Check for component files that might be used in app router pages
  isLikelyUsedComponent(filePath) {
    const relativePath = path.relative(this.projectRoot, filePath).replace(/\\/g, '/');
    
    // Components in common directories are likely used
    const likelyUsedPatterns = [
      /^components\/.*\.(js|jsx|ts|tsx)$/,
      /^app\/components\/.*\.(js|jsx|ts|tsx)$/,
      /^lib\/.*\.(js|jsx|ts|tsx)$/,
      /^utils\/.*\.(js|jsx|ts|tsx)$/,
      /^hooks\/.*\.(js|jsx|ts|tsx)$/,
      /^context\/.*\.(js|jsx|ts|tsx)$/,
      /^providers\/.*\.(js|jsx|ts|tsx)$/,
    ];

    return likelyUsedPatterns.some(pattern => pattern.test(relativePath));
  }

  async findUnusedFiles() {
    console.log('🔍 Scanning Next.js App Router project for files...');
    const allFiles = this.getAllFiles();
    console.log(`📁 Found ${allFiles.length} files`);

    // Add all files to our set
    allFiles.forEach(file => this.allFiles.add(file));

    console.log('🔗 Analyzing imports, references, and App Router conventions...');
    
    // Mark Next.js App Router special files as used
    allFiles.forEach(file => {
      if (this.isNextJsAppRouterSpecialFile(file) || this.isPublicAsset(file)) {
        this.referencedFiles.add(file);
      }
    });

    // Extract references from all files
    for (const file of allFiles) {
      const references = this.extractReferences(file);
      references.forEach(ref => this.referencedFiles.add(ref));
    }

    // Find unused files
    const unusedFiles = [];
    const potentiallyUnusedFiles = [];

    this.allFiles.forEach(file => {
      if (!this.referencedFiles.has(file)) {
        if (this.isLikelyUsedComponent(file)) {
          potentiallyUnusedFiles.push(file);
        } else {
          unusedFiles.push(file);
        }
      }
    });

    return {
      definitelyUnused: unusedFiles.map(file => path.relative(this.projectRoot, file)),
      potentiallyUnused: potentiallyUnusedFiles.map(file => path.relative(this.projectRoot, file))
    };
  }

  async generateReport() {
    const { definitelyUnused, potentiallyUnused } = await this.findUnusedFiles();
    
    console.log('\n📊 NEXT.JS APP ROUTER - UNUSED FILES REPORT');
    console.log('='.repeat(60));
    
    if (definitelyUnused.length === 0 && potentiallyUnused.length === 0) {
      console.log('✅ No unused files found!');
      return;
    }

    if (definitelyUnused.length > 0) {
      console.log(`❗ ${definitelyUnused.length} files that appear to be unused:\n`);
      
      const byDirectory = {};
      definitelyUnused.forEach(file => {
        const dir = path.dirname(file) || '.';
        if (!byDirectory[dir]) byDirectory[dir] = [];
        byDirectory[dir].push(path.basename(file));
      });

      Object.keys(byDirectory).sort().forEach(dir => {
        console.log(`📂 ${dir}/`);
        byDirectory[dir].forEach(file => {
          console.log(`   ❌ ${file}`);
        });
        console.log();
      });
    }

    if (potentiallyUnused.length > 0) {
      console.log(`⚠️  ${potentiallyUnused.length} files in common directories that might be unused:\n`);
      
      const byDirectory = {};
      potentiallyUnused.forEach(file => {
        const dir = path.dirname(file) || '.';
        if (!byDirectory[dir]) byDirectory[dir] = [];
        byDirectory[dir].push(path.basename(file));
      });

      Object.keys(byDirectory).sort().forEach(dir => {
        console.log(`📂 ${dir}/`);
        byDirectory[dir].forEach(file => {
          console.log(`   ⚠️  ${file}`);
        });
        console.log();
      });
    }

    console.log('📝 NOTES FOR APP ROUTER:');
    console.log('   - App Router uses file-system based routing');
    console.log('   - page.tsx, layout.tsx, loading.tsx etc. are automatically used');
    console.log('   - Components might be imported dynamically or server-side');
    console.log('   - Files in /public are served as static assets');
    console.log('   - Review "potentially unused" files carefully');
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('   1. Start by removing files in the "definitely unused" list');
    console.log('   2. Search your codebase for dynamic imports of "potentially unused" files');
    console.log('   3. Check if any files are used in middleware or instrumentation');
    console.log('   4. Test thoroughly after removing files');
  }
}

// Usage
if (require.main === module) {
  const finder = new NextJsAppRouterUnusedFileFinder();
  finder.generateReport().catch(console.error);
}

module.exports = NextJsAppRouterUnusedFileFinder;