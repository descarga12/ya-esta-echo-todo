/**
 * Ejecuta Gradle en android/ (Windows: gradlew.bat; otros: gradlew si existe).
 * Uso: node scripts/android-gradle.mjs assembleRelease
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const androidDir = path.join(root, "android");
const task = process.argv[2] || "assembleRelease";

const isWin = process.platform === "win32";
const bat = path.join(androidDir, "gradlew.bat");
const sh = path.join(androidDir, "gradlew");

let cmd;
let args;
let cwd = androidDir;
let shell = false;

if (isWin && existsSync(bat)) {
  cmd = bat;
  args = [task];
  shell = true;
} else if (existsSync(sh)) {
  cmd = sh;
  args = [task];
} else {
  console.error("No se encontró gradlew / gradlew.bat en android/");
  process.exit(1);
}

const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell });
process.exit(r.status ?? 1);
