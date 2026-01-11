// path: app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { createAdmin } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';

const pgHost = process.env.PGHOST;
const pgUser = process.env.PGUSER;
const pgPassword = process.env.PGPASSWORD;
const pgDatabase = process.env.PGDATABASE;
const pgPort = process.env.PGPORT;

const pool = new Pool({
  connectionString: `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}`,
});

// This function handles creating users MANUALLY
export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const userData = await req.json();
    const hashed = await bcrypt.hash(userData.password, 10);

    // THE FIX: The manual transaction and the second INSERT have been removed.
    // The database trigger 'on_auth_user_created' is now the single source of truth
    // for creating a corresponding user profile.
    const { rows: authUserRows } = await client.query(
      `
      INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, role)
      VALUES ($1, '00000000-0000-0000-0000-000000000000', $2, $3, $4, $5, $6, $7)
      RETURNING id, email
      `,
      [
        userData.id,
        userData.email,
        hashed,
        userData.email_confirm ? new Date().toISOString() : null,
        JSON.stringify({
          provider: 'email',
          providers: ['email'],
        }),
        JSON.stringify({
          first_name: userData.first_name,
          last_name: userData.last_name,
        }),
        userData.role, // Pass the role directly to auth.users
      ]
    );

    const createdAuthUser = authUserRows[0];
    if (!createdAuthUser) {
      throw new Error('Failed to create user in auth.users');
    }

    return NextResponse.json({ user: createdAuthUser });
  } catch (err: unknown) {
    console.error('Error inserting user:', err);
    const errorMessage =
      err instanceof Error ? err.message : 'An unknown error occurred during user creation.';
    if (
      typeof errorMessage === 'string' &&
      errorMessage.includes('duplicate key value violates unique constraint "users_email_key"')
    ) {
      const { email } = await req.json();
      return NextResponse.json(
        { error: `A user with the email "${email}" already exists.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}

// DELETE function remains the same
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Forbidden: Authentication required.' }, { status: 401 });
    }

    const { data: isSuperAdmin, error: rpcError } = await supabase.rpc('is_super_admin');

    if (rpcError) {
      console.error('RPC error checking admin status:', rpcError);
      return NextResponse.json({ error: 'Could not verify user permissions.' }, { status: 500 });
    }

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to perform this action.' },
        { status: 403 }
      );
    }

    const { userIds } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }

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
      return NextResponse.json(
        {
          message: `Completed with ${deletionErrors.length} errors.`,
          errors: deletionErrors,
        },
        { status: 500 }
      );
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
