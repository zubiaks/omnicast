// web/js/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Log seguro para diagnóstico (não imprime a chave completa)
console.info('[Supabase][env] VITE_SUPABASE_URL=', SUPABASE_URL ? SUPABASE_URL : 'undefined')
console.info('[Supabase][env] VITE_SUPABASE_ANON_KEY=', SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.slice(0,8) + '…' : 'undefined')

let supabaseClient

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Supabase] missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — using fallback stub (client disabled)')
  // Fallback seguro que mantém a app a correr enquanto corriges .env
  supabaseClient = {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: (_callback) => {
        // devolve um handle compatível com a API do supabase-js
        return { subscription: null, data: null, unsubscribe: () => {} }
      },
      signOut: async () => ({ error: null })
    },
    from: () => ({ select: async () => ({ data: null, error: null }) }),
    // operações comuns que podem ser chamadas no cliente
    storage: () => ({ from: () => ({ download: async () => ({ data: null, error: null }) }) })
  }
} else {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      // Default opts; ajusta se precisares de headers, localStorage, etc.
      auth: { persistSession: true, detectSessionInUrl: false }
    })
  } catch (err) {
    console.error('[Supabase] createClient failed', err)
    supabaseClient = {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: (_callback) => ({ subscription: null, data: null, unsubscribe: () => {} }),
        signOut: async () => ({ error: null })
      },
      from: () => ({ select: async () => ({ data: null, error: null }) })
    }
  }
}

export const supabase = supabaseClient
