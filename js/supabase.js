const SUPABASE_URL = "https://ivkpisqibggegaocposk.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_62Xw5Rv-c8GyJ60Mg6_axA_oj3_K9Em";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);