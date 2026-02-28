// web/js/api/streams.js
import { supabase }  from '@/auth.js'
import { fetchJSON } from '@/utils/fetch.js'

const API = import.meta.env.VITE_API_URL
if (!API) throw new Error('[streams.js] VITE_API_URL não definido')

export async function fetchStreams() {
  // 1. Recupera o token
  const { data: { session }, error: sessionError } =
    await supabase.auth.getSession()
  if (sessionError) {
    console.error('[streams.js] erro ao obter sessão:', sessionError)
    throw new Error('Erro interno de autenticação')
  }
  if (!session?.access_token) {
    // token expirado ou usuário não logado
    await supabase.auth.signOut()
    throw new Error('Sessão expirada, faça login novamente')
  }

  // 2. Chama a API via fetchJSON
  return fetchJSON(`${API}/streams`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`
    }
  })
}
