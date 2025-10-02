// scripts/test-rls.js
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

async function main() {
  // 1. Login para obter user.id e access_token
  const anon = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )
  const {
    data: { user, session },
    error: loginErr
  } = await anon.auth.signInWithPassword({
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD
  })
  if (loginErr) {
    console.error('❌ Erro no login:', loginErr.message)
    process.exit(1)
  }
  const userId = user.id
  const token = session.access_token
  console.log('🔑 Logado como:', userId)

  // 2. Seed via Service Role
  const svc = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { data: [row], error: seedErr } = await svc
    .from('streams')
    .insert({ user_id: userId, title: 'RLS Test Seed' })
    .select('id,title')
  if (seedErr) {
    console.error('❌ Falha ao inserir seed:', seedErr.message)
    process.exit(1)
  }
  console.log('🌱 Seed criado com id:', row.id)

  // 3. Cliente autenticado
  const userClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  // 3.1. UPDATE negado para outro usuário
  const fakeUserId = '00000000-0000-0000-0000-000000000000'
  const { data: otherUpdate, error: otherUpdateErr } = await userClient
    .from('streams')
    .update({ title: 'Hack Attempt' })
    .eq('user_id', fakeUserId)
    .select('id')
  if (otherUpdateErr) {
    console.error('❌ Erro inesperado ao tentar UPDATE em outro usuário:', otherUpdateErr.message)
    process.exit(1)
  }
  if (otherUpdate.length) {
    console.error('❌ UPDATE indevido em outro usuário permitido')
    process.exit(1)
  }
  console.log('🔒 UPDATE negado para outro usuário ✅')

  // 3.2. UPDATE permitido para o próprio registro
  const { data: ownUpdate, error: ownUpdateErr } = await userClient
    .from('streams')
    .update({ title: 'RLS Test Seed Updated' })
    .eq('id', row.id)
    .select('id,title')
  if (ownUpdateErr) {
    console.error('❌ UPDATE falhou no próprio registro:', ownUpdateErr.message)
    process.exit(1)
  }
  console.log('✅ UPDATE permitido para o próprio registro:', ownUpdate)

  // 3.3. DELETE negado para outro usuário
  const { data: otherDelete, error: otherDeleteErr } = await userClient
    .from('streams')
    .delete()
    .eq('user_id', fakeUserId)
    .select('id')
  if (otherDeleteErr) {
    console.error('❌ Erro inesperado ao tentar DELETE em outro usuário:', otherDeleteErr.message)
    process.exit(1)
  }
  if (otherDelete.length) {
    console.error('❌ DELETE indevido em outro usuário permitido')
    process.exit(1)
  }
  console.log('🔒 DELETE negado para outro usuário ✅')

  // 3.4. DELETE permitido para o próprio registro
  const { data: ownDelete, error: ownDeleteErr } = await userClient
    .from('streams')
    .delete()
    .eq('id', row.id)
    .select('id')
  if (ownDeleteErr) {
    console.error('❌ DELETE falhou no próprio registro:', ownDeleteErr.message)
    process.exit(1)
  }
  console.log('✅ DELETE permitido no próprio registro:', ownDelete)

  // 4. (Opcional) limpeza de outros registros se houver
  await svc.from('streams').delete().eq('id', row.id)
  console.log('🧹 Seed removido pelo Service Role')

  process.exit(0)
}

main()
