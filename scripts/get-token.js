// scripts/get-token.js
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

async function getToken() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD
  })

  if (error) {
    console.error('❌ Erro ao logar:', error.message)
    process.exit(1)
  }

  console.log('✅ Novo access_token:', data.session.access_token)
  process.exit(0)
}

getToken()
