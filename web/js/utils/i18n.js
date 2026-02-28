// web/js/utils/i18n.js

// Dicionário de mensagens em pt-BR
const messages = {
  // Auth / session
  "auth.loginRequired":        "Faça login para continuar.",
  "auth.signedOut":            "Sessão encerrada.",

  // Network
  "network.offline":           "Você está offline.",
  "network.online":            "De volta à internet!",

  // PWA / SW
  "sw.updateAvailable":        "Nova versão disponível – atualizando...",
  "sw.offlineReady":           "Aplicativo pronto para uso offline.",

  // Router
  "router.loginRequired":      "Faça login para acessar esta página.",
  "router.renderError":        "Erro ao renderizar a página.",
  "notifications.routeLoaded": "Página \"{page}\" carregada com sucesso.",

  // Loading
  "loading":                   "Carregando...",

  // Login
  "login.title":       "Entrar",
  "login.email":       "Email",
  "login.password":    "Senha",
  "login.submit":      "Entrar",
  "login.success":     "Login bem-sucedido!",
  "login.noAccount":   "Não tem conta?",
  "login.signupLink":  "Cadastre-se",

  // Signup
  "signup.title":       "Criar conta",
  "signup.email":       "Email",
  "signup.password":    "Senha",
  "signup.submit":      "Cadastrar",
  "signup.success":     "Conta criada com sucesso!",
  "signup.haveAccount": "Já tem conta?",
  "signup.loginLink":   "Faça login",

  // Home
  "home.hero.title":                   "Bem-vindo ao OmniCast",
  "home.hero.subtitle":                "Centralize IPTV, VOD, rádios e webcams num só lugar.",
  "home.categories.heading":           "Explore as categorias",
  "home.categories.iptv.title":        "IPTV",
  "home.categories.iptv.desc":         "TV ao vivo no navegador",
  "home.categories.vod.title":         "VOD",
  "home.categories.vod.desc":          "Filmes e séries on-demand",
  "home.categories.radio.title":       "Rádio",
  "home.categories.radio.desc":        "Estações de rádio online",
  "home.categories.webcams.title":     "Webcams",
  "home.categories.webcams.desc":      "Câmeras ao vivo pelo mundo",

  // Not Found
  "notFound.hero.title":     "404 – Página não encontrada",
  "notFound.hero.subtitle":  "Desculpe, não encontramos o que você procura.",
  "notFound.buttonText":     "Voltar para a página inicial",
  "notFound.buttonLabel":    "Clique para voltar ao início",
  "notFound.toast":          "Página não encontrada."
}

export function t(key, params = {}) {
  let msg = messages[key] || key
  Object.entries(params).forEach(([k, v]) => {
    msg = msg.replace(`{${k}}`, v)
  })
  return msg
}

export default { t }
