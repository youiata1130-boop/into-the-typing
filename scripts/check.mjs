import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("..", import.meta.url));
function scriptFiles(directory) {
  return readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = directory + "/" + entry.name;
    return entry.isDirectory() ? scriptFiles(path) : /\.(?:js|mjs)$/.test(entry.name) ? [path] : [];
  });
}

const files = ["src", "scripts", "tests"].flatMap(scriptFiles).sort();
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log("Syntax checked " + files.length + " files.");
