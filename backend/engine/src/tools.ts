import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const quote = (value: string) => "'" + value.replace(/'/g, "'\\''") + "'";
/** Optional local developer commands. The model runtime never executes these strings. */
export function toolCommands(): { render: string; critique: string; watch: string; tighten: string; applyEdit: string } {
  const engineDir = fileURLToPath(new URL("..", import.meta.url));
  const tsx = require.resolve("tsx/cli");
  const cli = (name: string) => `${quote(process.execPath)} ${quote(tsx)} ${quote(join(engineDir, "src", "cli", name))} .`;
  return { render: cli("render-reel.ts"), critique: cli("critique-reel.ts"), watch: cli("watch-reel.ts"), tighten: cli("tighten-vo.ts"), applyEdit: cli("apply-edit.ts") };
}
