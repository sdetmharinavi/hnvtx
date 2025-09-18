// app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pgHost = process.env.PGHOST;
const pgUser = process.env.PGUSER;
const pgPassword = process.env.PGPASSWORD;
const pgDatabase = process.env.PGDATABASE;
const pgPort = process.env.PGPORT;

const pool = new Pool({
  connectionString: `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}`,
});

export async function POST(req: Request) {
  try {
    const userData = await req.json();
    const hashed = await bcrypt.hash(userData.password, 10);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1️⃣ Insert into auth.users
      const { rows } = await client.query(
        `
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
        VALUES ($1, '00000000-0000-0000-0000-000000000000', $2, $3, $4, $5)
        RETURNING id, email
        `,
        [
          userData.id,
          userData.email,
          hashed,
          userData.email_confirm ? new Date().toISOString() : null,
          JSON.stringify({
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role,
            status: userData.status,
          }),
        ]
      );
      console.log('USER PAYLOAD:', {
        id: userData.id,
        email: userData.email,
        password: userData.password,
        email_confirm: userData.email_confirm,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        status: userData.status,
      });

      await client.query('COMMIT');

      return NextResponse.json({ user: rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    console.error('Error inserting user:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
