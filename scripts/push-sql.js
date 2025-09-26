#!/usr/bin/env node
/**
 * Push SQL files or folders to PostgreSQL using existing PG environment variables.
 *
 * This script can handle:
 * - Individual .sql files
 * - Folders containing .sql files (recursively processed)
 * - Multiple files/folders in one command
 *
 * It correctly handles numbered prefixes in folders and files (e.g., '2_folder'
 * comes before '10_folder') by using a "natural sort" algorithm. It also stops
 * execution immediately if any SQL script fails.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// --- 1. MAIN EXECUTION ---

export function runPushSql(targets = process.argv.slice(2)) {
  if (targets.length === 0) {
    console.error('❌ Please provide SQL files or folders to process.');
    console.error('   Examples:');
    console.error('     node push-all.js migrations/                    # Push entire folder');
    console.error('     node push-all.js script.sql                    # Push single file');
    console.error('     node push-all.js file1.sql migrations/ file2.sql  # Push multiple targets');
    process.exit(1);
  }

  // Validate all targets exist
  for (const target of targets) {
    if (!fs.existsSync(target)) {
      console.error(`❌ File or folder not found: ${target}`);
      process.exit(1);
    }
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

  console.log(`📂 Processing targets: ${targets.join(', ')}`);
  if (dbUrl) {
    console.log(`🔗 Using SUPABASE_DB_URL`);
  } else {
    console.log(`🔗 Using PG variables: ${pgUser}@${pgHost}:${pgPort || 5432}/${pgDatabase || 'postgres'}`);
  }

  // --- 3. MAIN EXECUTION ---

  try {
    console.log('\n🔍 Processing all targets...');

    let allSqlFiles = [];

    // Process each target and collect all SQL files
    for (const target of targets) {
      const stat = fs.statSync(target);

      if (stat.isFile()) {
        if (target.endsWith('.sql')) {
          allSqlFiles.push(target);
          console.log(`📄 Added file: ${target}`);
        } else {
          console.warn(`⚠️  Skipping non-SQL file: ${target}`);
        }
      } else if (stat.isDirectory()) {
        const folderFiles = getAllSqlFiles(target);
        allSqlFiles = allSqlFiles.concat(folderFiles);
        console.log(`📁 Added ${folderFiles.length} files from folder: ${target}`);
      }
    }

    if (allSqlFiles.length === 0) {
      console.log('🟡 No .sql files found to execute.');
      process.exit(0);
    }

    console.log('🔀 Sorting files using natural sort to ensure correct execution order...');
    allSqlFiles.sort(naturalSort); // Use the custom sort function

    console.log(`\n▶️  Found ${allSqlFiles.length} scripts to execute in the following order:`);
    allSqlFiles.forEach((file, index) => {
      // Show relative path for cleaner display
      const displayPath = path.relative(process.cwd(), file);
      console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${displayPath}`);
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
    } else {
      psqlEnv.PGHOST = pgHost;
      psqlEnv.PGPORT = pgPort || '5432';
      psqlEnv.PGDATABASE = pgDatabase || 'postgres';
      psqlEnv.PGUSER = pgUser;
      psqlEnv.PGPASSWORD = pgPassword;
    }

    // Execute each file in the correctly sorted order
    for (const file of allSqlFiles) {
      const displayPath = path.relative(process.cwd(), file);
      console.log(`   ▶ Running: ${displayPath}`);
      // Use ON_ERROR_STOP=1 to make psql exit immediately if an error occurs.
      // Use -q to suppress NOTICE messages (quiet mode)
      const command = `psql -q -v ON_ERROR_STOP=1 -f "${file}"`;

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

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  runPushSql();
}

export default runPushSql;

// # Push multiple folders
// node push-all.js migrations/ seeds/

// # Push specific folder
// npm run push:migrations
// npm run push:seeds

// # Push custom files/folders (pass arguments)
// npm run push:sql -- file1.sql migrations/ file2.sql

// # Push single file
// npm run push:sql -- data/init.sql