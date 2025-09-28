import { createClient } from "@supabase/supabase-js";
import { type Database } from "../database.js";

// Private singleton instances
let unauthenticatedClientInstance: ReturnType<
  typeof createClient<Database>
> | null = null;
let serviceClientInstance: ReturnType<typeof createClient<Database>> | null =
  null;
const authenticatedClients = new Map<
  string,
  ReturnType<typeof createClient<Database>>
>();

// Public singleton accessor functions
export const createUnauthenticatedClient = () => {
  if (!unauthenticatedClientInstance) {
    unauthenticatedClientInstance = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
        global: {
          headers: {},
        },
      }
    );
  }
  return unauthenticatedClientInstance;
};

// Create or retrieve a singleton Supabase client for tests
export const createSupabaseClient = (token?: string) => {
  const cacheKey = token || "default";

  if (!authenticatedClients.has(cacheKey)) {
    authenticatedClients.set(
      cacheKey,
      createClient<Database>(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            detectSessionInUrl: false,
            persistSession: false,
          },
          global: {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        }
      )
    );
  }

  return authenticatedClients.get(cacheKey)!;
};

// Function to sign in a user and return the client (singleton)
export const signInUser = async (email: string, password: string) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`Failed to sign in user: ${error.message}`);
  }

  if (!data.session) {
    throw new Error("No session returned after sign in");
  }

  // Return a client with the session token
  return createSupabaseClient(data.session.access_token);
};

// Get singleton service client with admin privileges
export const createServiceClient = () => {
  if (!serviceClientInstance) {
    serviceClientInstance = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return serviceClientInstance;
};
