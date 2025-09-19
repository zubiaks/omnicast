# .husky

Este diretório contém os Git hooks geridos pelo Husky para garantir qualidade de código e convenções de commits antes de commit e push.

---

## Estrutura

.husky/ 
├─ _/ # Scripts internos do Husky 
├─ pre-commit # Hook antes do commit 
├─ commit-msg # Hook para validar mensagem de commit 
└─ pre-push # Hook antes do push


---

## Hooks configurados

### pre-commit

Executa o lint-staged para ESLint, Stylelint e Prettier somente nos arquivos staged.

```sh
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged

commit-msg
Valida a mensagem de commit usando Commitlint (Conventional Commits).

#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

npx --no-install commitlint --edit "$1"


pre-push
Antes do push, garante que o código está lintado e que todos os testes passam (unitários e E2E).

#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

npm run lint
npm run test:unit
npm run test:e2e


Comandos Úteis
Instalar hooks
Após clonar o repositório, execute:

npm install
npx husky install
npm run prepare


Adicionar um novo hook
bash
npx husky add .husky/<nome-do-hook> "comando-a-executar"
Exemplo:

bash
npx husky add .husky/pre-push "npm run test:ci"
Remover ou desativar um hook
bash
rm .husky/pre-commit
# ou
mv .husky/pre-commit .husky/pre-commit.disabled
Referências
Husky Documentation: https://typicode.github.io/husky

lint-staged: https://github.com/okonet/lint-staged

Commitlint: https://github.com/conventional-changelog/commitlint

