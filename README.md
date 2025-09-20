## How to push sql creation on supabase

First, Install Supabase CLI locally:

```bash
npm install supabase dotenv-cli --save-dev
```

## Use individual environment variables

```sh
PGHOST=db.yunvefyvwbqaigkawcvj.supabase.co
PGPORT=5432
PGDATABASE=postgres
PGUSER=postgres
PGPASSWORD=your_password_here
```

## Add the recursive push script in your project

### data/scripts/debug-connection.js

```js
#!/usr/bin/env node
/**
 * Debug PostgreSQL connection
 */

console.log('🔍 Debugging PostgreSQL connection...');

const dbUrl = process.env.SUPABASE_DB_URL;
const pgVars = {
  PGHOST: process.env.PGHOST,
  PGPORT: process.env.PGPORT,
  PGDATABASE: process.env.PGDATABASE,
  PGUSER: process.env.PGUSER,
  PGPASSWORD: process.env.PGPASSWORD ? '****' : undefined
};

console.log('\n📋 Environment Variables:');
console.log('SUPABASE_DB_URL:', dbUrl ? 'SET' : 'NOT SET');
console.log('PG Variables:', pgVars);

if (!dbUrl && !pgVars.PGHOST) {
  console.log('\n❌ No database connection configured!');
  console.log('\n💡 You need to set either:');
  console.log('Option 1 - SUPABASE_DB_URL in your .env:');
  console.log('SUPABASE_DB_URL=postgresql://postgres:password@db.yunvefyvwbqaigkawcvj.supabase.co:5432/postgres');
  console.log('\nOption 2 - Individual PG variables in your .env:');
  console.log('PGHOST=db.yunvefyvwbqaigkawcvj.supabase.co');
  console.log('PGPORT=5432');
  console.log('PGDATABASE=postgres');
  console.log('PGUSER=postgres');
  console.log('PGPASSWORD=your_password_here');
  process.exit(1);
}

// Test connection
const { execSync } = require('child_process');

try {
  console.log('\n🧪 Testing connection...');
  
  if (dbUrl) {
    console.log('Using SUPABASE_DB_URL...');
    const url = new URL(dbUrl.trim());
    const env = {
      ...process.env,
      PGHOST: url.hostname,
      PGPORT: url.port || '5432',
      PGDATABASE: url.pathname.slice(1) || 'postgres',
      PGUSER: url.username,
      PGPASSWORD: url.password
    };
    
    execSync('psql -c "SELECT version();"', {
      stdio: 'inherit',
      env: env
    });
  } else {
    console.log('Using PG environment variables...');
    execSync('psql -c "SELECT version();"', {
      stdio: 'inherit'
    });
  }
  
  console.log('✅ Connection successful!');
  
} catch (err) {
  console.error('\n❌ Connection failed:', err.message);
  console.log('\n💡 Troubleshooting steps:');
  console.log('1. Verify your database credentials');
  console.log('2. Check if psql is installed: psql --version');
  console.log('3. Try connecting manually: psql -h your_host -U your_user -d your_database');
  console.log('4. Check if your IP is whitelisted in Supabase dashboard');
}
```

### data/scripts/push-sql.js

```js
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
```

## In package.json:

```json
"scripts": {
    "supabase": "supabase",
    "push:all": "dotenv -e .env node data/scripts/push-sql.js",
    "push:folder": "dotenv -e .env node data/scripts/push-sql.js",
    "debug:script": "dotenv -e .env node data/scripts/debug-connection.js"
}
```

## Check connection

```sh
npm run debug:script
```

## run script

```sh
npm run push:folder folder_name
```

