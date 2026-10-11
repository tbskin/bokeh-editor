import { cp, mkdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = ".ole-checkpoints";
const MUTABLE = ["edit", "plan.json", "vo.wav", "vo.meta.json"] as const;

async function exists(path: string): Promise<boolean> {
  return stat(path).then(() => true).catch(() => false);
}

async function copyState(workDir: string, destination: string): Promise<void> {
  await mkdir(destination, { recursive: true });
  for (const name of MUTABLE) {
    const source = join(workDir, name);
    if (await exists(source)) await cp(source, join(destination, name), { recursive: true, force: true });
  }
  await writeFile(join(destination, "checkpoint.json"), JSON.stringify({ createdAt: new Date().toISOString() }));
}

async function restoreState(workDir: string, source: string): Promise<void> {
  for (const name of MUTABLE) {
    const target = join(workDir, name);
    await rm(target, { recursive: true, force: true });
    const saved = join(source, name);
    if (await exists(saved)) await cp(saved, target, { recursive: true, force: true });
  }
}

export async function beginEditCheckpoint(workDir: string): Promise<void> {
  const pending = join(workDir, ROOT, "pending");
  await rm(pending, { recursive: true, force: true });
  await copyState(workDir, pending);
}

export async function commitEditCheckpoint(workDir: string): Promise<void> {
  const root = join(workDir, ROOT);
  const pending = join(root, "pending");
  if (!(await exists(pending))) throw new Error("No pending edit checkpoint to commit.");
  await rm(join(root, "previous"), { recursive: true, force: true });
  await rename(pending, join(root, "previous"));
}

export async function rollbackEditCheckpoint(workDir: string): Promise<void> {
  const pending = join(workDir, ROOT, "pending");
  if (!(await exists(pending))) return;
  await restoreState(workDir, pending);
  await rm(pending, { recursive: true, force: true });
}

export async function canUndoEdit(workDir: string): Promise<boolean> {
  return exists(join(workDir, ROOT, "previous", "checkpoint.json"));
}

export async function undoLastEdit(workDir: string): Promise<void> {
  const previous = join(workDir, ROOT, "previous");
  if (!(await exists(previous))) throw new Error("There isn't a previous change to undo.");
  await restoreState(workDir, previous);
  await rm(previous, { recursive: true, force: true });
}

/** Undo plus an external durability step (object upload) as one transaction. */
export async function withUndoCheckpoint<T>(workDir: string, afterRestore: () => Promise<T>): Promise<T> {
  const previous = join(workDir, ROOT, "previous");
  if (!(await exists(previous))) throw new Error("There isn't a previous change to undo.");
  await beginEditCheckpoint(workDir); // current state, solely for rollback if durability fails
  await restoreState(workDir, previous);
  try {
    const result = await afterRestore();
    await rm(previous, { recursive: true, force: true });
    await rm(join(workDir, ROOT, "pending"), { recursive: true, force: true });
    return result;
  } catch (error) {
    await rollbackEditCheckpoint(workDir);
    throw error;
  }
}

/** One mutation transaction for every conversational edit, including HyperFrames composition. */
export async function withEditCheckpoint<T>(workDir: string, edit: () => Promise<T>, options?: { commitWhen?: (result: T) => boolean }): Promise<T> {
  await beginEditCheckpoint(workDir);
  try {
    const result = await edit();
    if (options?.commitWhen && !options.commitWhen(result)) await rollbackEditCheckpoint(workDir);
    else await commitEditCheckpoint(workDir);
    return result;
  } catch (error) {
    await rollbackEditCheckpoint(workDir);
    throw error;
  }
}
