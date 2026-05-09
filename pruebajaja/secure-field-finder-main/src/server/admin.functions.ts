import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("client_access")
      .select("*, sediver_submissions(id, status, submitted_at)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      clientName: z.string().min(1).max(255),
      accessCode: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
      accessPassword: z.string().min(4).max(50),
    }).parse(data)
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: result, error } = await supabase
      .from("client_access")
      .insert({
        client_name: data.clientName,
        access_code: data.accessCode,
        access_password: data.accessPassword,
        created_by: userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  });

export const deleteClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.from("client_access").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getAllSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("sediver_submissions")
      .select("*, client_access(client_name, access_code)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getSubmissionById = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: submission, error } = await supabase
      .from("sediver_submissions")
      .select("*, client_access(client_name, access_code)")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return submission;
  });

export const updateSubmissionFields = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      id: z.string().uuid(),
      fields: z.record(z.string(), z.unknown()),
    }).parse(data)
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("sediver_submissions")
      .update(data.fields as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
