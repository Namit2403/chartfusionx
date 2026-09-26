// Lovable-generated file, customized: the client no longer throws at module
// load when env vars are missing (that blank-screened the whole app on
// deployments without Supabase configured — see createUnconfiguredStub).
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}


function createSupabaseClient() {
  // Use import.meta.env for client-side (Vite build-time replacement)
  // Fall back to process.env for SSR (server-side rendering)
  const SUPABASE_URL = import.meta.env['VITE_SUPABASE_URL'] || process.env['SUPABASE_URL'];
  const SUPABASE_PUBLISHABLE_KEY = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || process.env['SUPABASE_PUBLISHABLE_KEY'];

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ['SUPABASE_URL'] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ['SUPABASE_PUBLISHABLE_KEY'] : []),
    ];
    // Log loudly but do NOT throw: a throw here (or in the lazy proxy below)
    // during module evaluation blank-screens the entire app. The stub keeps
    // marketing pages rendering; queries resolve with an explicit error.
    console.error(`[Supabase] Missing Supabase environment variable(s): ${missing.join(', ')}. Connect Supabase in Lovable Cloud.`);
    return null;
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
    },
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

/**
 * A chainable no-op client used when Supabase env vars are missing. Awaited
 * query chains resolve to `{ data: null, error: <not-configured> }` (the real
 * Postgrest failure shape) and `auth.*` calls resolve to
 * `{ data: { user: null, session: null }, error: <not-configured> }` (the real
 * auth shape — `data` is never null there), so the UI renders empty/error
 * states and auth surfaces as signed-out instead of crashing the app.
 */
function createUnconfiguredStub(): NonNullable<ReturnType<typeof createSupabaseClient>> {
  type RealClient = NonNullable<ReturnType<typeof createSupabaseClient>>;
  const failure = {
    message: 'Supabase is not configured in this deployment.',
    code: 'SUPABASE_NOT_CONFIGURED',
  };
  const postgrestResult = () => Promise.resolve({ data: null, error: failure });
  const authResult = () => Promise.resolve({ data: { user: null, session: null }, error: failure });

  const makeChain = (isAuth: boolean): RealClient => {
    const result = isAuth ? authResult : postgrestResult;
    return new Proxy(function chain() { /* invoked only through the apply trap */ }, {
      get(_target, prop) {
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          return result()[prop].bind(result());
        }
        if (isAuth && prop === 'onAuthStateChange') {
          // Match the real signature ({ data: { subscription } }) and emit an
          // INITIAL_SESSION callback so hooks settle to signed-out instead of
          // waiting on a session that can never arrive.
          return (callback: (event: string, session: unknown) => void) => {
            void Promise.resolve().then(() => callback('INITIAL_SESSION', null));
            return { data: { subscription: { unsubscribe: () => {} } } };
          };
        }
        // Any other property access keeps the chain going (from, select, eq,
        // channel, storage, auth methods, ...).
        return makeChain(isAuth || prop === 'auth');
      },
      apply() {
        return makeChain(isAuth);
      },
    }) as unknown as RealClient;
  };

  return makeChain(false);
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;
let _stub: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as NonNullable<ReturnType<typeof createSupabaseClient>>, {
  get(_, prop, receiver) {
    if (_supabase === undefined && _stub === undefined) {
      // One attempt only: a missing config must not re-log on every access.
      // Any unexpected failure during client creation (preview-host quirks,
      // storage access, etc.) degrades to the stub instead of propagating
      // into module evaluation and blank-screening the app.
      try {
        _supabase = createSupabaseClient() ?? undefined;
      } catch (error) {
        console.error('[Supabase] client creation failed; running unconfigured.', error);
      }
      if (_supabase === undefined) _stub = createUnconfiguredStub();
    }
    const target = (_supabase ?? _stub) as NonNullable<ReturnType<typeof createSupabaseClient>>;
    return Reflect.get(target, prop, receiver);
  },
});

