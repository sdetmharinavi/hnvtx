#!/usr/bin/env node
/**
 * Push all .sql files from a folder (recursively) to PostgreSQL using existing PG environment variables.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Arguments
const folder = process.argv[2];
if (!folder) {
  console.error('❌ Please provide a folder path, e.g. npm run push:folder 11_user_management');
  process.exit(1);
}

const baseFolder = path.join('data', 'telecom_network_db', folder);
if (!fs.existsSync(baseFolder)) {
  console.error(`❌ Folder not found: ${baseFolder}`);
  process.exit(1);
}

// Check for database connection info
const dbUrl = process.env.SUPABASE_DB_URL;
const pgHost = process.env.PGHOST;
const pgUser = process.env.PGUSER;
const pgPassword = process.env.PGPASSWORD;
const pgDatabase = process.env.PGDATABASE;
const pgPort = process.env.PGPORT;

if (!dbUrl && !pgHost) {
  console.error('❌ Database connection not configured. Set either:');
  console.error('   SUPABASE_DB_URL=postgresql://user:pass@host:port/database');
  console.error('   OR individual PG variables: PGHOST, PGUSER, PGPASSWORD, etc.');
  process.exit(1);
}

console.log(`📂 Running folder: ${folder}`);

if (dbUrl) {
  console.log(`🔗 Using SUPABASE_DB_URL`);
} else {
  console.log(`🔗 Using PG variables: ${pgUser}@${pgHost}:${pgPort || 5432}/${pgDatabase || 'postgres'}`);
}

function runFolder(dir) {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      runFolder(fullPath); // recurse into subfolders
    } else if (item.endsWith('.sql')) {
      console.log(`   ▶ Running: ${fullPath}`);
      try {
        let command;
        let env = { ...process.env };

        if (dbUrl) {
          // Use connection URL
          const url = new URL(dbUrl.trim());
          env.PGHOST = url.hostname;
          env.PGPORT = url.port || '5432';
          env.PGDATABASE = url.pathname.slice(1) || 'postgres';
          env.PGUSER = url.username;
          env.PGPASSWORD = url.password;
        }
        // If using PG vars, they're already in process.env

        command = `psql -f "${fullPath}"`;
        
        execSync(command, {
          stdio: 'inherit',
          env: env
        });
        
      } catch (err) {
        console.error(`❌ Failed: ${fullPath}`);
        console.error(`Error: ${err.message}`);
        console.error('💡 Check your database connection settings');
        process.exit(1);
      }
    }
  });
}

runFolder(baseFolder);
console.log('✅ All scripts executed successfully.');