import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ehyndleirfokwzmikwjq.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_F7HpUsTz3vC2Rkl5t2o48g_R5N3hXNe";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
