const fs = require("fs");
const path = require("path");
const isWindows = process.platform === "win32";
const extractIcon = require("icon-extractor");

const MAX_DEPTH = 3; // recursive search depth

// extensions we consider as executables
const EXECUTABLE_EXTENSIONS = [".exe", ".msi", ".bat", ".cmd", ".lnk"];

// keywords to skip (system runtimes, repair tools, installers, etc.)
const SKIP_KEYWORDS = [
  "uninstall",
  "setup",
  "update",
  "updater",
  "crash",
  "helper",
  "installer",
  "repair",
  "service",
  "agent",
];

// function shouldSkip(filePath) {
//   const name = path.basename(filePath).toLowerCase();
//   return SKIP_KEYWORDS.some((kw) => name.includes(kw));
// }

function shouldSkip(filePath) {
  const name = path.basename(filePath).toLowerCase();

  // skip based on filename
  if (SKIP_KEYWORDS.some((kw) => name.includes(kw))) return true;

  // skip based on parent folder names
  const skipFolders = [
    "windows",
    "programdata",
    "$recycle.bin",
    "system volume information",
  ];

  const folders = filePath.split(path.sep).map((f) => f.toLowerCase());
  if (folders.some((f) => skipFolders.includes(f))) return true;

  return false;
}

// recursively scan directories and collect all executables
function scanDirectoryRecursive(dir, depth = 0, results = [], maxDepth = MAX_DEPTH) {
  if (depth > maxDepth) return results;

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (_) {
    return results; // permission denied or inaccessible
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDirectoryRecursive(fullPath, depth + 1, results);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (EXECUTABLE_EXTENSIONS.includes(ext) && !shouldSkip(fullPath)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function extractAppMetadata(filePath) {
  let stats;
  try {
    stats = fs.statSync(filePath);
  } catch (_) {
    return null;
  }

  let iconPath = null;
  try {
    iconPath = extractIcon.getIcon(filePath, "large");
  } catch (_) {}

  return {
    name: path.parse(filePath).name,
    path: filePath,
    size: stats.size,
    modified: stats.mtime,
    iconPath,
  };
}

function scanInstalledApps() {
  if (!isWindows) return [];

  // include Program Files folders + full C:\ drive
  const targetDirs = [
    process.env["ProgramFiles"],
    process.env["ProgramFiles(x86)"],
    process.env["ProgramW6432"],
    "C:\\",
  ].filter(Boolean);

  const allExecutables = [];

  for (const dir of targetDirs) {
    const depth = dir === "C:\\" ? 1 : MAX_DEPTH; // shallow scan for C:\
    scanDirectoryRecursive(dir, 0, allExecutables, depth);
  }

  // extract metadata for every executable
  const apps = [];
  for (const exePath of allExecutables) {
    const meta = extractAppMetadata(exePath);
    if (meta) apps.push(meta);
  }

  return apps;
}

module.exports = { scanInstalledApps };
