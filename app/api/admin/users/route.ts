// app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { createAdmin } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import type { User } from '@supabase/supabase-js';

const pgHost = process.env.PGHOST;
const pgUser = process.env.PGUSER;
const pgPassword = process.env.PGPASSWORD;
const pgDatabase = process.env.PGDATABASE;
const pgPort = process.env.PGPORT;

const pool = new Pool({
  connectionString: `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}`,
});

// This function handles creating users
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

// This function handles deleting users
export async function DELETE(req: Request) {
  try {
    // **STEP 1: AUTHORIZATION CHECK (CORRECTED)**
    const supabase = await createClient(); // Creates a server client in the context of the user making the request
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Forbidden: Authentication required.' }, { status: 401 });
    }

    // **THE FIX: Call the is_super_admin() RPC function to securely check the user's status.**
    const { data: isSuperAdmin, error: rpcError } = await supabase.rpc('is_super_admin');

    console.log("isSuperAdmin", isSuperAdmin);
    console.log("rpcError", rpcError);
    

    if (rpcError) {
      console.error('RPC error checking admin status:', rpcError);
      return NextResponse.json({ error: 'Could not verify user permissions.' }, { status: 500 });
    }

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }
    
    // If the check passes, proceed with the deletion logic.
    const { userIds } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }

    // **STEP 2: ADMIN ACTION**
    const supabaseAdmin = createAdmin();
    const deletionErrors: { id: string; error: string }[] = [];

    for (const id of userIds) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (error) {
        console.error(`Failed to delete user ${id}:`, error.message);
        deletionErrors.push({ id, error: error.message });
      }
    }

    if (deletionErrors.length > 0) {
      return NextResponse.json({
        message: `Completed with ${deletionErrors.length} errors.`,
        errors: deletionErrors,
      }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Users deleted successfully' });

  } catch (err: unknown) {
    console.error('Error processing delete request:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}