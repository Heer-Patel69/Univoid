import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const POOL_SIZE = Number(Deno.env.get('SUPABASE_POOL_SIZE') ?? 20);

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
    },
    global: {
        headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    },
    // @ts-ignore: poolSize is a valid option for supabase-js in Deno environment but might typically be hidden in types
    db: {
        schema: 'public',
    },
    // Configuring the custom fetch implementation or pool size if supported by the client version
    poolSize: POOL_SIZE,
});
