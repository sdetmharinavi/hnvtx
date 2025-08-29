

// // app/api/admin/users/route.ts
// import { createAdmin } from "@/utils/supabase/admin";
// import { NextResponse } from "next/server";

// export async function POST(request: Request) {
//   try {
//     const userData = await request.json();
//     const supabase = createAdmin();

//     // Create the user in auth
//     const { data, error } = await supabase.auth.admin.createUser({
//       id: userData.id,
//       email: userData.email,
//       password: userData.password,
//       email_confirm: userData.email_confirm ?? true,
//     });

//     if (error) {
//       console.error("Error creating user:", error);
//       return NextResponse.json(
//         { error: error.message },
//         { status: error.status || 500 }
//       );
//     }

//     // Insert/Update user profile in public table
//     if (data.user) {
//       await supabase.from("user_profiles").upsert({
//         id: data.user.id,
//         email: data.user.email,
//         role: userData.role || "viewer",
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//       });
//     }

//     return NextResponse.json(data);
//   } catch (error: any) {
//     console.error("Error in user creation API:", error);
//     return NextResponse.json(
//       { error: error.message || "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// +++++++++++++= For forced UUID insertion, Supabase many functions like reset password etc not work with this method
// +++++++++++++= So we are using raw SQL to insert user
// +++++++++++++= This is a temporary solution
// +++++++++++++= 
// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcrypt";

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
      await client.query("BEGIN");

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
      console.log("USER PAYLOAD:", {
        id: userData.id,
        email: userData.email,
        password: userData.password,
        email_confirm: userData.email_confirm,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        status: userData.status,
      });

      // const userId = rows[0].id;

      // // 2️⃣ Insert into public.user_profiles
      // await client.query(
      //   `
      //   INSERT INTO public.user_profiles (
      //     id, first_name, last_name, role, status, created_at, updated_at
      //   )
      //   VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      //   `,
      //   [
      //     userId,
      //     (userData.first_name || "N/A").trim(),
      //     (userData.last_name || "N/A").trim(), // ✅ no empty string
      //     userData.role || "viewer",
      //     userData.status || "inactive",
      //   ]
      // );
      // console.log("PROFILE PAYLOAD:", {
      //   first: userData.first_name,
      //   last: userData.last_name,
      //   role: userData.role,
      //   status: userData.status,
      // });
      await client.query("COMMIT");

      return NextResponse.json({ user: rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Error inserting user:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

