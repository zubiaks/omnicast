export function dumpEnv() {
  // cuidado: não exponha keys em logs públicos
  console.log('VITE_SUPABASE_URL=', import.meta.env.VITE_SUPABASE_URL)
  console.log('VITE_SUPABASE_ANON_KEY=', import.meta.env.VITE_SUPABASE_ANON_KEY ? import.meta.env.VITE_SUPABASE_ANON_KEY.slice(0,8) + '…' : undefined)
}
