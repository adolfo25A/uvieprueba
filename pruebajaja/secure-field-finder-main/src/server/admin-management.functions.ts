import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

// Helper: check if the calling user is a super_admin
async function assertSuperAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (!data) throw new Error("Solo el super administrador puede realizar esta acción");
}

// Get current user's role info
export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (data ?? []).map((r) => r.role);
    const isSuperAdmin = roles.includes("super_admin");

    let permissions = null;
    if (!isSuperAdmin) {
      const { data: perms } = await supabaseAdmin
        .from("admin_permissions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      permissions = perms;
    }

    return { roles, isSuperAdmin, permissions };
  });

// List all admins with their permissions (super_admin only)
export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.userId);

    // Get all users with admin or super_admin roles
    const { data: roleEntries } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");

    const entries = roleEntries ?? [];
    const userIds = [...new Set(entries.map((r) => r.user_id))];

    // Get permissions for each
    const { data: permissions } = await supabaseAdmin
      .from("admin_permissions")
      .select("*")
      .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

    // Get user emails from auth
    const admins = [];
    for (const uid of userIds) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(uid);
      const userRoles = entries.filter((r) => r.user_id === uid).map((r) => r.role);
      const perm = (permissions ?? []).find((p) => p.user_id === uid);
      admins.push({
        user_id: uid,
        email: userData?.user?.email ?? "—",
        display_name: perm?.display_name ?? null,
        roles: userRoles,
        permissions: perm ?? null,
      });
    }

    return admins;
  });

// Create a new admin user (super_admin only)
export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      displayName: z.string().min(1).max(100),
      canManageClients: z.boolean(),
      canViewSubmissions: z.boolean(),
      canDownloadSubmissions: z.boolean(),
      canDeleteClients: z.boolean(),
    }).parse(data)
  )
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context.userId);

    // Create auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (createError) throw new Error(createError.message);
    if (!newUser.user) throw new Error("No se pudo crear el usuario");

    const uid = newUser.user.id;

    // Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: uid, role: "admin" });
    if (roleError) throw new Error(roleError.message);

    // Set permissions
    const { error: permError } = await supabaseAdmin
      .from("admin_permissions")
      .insert({
        user_id: uid,
        email: data.email,
        display_name: data.displayName,
        can_manage_clients: data.canManageClients,
        can_view_submissions: data.canViewSubmissions,
        can_download_submissions: data.canDownloadSubmissions,
        can_delete_clients: data.canDeleteClients,
      });
    if (permError) throw new Error(permError.message);

    return { success: true, userId: uid };
  });

// Update admin permissions (super_admin only)
export const updateAdminPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      userId: z.string().uuid(),
      displayName: z.string().min(1).max(100).optional(),
      canManageClients: z.boolean(),
      canViewSubmissions: z.boolean(),
      canDownloadSubmissions: z.boolean(),
      canDeleteClients: z.boolean(),
    }).parse(data)
  )
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context.userId);

    const { error } = await supabaseAdmin
      .from("admin_permissions")
      .upsert({
        user_id: data.userId,
        email: "", // will be set if insert
        display_name: data.displayName ?? null,
        can_manage_clients: data.canManageClients,
        can_view_submissions: data.canViewSubmissions,
        can_download_submissions: data.canDownloadSubmissions,
        can_delete_clients: data.canDeleteClients,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);

    return { success: true };
  });

// Delete an admin user (super_admin only)
export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid() }).parse(data)
  )
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context.userId);

    // Don't allow deleting yourself
    if (data.userId === context.userId) {
      throw new Error("No puedes eliminarte a ti mismo");
    }

    // Remove role
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    // Remove permissions
    await supabaseAdmin.from("admin_permissions").delete().eq("user_id", data.userId);
    // Delete auth user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);

    return { success: true };
  });
