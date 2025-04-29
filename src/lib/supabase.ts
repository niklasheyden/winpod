import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log environment variables in development to help with debugging
if (import.meta.env.DEV) {
  console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Missing');
}

// Create a dummy client if environment variables are missing
// This allows the app to load without crashing, but API calls will fail
const createDummyClient = () => {
  console.error('Using dummy Supabase client due to missing environment variables');
  return {
    auth: {
      signIn: async () => ({ error: new Error('Supabase not configured') }),
      signOut: async () => ({ error: new Error('Supabase not configured') }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ error: new Error('Supabase not configured'), data: null, count: 0 }),
      insert: () => ({ error: new Error('Supabase not configured') }),
      update: () => ({ error: new Error('Supabase not configured') }),
      delete: () => ({ error: new Error('Supabase not configured') }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ error: new Error('Supabase not configured') }),
        createSignedUrl: async () => ({ error: new Error('Supabase not configured') }),
        download: async () => ({ error: new Error('Supabase not configured') }),
        remove: async () => ({ error: new Error('Supabase not configured') }),
      }),
      listBuckets: async () => ({ data: [], error: new Error('Supabase not configured') }),
    },
  };
};

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : createDummyClient();

// Only run connection tests in development
if (import.meta.env.DEV) {
  // Test connection silently - don't block app initialization
  (async () => {
    try {
      const { count, error } = await supabase
        .from('podcasts')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.warn('Supabase connection test warning:', error.message);
      } else {
        console.log('Supabase connection successful');
      }
    } catch (err) {
      console.warn('Supabase connection test warning:', err instanceof Error ? err.message : 'Unknown error');
    }
  })();

  // Test storage silently
  (async () => {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.warn('Storage buckets test warning:', error.message);
      } else {
        console.log('Storage access successful');
      }
    } catch (err) {
      console.warn('Storage access test warning:', err instanceof Error ? err.message : 'Unknown error');
    }
  })();
}