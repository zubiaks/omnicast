// tests/integration/reexports.test.js
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

const modulesDir = path.resolve('./frontend/js/modules')

describe('Reexports em modules/*/index.js', () => {
  const moduleNames = fs.readdirSync(modulesDir)
    .filter(name => fs.statSync(path.join(modulesDir, name)).isDirectory())

  for (const moduleName of moduleNames) {
    test(`módulo "${moduleName}" reexporta todos os arquivos`, async () => {
      const dirPath   = path.join(modulesDir, moduleName)
      const indexPath = path.join(dirPath, 'index.js')
      const files     = fs.readdirSync(dirPath)
        .filter(f => f.endsWith('.js') && f !== 'index.js')

      const indexMod     = await import(pathToFileURL(indexPath).href)
      const indexExports = Object.keys(indexMod)

      for (const file of files) {
        const childMod     = await import(pathToFileURL(path.join(dirPath, file)).href)
        const childExports = Object.keys(childMod)

        childExports.forEach(key => {
          expect(indexExports).toContain(
            key,
            `Esperava que ${moduleName}/index.js exportasse "${key}" de ${file}`
          )
        })
      }
    })
  }
})
