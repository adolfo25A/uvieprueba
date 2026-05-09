import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const accessSchema = z.object({
  accessCode: z.string().min(1).max(100),
  accessPassword: z.string().min(1).max(100),
});

export const verifyClientAccess = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => accessSchema.parse(data))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: client, error } = await supabase
      .from("client_access")
      .select("id, client_name, access_code")
      .eq("access_code", data.accessCode)
      .eq("access_password", data.accessPassword)
      .single();

    if (error || !client) {
      throw new Error("Código o contraseña incorrectos");
    }

    return client;
  });

const submissionSchema = z.object({
  clientAccessId: z.string().uuid(),
  formData: z.record(z.unknown()),
});

export const saveSubmission = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submissionSchema.parse(data))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Check if submission already exists for this client
    const { data: existing } = await supabase
      .from("sediver_submissions")
      .select("id")
      .eq("client_access_id", data.clientAccessId)
      .single();

    const payload = {
      client_access_id: data.clientAccessId,
      ...data.formData,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await supabase
        .from("sediver_submissions")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { id: existing.id, updated: true };
    } else {
      const { data: result, error } = await supabase
        .from("sediver_submissions")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: result!.id, updated: false };
    }
  });

export const submitForm = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ clientAccessId: z.string().uuid(), formData: z.record(z.unknown()) }).parse(data))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const payload = {
      client_access_id: data.clientAccessId,
      ...data.formData,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("sediver_submissions")
      .select("id")
      .eq("client_access_id", data.clientAccessId)
      .single();

    if (existing) {
      const { error } = await supabase.from("sediver_submissions").update(payload).eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { id: existing.id };
    } else {
      const { data: result, error } = await supabase.from("sediver_submissions").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      return { id: result!.id };
    }
  });

export const getSubmission = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ clientAccessId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: submission } = await supabase
      .from("sediver_submissions")
      .select("*")
      .eq("client_access_id", data.clientAccessId)
      .single();

    return submission;
  });
