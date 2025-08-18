#!/usr/bin/env node
/**
 * Push all .sql files from a folder (recursively) to PostgreSQL using existing PG environment variables.
 *
 * This script correctly handles numbered prefixes in folders and files (e.g., '2_folder'
 * comes before '10_folder') by using a "natural sort" algorithm. It also stops
 * execution immediately if any SQL script fails.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// --- 1. ARGUMENT AND ENVIRONMENT SETUP ---

const folder = process.argv[2];
if (!folder) {
  console.error('❌ Please provide the root folder of your SQL scripts.');
  console.error('   Example: node push-all.js telecom_network_db');
  process.exit(1);
}

if (!fs.existsSync(folder)) {
  console.error(`❌ Folder not found: ${folder}`);
  process.exit(1);
}

// Check for database connection info from environment variables
const dbUrl = process.env.SUPABASE_DB_URL;
const pgHost = process.env.PGHOST;
const pgUser = process.env.PGUSER;
const pgPassword = process.env.PGPASSWORD;
const pgDatabase = process.env.PGDATABASE;
const pgPort = process.env.PGPORT;

if (!dbUrl && !pgHost) {
  console.error('❌ Database connection not configured. Set either:');
  console.error("   SUPABASE_DB_URL='postgresql://user:pass@host:port/database'");
  console.error('   OR individual PG variables: PGHOST, PGUSER, PGPASSWORD, etc.');
  process.exit(1);
}

console.log(`📂 Processing SQL files in: ${folder}`);
if (dbUrl) {
  console.log(`🔗 Using SUPABASE_DB_URL`);
} else {
  console.log(`🔗 Using PG variables: ${pgUser}@${pgHost}:${pgPort || 5432}/${pgDatabase || 'postgres'}`);
}


// --- 2. HELPER FUNCTIONS ---

/**
 * Recursively finds all .sql files within a directory and returns them as a flat array.
 * @param {string} dir - The directory to start searching from.
 * @returns {string[]} A flat array of full file paths.
 */
function getAllSqlFiles(dir) {
  let filesToReturn = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      filesToReturn = filesToReturn.concat(getAllSqlFiles(fullPath));
    } else if (item.endsWith('.sql')) {
      filesToReturn.push(fullPath);
    }
  }
  return filesToReturn;
}

/**
 * A natural sort comparator for file paths. It splits paths into segments
 * and compares the leading numbers of each segment numerically. This correctly
 * sorts '2_file.sql' before '10_file.sql'.
 * @param {string} a - The first file path.
 * @param {string} b - The second file path.
 * @returns {number} - A negative, zero, or positive value for sorting.
 */
function naturalSort(a, b) {
  // Regex to find leading numbers followed by an underscore or period.
  const re = /^(\d+)[_.]/;
  const segmentsA = a.split(path.sep);
  const segmentsB = b.split(path.sep);
  const len = Math.min(segmentsA.length, segmentsB.length);

  for (let i = 0; i < len; i++) {
    const segA = segmentsA[i];
    const segB = segmentsB[i];

    const matchA = segA.match(re);
    const matchB = segB.match(re);

    if (matchA && matchB) {
      const numA = parseInt(matchA[1], 10);
      const numB = parseInt(matchB[1], 10);
      if (numA !== numB) {
        return numA - numB; // Compare the extracted numbers directly.
      }
    }

    // If numbers are the same or not present, fall back to standard string comparison.
    const comparison = segA.localeCompare(segB);
    if (comparison !== 0) {
      return comparison;
    }
  }

  // If one path is a subdirectory of the other, the shorter path comes first.
  return segmentsA.length - segmentsB.length;
}


// --- 3. MAIN EXECUTION LOGIC ---

try {
  console.log('\n🔍 Finding all .sql files...');
  const allSqlFiles = getAllSqlFiles(folder);

  if (allSqlFiles.length === 0) {
    console.log('🟡 No .sql files found to execute.');
    process.exit(0);
  }

  console.log('🔀 Sorting files using natural sort to ensure correct execution order...');
  allSqlFiles.sort(naturalSort); // Use the custom sort function

  console.log(`\n▶️  Found ${allSqlFiles.length} scripts to execute in the following order:`);
  allSqlFiles.forEach((file, index) => {
    // Indent sub-directories for readability
    const depth = (file.match(/[\\/]/g) || []).length;
    const indent = '  '.repeat(depth);
    console.log(`   ${indent}${(index + 1).toString().padStart(2, ' ')}. ${path.basename(file)}`);
  });
  console.log('---\n');


  // Prepare environment variables for the psql command
  const psqlEnv = { ...process.env };
  if (dbUrl) {
    const url = new URL(dbUrl.trim());
    psqlEnv.PGHOST = url.hostname;
    psqlEnv.PGPORT = url.port || '5432';
    psqlEnv.PGDATABASE = url.pathname.slice(1) || 'postgres';
    psqlEnv.PGUSER = url.username;
    psqlEnv.PGPASSWORD = url.password;
  }

  // Execute each file in the correctly sorted order
  for (const file of allSqlFiles) {
    console.log(`   ▶ Running: ${file}`);
    // Use ON_ERROR_STOP=1 to make psql exit immediately if an error occurs.
    const command = `psql -v ON_ERROR_STOP=1 -f "${file}"`;

    execSync(command, {
      stdio: 'inherit', // Show psql output in real-time
      env: psqlEnv,
    });
  }

  console.log('\n✅ All scripts executed successfully.');

} catch (err) {
  console.error(`\n❌ An error occurred during execution.`);
  console.error(`   The script has been halted. Please check the error message from psql above`);
  console.error(`   to debug the issue in the failed SQL file.`);
  process.exit(1);
}