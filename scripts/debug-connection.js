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
import { execSync } from 'child_process';

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