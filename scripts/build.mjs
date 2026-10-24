import { cpSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = resolve(root, "dist");
// Only the generated directory is replaced; development files stay outside it.
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const name of ["index.html", ".nojekyll", "src"]) {
  cpSync(resolve(root, name), resolve(output, name), { recursive: true });
}
console.log("Built static site in dist/");
