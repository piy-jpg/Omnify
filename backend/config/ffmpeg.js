import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedFfmpegPath = null;
let cachedFfprobePath = null;

/**
 * Ensure binary is executable in Vercel/Lambda serverless environments.
 * On serverless platforms, files in /var/task are read-only and restricted.
 * Copying to /tmp and assigning chmod 0755 guarantees executable permissions.
 */
function prepareBinary(srcPath, binaryName) {
  if (!srcPath || typeof srcPath !== 'string' || !fs.existsSync(srcPath)) {
    return null;
  }

  const tempBinaryPath = path.join(os.tmpdir(), binaryName);

  // If already pointing to the temp binary, verify chmod and return
  if (path.resolve(srcPath) === path.resolve(tempBinaryPath)) {
    try {
      fs.chmodSync(tempBinaryPath, 0o755);
    } catch (_) {}
    return tempBinaryPath;
  }

  // Copy to /tmp to guarantee execution privileges on serverless runtimes
  try {
    const srcStat = fs.statSync(srcPath);
    const needCopy = !fs.existsSync(tempBinaryPath) || fs.statSync(tempBinaryPath).size !== srcStat.size;
    if (needCopy) {
      fs.copyFileSync(srcPath, tempBinaryPath);
    }
    fs.chmodSync(tempBinaryPath, 0o755);
    return tempBinaryPath;
  } catch (copyErr) {
    console.warn(`[FFmpeg Helper] Warning preparing binary in ${tempBinaryPath}:`, copyErr.message);
    try {
      fs.accessSync(srcPath, fs.constants.X_OK);
      return srcPath;
    } catch {
      return srcPath;
    }
  }
}

/**
 * Search directory recursively for a binary matching the given name
 */
function findBinaryInDirectory(baseDir, binaryName, maxDepth = 4) {
  try {
    if (!fs.existsSync(baseDir)) return null;
    const stack = [{ dir: baseDir, depth: 0 }];
    while (stack.length > 0) {
      const { dir, depth } = stack.pop();
      if (depth > maxDepth) continue;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.toLowerCase().startsWith(binaryName.toLowerCase())) {
          return fullPath;
        } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'src' && entry.name !== 'dist') {
          stack.push({ dir: fullPath, depth: depth + 1 });
        }
      }
    }
  } catch (_) {}
  return null;
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

  // 2. Resolve @ffmpeg-installer and ffmpeg-static import
  const installerPath = ffmpegInstaller?.path || ffmpegInstaller?.default?.path || null;
  const staticPath = typeof ffmpegStatic === 'string'
    ? ffmpegStatic
    : (ffmpegStatic?.default || ffmpegStatic?.path || null);

  const candidatePaths = [
    installerPath,
    staticPath,
    path.join(os.tmpdir(), 'ffmpeg'),
    '/tmp/ffmpeg',
    path.resolve(process.cwd(), 'node_modules/@ffmpeg-installer/linux-x64/ffmpeg'),
    path.resolve(process.cwd(), 'node_modules/@ffmpeg-installer/darwin-arm64/ffmpeg'),
    path.resolve(process.cwd(), 'node_modules/@ffmpeg-installer/darwin-x64/ffmpeg'),
    path.resolve('/var/task/node_modules/@ffmpeg-installer/linux-x64/ffmpeg'),
    path.resolve(process.cwd(), 'node_modules/ffmpeg-static/ffmpeg'),
    path.resolve('/var/task/node_modules/ffmpeg-static/ffmpeg'),
    path.resolve(__dirname, '../../node_modules/@ffmpeg-installer/linux-x64/ffmpeg'),
    path.resolve(__dirname, '../../node_modules/ffmpeg-static/ffmpeg'),
    path.resolve(__dirname, '../../../node_modules/ffmpeg-static/ffmpeg'),
    path.resolve(__dirname, '../node_modules/ffmpeg-static/ffmpeg'),
    path.resolve(__dirname, './node_modules/ffmpeg-static/ffmpeg'),
    path.resolve(process.cwd(), '../node_modules/ffmpeg-static/ffmpeg'),
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    '/opt/homebrew/bin/ffmpeg'
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

  // 3. Fallback: search node_modules directories dynamically
  const searchDirs = [
    path.resolve(process.cwd(), 'node_modules/@ffmpeg-installer'),
    path.resolve('/var/task/node_modules/@ffmpeg-installer'),
    path.resolve(process.cwd(), 'node_modules/ffmpeg-static'),
    path.resolve('/var/task/node_modules/ffmpeg-static'),
    path.resolve(__dirname, '../../node_modules')
  ];

  for (const searchDir of searchDirs) {
    const found = findBinaryInDirectory(searchDir, 'ffmpeg');
    if (found) {
      const res = prepareBinary(found, 'ffmpeg');
      if (res) {
        cachedFfmpegPath = res;
        return cachedFfmpegPath;
      }
    }
  }

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

  // 2. Resolve @ffprobe-installer and ffprobe-static import
  const installerPath = ffprobeInstaller?.path || ffprobeInstaller?.default?.path || null;
  const staticPath = typeof ffprobeStatic === 'string'
    ? ffprobeStatic
    : (ffprobeStatic?.path || ffprobeStatic?.default?.path || ffprobeStatic?.default || null);

  const candidatePaths = [
    installerPath,
    staticPath,
    path.join(os.tmpdir(), 'ffprobe'),
    '/tmp/ffprobe',
    path.resolve(process.cwd(), 'node_modules/@ffprobe-installer/linux-x64/ffprobe'),
    path.resolve(process.cwd(), 'node_modules/@ffprobe-installer/darwin-arm64/ffprobe'),
    path.resolve(process.cwd(), 'node_modules/ffprobe-static/bin/linux/x64/ffprobe'),
    path.resolve(process.cwd(), 'node_modules/ffprobe-static/bin/linux/arm64/ffprobe'),
    path.resolve(process.cwd(), 'node_modules/ffprobe-static/bin/darwin/arm64/ffprobe'),
    path.resolve(process.cwd(), 'node_modules/ffprobe-static/bin/darwin/x64/ffprobe'),
    path.resolve(process.cwd(), 'node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe'),
    path.resolve('/var/task/node_modules/@ffprobe-installer/linux-x64/ffprobe'),
    path.resolve('/var/task/node_modules/ffprobe-static/bin/linux/x64/ffprobe'),
    path.resolve('/var/task/node_modules/ffprobe-static/bin/linux/arm64/ffprobe'),
    path.resolve(__dirname, '../../node_modules/ffprobe-static/bin/linux/x64/ffprobe'),
    path.resolve(__dirname, '../../node_modules/ffprobe-static/bin/darwin/arm64/ffprobe'),
    path.resolve(__dirname, '../../../node_modules/ffprobe-static/bin/linux/x64/ffprobe'),
    '/usr/bin/ffprobe',
    '/usr/local/bin/ffprobe',
    '/opt/homebrew/bin/ffprobe'
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

  // 3. Fallback: search node_modules directories dynamically
  const searchDirs = [
    path.resolve(process.cwd(), 'node_modules/ffprobe-static'),
    path.resolve('/var/task/node_modules/ffprobe-static'),
    path.resolve(process.cwd(), 'node_modules/@ffprobe-installer'),
    path.resolve('/var/task/node_modules/@ffprobe-installer'),
    path.resolve(__dirname, '../../node_modules')
  ];

  for (const searchDir of searchDirs) {
    const found = findBinaryInDirectory(searchDir, 'ffprobe');
    if (found) {
      const res = prepareBinary(found, 'ffprobe');
      if (res) {
        cachedFfprobePath = res;
        return cachedFfprobePath;
      }
    }
  }

  return 'ffprobe';
}

import { pipeline as streamPipeline } from 'stream/promises';
import { Readable } from 'stream';

/**
 * Download and extract binary using streamed fetch pipeline
 */
async function downloadAndExtract(url, destPath) {
  const tempDest = `${destPath}.tmp_${Date.now()}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; OmnifyServerless/1.0)'
    },
    redirect: 'follow'
  });

  if (!res.ok) {
    throw new Error(`Failed to download binary from ${url}: HTTP ${res.status} ${res.statusText}`);
  }

  const fileStream = fs.createWriteStream(tempDest, { mode: 0o755 });
  const nodeStream = Readable.fromWeb(res.body);
  await streamPipeline(nodeStream, fileStream);

  try {
    if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
  } catch (_) {}
  fs.renameSync(tempDest, destPath);
  fs.chmodSync(destPath, 0o755);
  return destPath;
}

/**
 * Ensure FFmpeg binary is available on disk (synchronous candidates or background fetch)
 */
export async function ensureFfmpegPath() {
  const syncPath = getFfmpegPath();
  if (syncPath && syncPath !== 'ffmpeg' && fs.existsSync(syncPath)) {
    return syncPath;
  }

  const tempFfmpeg = path.join(os.tmpdir(), 'ffmpeg');
  if (fs.existsSync(tempFfmpeg) && fs.statSync(tempFfmpeg).size > 1000000) {
    try {
      fs.chmodSync(tempFfmpeg, 0o755);
      cachedFfmpegPath = tempFfmpeg;
      return tempFfmpeg;
    } catch (_) {}
  }

  const platform = process.env.npm_config_platform || os.platform();
  const arch = process.env.npm_config_arch || os.arch();

  const downloadUrls = [
    `https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-${platform}-${arch}`,
    `https://github.com/eugeneware/ffmpeg-static/releases/download/b5.2.0/ffmpeg-${platform}-${arch}`
  ];

  for (const dlUrl of downloadUrls) {
    try {
      console.log(`[FFmpeg Helper] Attempting download from ${dlUrl}...`);
      await downloadAndExtract(dlUrl, tempFfmpeg);
      cachedFfmpegPath = tempFfmpeg;
      return tempFfmpeg;
    } catch (err) {
      console.warn(`[FFmpeg Helper] Download attempt failed for ${dlUrl}:`, err.message);
    }
  }

  if (fs.existsSync(tempFfmpeg)) {
    fs.chmodSync(tempFfmpeg, 0o755);
    cachedFfmpegPath = tempFfmpeg;
    return tempFfmpeg;
  }

  return getFfmpegPath();
}

/**
 * Ensure FFprobe binary is available on disk
 */
export async function ensureFfprobePath() {
  const syncPath = getFfprobePath();
  if (syncPath && syncPath !== 'ffprobe' && fs.existsSync(syncPath)) {
    return syncPath;
  }

  const tempFfprobe = path.join(os.tmpdir(), 'ffprobe');
  if (fs.existsSync(tempFfprobe)) {
    try {
      fs.chmodSync(tempFfprobe, 0o755);
      cachedFfprobePath = tempFfprobe;
      return tempFfprobe;
    } catch (_) {}
  }

  return getFfprobePath();
}

/**
 * Warm up binaries asynchronously in the background on module import
 */
ensureFfmpegPath().catch(() => {});
ensureFfprobePath().catch(() => {});

/**
 * Execute FFmpeg command string with resolved binary path
 */
export async function execFfmpegCommand(commandAfterFfmpeg) {
  const binary = await ensureFfmpegPath();
  const fullCommand = `"${binary}" ${commandAfterFfmpeg}`;
  return execAsync(fullCommand);
}

/**
 * Execute FFprobe command string with resolved binary path
 */
export async function execFfprobeCommand(commandAfterFfprobe) {
  const binary = await ensureFfprobePath();
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
