import { runAgent, type RunAgentOpts } from "./harness";
/** Injectable editor: proposes validated JSON; rendering remains application code. */
export interface Runtime { run(opts: RunAgentOpts): Promise<void>; }
export const editorRuntime: Runtime = { run: runAgent };
