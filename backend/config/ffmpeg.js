import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedFfmpegPath = null;
let cachedFfprobePath = null;

/**
 * Ensure binary is executable (especially in /tmp or serverless environments)
 */
function prepareBinary(srcPath, binaryName) {
  if (!srcPath || !fs.existsSync(srcPath)) {
    return null;
  }

  try {
    // Check if directly executable
    fs.accessSync(srcPath, fs.constants.X_OK);
    return srcPath;
  } catch {
    // If not executable directly (e.g. read-only filesystem or restricted permissions),
    // copy it to OS temp directory and set execute permission
    try {
      const tempBinaryPath = path.join(os.tmpdir(), binaryName);
      if (!fs.existsSync(tempBinaryPath) || fs.statSync(tempBinaryPath).size !== fs.statSync(srcPath).size) {
        fs.copyFileSync(srcPath, tempBinaryPath);
        fs.chmodSync(tempBinaryPath, 0o755);
      }
      return tempBinaryPath;
    } catch (copyErr) {
      console.warn(`[FFmpeg Helper] Failed to copy/chmod binary ${binaryName}:`, copyErr.message);
      return srcPath;
    }
  }
}

/**
 * Resolve FFmpeg binary path across Local, Docker, and Vercel environments
 */
export function getFfmpegPath() {
  if (cachedFfmpegPath && fs.existsSync(cachedFfmpegPath)) {
    return cachedFfmpegPath;
  }

  // 1. Explicit environment variable
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    const res = prepareBinary(process.env.FFMPEG_PATH, 'ffmpeg');
    if (res) {
      cachedFfmpegPath = res;
      return cachedFfmpegPath;
    }
  }

  // 2. Static package binary from ffmpeg-static
  const candidatePaths = [
    ffmpegStatic,
    path.resolve(process.cwd(), 'node_modules/ffmpeg-static/ffmpeg'),
    path.resolve(__dirname, '../../node_modules/ffmpeg-static/ffmpeg'),
    path.join(os.tmpdir(), 'ffmpeg')
  ];

  for (const candidate of candidatePaths) {
    if (candidate && typeof candidate === 'string' && fs.existsSync(candidate)) {
      const res = prepareBinary(candidate, 'ffmpeg');
      if (res) {
        cachedFfmpegPath = res;
        return cachedFfmpegPath;
      }
    }
  }

  // 3. Fallback to system ffmpeg command
  return 'ffmpeg';
}

/**
 * Resolve FFprobe binary path across Local, Docker, and Vercel environments
 */
export function getFfprobePath() {
  if (cachedFfprobePath && fs.existsSync(cachedFfprobePath)) {
    return cachedFfprobePath;
  }

  // 1. Explicit environment variable
  if (process.env.FFPROBE_PATH && fs.existsSync(process.env.FFPROBE_PATH)) {
    const res = prepareBinary(process.env.FFPROBE_PATH, 'ffprobe');
    if (res) {
      cachedFfprobePath = res;
      return cachedFfprobePath;
    }
  }

  // 2. Static package binary from ffprobe-static
  const staticPath = ffprobeStatic?.path || ffprobeStatic;
  const candidatePaths = [
    staticPath,
    path.resolve(process.cwd(), 'node_modules/ffprobe-static/bin/linux/x64/ffprobe'),
    path.resolve(process.cwd(), 'node_modules/ffprobe-static/bin/darwin/arm64/ffprobe'),
    path.resolve(__dirname, '../../node_modules/ffprobe-static/bin/linux/x64/ffprobe'),
    path.resolve(__dirname, '../../node_modules/ffprobe-static/bin/darwin/arm64/ffprobe'),
    path.join(os.tmpdir(), 'ffprobe')
  ];

  for (const candidate of candidatePaths) {
    if (candidate && typeof candidate === 'string' && fs.existsSync(candidate)) {
      const res = prepareBinary(candidate, 'ffprobe');
      if (res) {
        cachedFfprobePath = res;
        return cachedFfprobePath;
      }
    }
  }

  // 3. Fallback to system ffprobe command
  return 'ffprobe';
}

/**
 * Execute FFmpeg command string with resolved binary path
 */
export async function execFfmpegCommand(commandAfterFfmpeg) {
  const binary = getFfmpegPath();
  const fullCommand = `"${binary}" ${commandAfterFfmpeg}`;
  return execAsync(fullCommand);
}

/**
 * Execute FFprobe command string with resolved binary path
 */
export async function execFfprobeCommand(commandAfterFfprobe) {
  const binary = getFfprobePath();
  const fullCommand = `"${binary}" ${commandAfterFfprobe}`;
  return execAsync(fullCommand);
}

/**
 * Spawn FFmpeg child process
 */
export function spawnFfmpeg(args = [], options = {}) {
  const binary = getFfmpegPath();
  return spawn(binary, args, options);
}
