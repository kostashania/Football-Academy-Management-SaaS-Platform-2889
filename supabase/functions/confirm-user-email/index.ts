// supabase/functions/confirm-user-email/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface ConfirmEmailPayload {
  user_email: string;
}

serve(async (req) => {
  try {
    // Create a Supabase client with the service role key (for admin operations)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the request body
    const payload: ConfirmEmailPayload = await req.json();
    const { user_email } = payload;

    if (!user_email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user by email
    const { data: userData, error: getUserError } = await supabase.auth.admin
      .getUserByEmail(user_email);

    if (getUserError || !userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update the user to confirm their email
    const { error: updateError } = await supabase.auth.admin
      .updateUserById(userData.id, {
        email_confirm: true,
        user_metadata: { email_confirmed_at: new Date().toISOString() }
      });

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return success
    return new Response(
      JSON.stringify({ success: true, message: "Email confirmed successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});