import { watch } from "chokidar";
import { resolve } from "path";

const SCHEMAS_DIR = resolve(process.cwd(), "schemas");
console.log(`[watchSchema] Monitorando schemas em ${SCHEMAS_DIR}`);

function onChange(path) {
  console.log(`[watchSchema] Alteração detectada em: ${path}`);
  // Aqui você pode gerar typings, cópia, validação etc.
}

watch(SCHEMAS_DIR, { ignoreInitial: true, depth: 1 })
  .on("add",    onChange)
  .on("change", onChange)
  .on("unlink", onChange);
