// path: app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { createAdmin } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { UserRole } from '@/types/user-roles';

export async function POST(req: Request) {
  try {
    // 1. Authorization Check
    // We must verify the requester is actually an Admin/Super Admin before allowing creation.
    const supabase = await createClient();
    const { data: { user: requester }, error: authError } = await supabase.auth.getUser();

    if (authError || !requester) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use RPC to check permissions safely
    const { data: isSuperAdmin } = await supabase.rpc('is_super_admin');
    const { data: myRole } = await supabase.rpc('get_my_role');

    const allowedRoles = [UserRole.ADMIN, UserRole.ADMINPRO];
    // Check if user is super admin OR has an allowed admin role
    const hasPermission = isSuperAdmin || (myRole && allowedRoles.includes(myRole as UserRole));

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges.' }, { status: 403 });
    }

    // 2. Parse Input
    const body = await req.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { email, password, first_name, last_name, role, email_confirm, id } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Perform Creation via Admin API
    const supabaseAdmin = createAdmin();

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: email_confirm ?? false, // Auto-confirm if requested
      user_metadata: {
        first_name,
        last_name,
        // We store role in metadata initially, but our trigger 'on_auth_user_created'
        // might read this or defaults. The trigger 'sync_user_role_to_auth' usually
        // syncs from public.user_profiles back to auth.users.
        // However, for initial creation, we should rely on the metadata to pass info to the trigger.
        role: role, 
      }
    });

    if (createError) {
      console.error('Supabase Admin Create Error:', createError);
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    if (!newUser.user) {
      return NextResponse.json({ error: 'Failed to create user object' }, { status: 500 });
    }

    // 4. Post-Creation: Ensure Role is set correctly
    // The trigger `create_public_profile_for_new_user` runs on INSERT to auth.users.
    // It creates the profile. We now need to ensure the `role` in `public.user_profiles` is correct.
    // The trigger might default to 'viewer' or 'mng_admin'.
    
    // We explicitly update the profile to ensure the role is set correctly immediately.
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({ role: role })
      .eq('id', newUser.user.id);

    if (profileError) {
      console.error('Failed to set user role in profile:', profileError);
      // We don't fail the request, but we log it. The user exists, just might have wrong role.
    }
    
    // Also force update auth.users app_metadata if needed (Supabase might handle this via trigger sync)
    await supabaseAdmin.auth.admin.updateUserById(newUser.user.id, {
        app_metadata: { role: role }
    });

    return NextResponse.json({ user: newUser.user });

  } catch (err: unknown) {
    console.error('Error in user creation route:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    // 1. Authorization Check
    const supabase = await createClient();
    const { data: { user: requester } } = await supabase.auth.getUser();

    if (!requester) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: isSuperAdmin } = await supabase.rpc('is_super_admin');
    const { data: myRole } = await supabase.rpc('get_my_role');
    
    // Strictly Super Admin or Admin Pro for deletion
    const canDelete = isSuperAdmin || myRole === UserRole.ADMINPRO;

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden: Only Super Admins or Admin Pro can delete users.' }, { status: 403 });
    }

    const { userIds } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }

    // 2. Perform Deletion via Admin API
    const supabaseAdmin = createAdmin();
    const deletionErrors: { id: string; error: string }[] = [];
    let successCount = 0;

    for (const id of userIds) {
      // Prevent deleting self
      if (id === requester.id) {
          deletionErrors.push({ id, error: "Cannot delete your own account." });
          continue;
      }

      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (error) {
        console.error(`Failed to delete user ${id}:`, error.message);
        deletionErrors.push({ id, error: error.message });
      } else {
        successCount++;
      }
    }

    if (deletionErrors.length > 0 && successCount === 0) {
        return NextResponse.json({ error: 'Failed to delete users', details: deletionErrors }, { status: 500 });
    }

    return NextResponse.json({ 
        message: 'Batch deletion processed', 
        successCount, 
        errors: deletionErrors 
    });

  } catch (err: unknown) {
    console.error('Error processing delete request:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}