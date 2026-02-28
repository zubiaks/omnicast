// web/js/auth.js
import { createClient } from '@supabase/supabase-js'

// 1. Configure seu Supabase a partir das variáveis de ambiente Vite
const supabaseUrl      = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[auth.js] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configurados.'
  )
}

// 2. Inicializa o cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Cadastra um usuário com email/senha
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('@supabase/supabase-js').AuthSignUpResponse>}
 */
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

/**
 * Autentica um usuário com email/senha
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('@supabase/supabase-js').AuthSignInResponse>}
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data
}

/**
 * Encerra a sessão do usuário
 * @returns {Promise<void>}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Observa mudanças no estado de autenticação
 * @param {(event: string, session: import('@supabase/supabase-js').Session|null) => void} callback
 * @returns {() => void} função para cancelar a inscrição
 */
export function onAuthStateChanged(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
  // retorna função para unsubscribing
  return () => {
    data.subscription.unsubscribe()
  }
}
