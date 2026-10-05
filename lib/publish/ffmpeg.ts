import { spawn } from "node:child_process";

// Server-only helpers for calling the native ffmpeg / ffprobe binaries.

export interface RunResult {
  stdout: Buffer;
  stderr: string;
}

/** Run a command with an argument list (no shell). Rejects on a non-zero exit. */
export function run(cmd: string, args: string[]): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    const out: Buffer[] = [];
    let err = "";
    child.stdout.on("data", (d: Buffer) => out.push(d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) =>
      reject(
        (e as NodeJS.ErrnoException).code === "ENOENT"
          ? new Error(`${cmd} not found. Install it with: brew install ffmpeg`)
          : e,
      ),
    );
    child.on("close", (code) =>
      code === 0
        ? resolve({ stdout: Buffer.concat(out), stderr: err })
        : reject(
            new Error(`${cmd} failed (exit ${code}):\n${err.slice(-2000)}`),
          ),
    );
  });
}

export async function probe(video: string) {
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height:format=duration",
    "-of",
    "json",
    video,
  ]);
  const info = JSON.parse(stdout.toString());
  return {
    width: info.streams[0].width as number,
    height: info.streams[0].height as number,
    durationMs: Math.round(parseFloat(info.format.duration) * 1000),
  };
}

export const sec = (ms: number) => (Math.max(ms, 0) / 1000).toFixed(3);
