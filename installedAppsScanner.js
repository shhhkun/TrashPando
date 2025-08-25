const fs = require("fs");
const path = require("path");
const isWindows = process.platform === "win32";

// target folders (Windows-only for now)
const programFiles = [
  process.env["ProgramFiles"] || "C:\\Program Files",
  process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)",
];
const userLocalPrograms = path.join(
  process.env.USERPROFILE || "C:\\Users\\Public",
  "AppData\\Local\\Programs"
);

function getFolderSize(folderPath) {
  let totalSize = 0;
  try {
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      const fullPath = path.join(folderPath, file);
      const stats = fs.statSync(fullPath);
      if (stats.isFile()) totalSize += stats.size;
      else if (stats.isDirectory()) totalSize += getFolderSize(fullPath);
    }
  } catch {
    // ignore errors
  }
  return totalSize;
}

function extractAppIcon(exePath, fallbackIcon = null) {
  try {
    const icon = nativeImage.createFromPath(exePath);
    if (icon.isEmpty() && fallbackIcon) return fallbackIcon;

    const tempDir = path.join(__dirname, "temp-icons");
    fs.mkdirSync(tempDir, { recursive: true });
    const iconPath = path.join(
      tempDir,
      path.basename(exePath, ".exe") + ".png"
    );
    fs.writeFileSync(iconPath, icon.toPNG());
    return iconPath;
  } catch {
    return fallbackIcon;
  }
}

function scanInstalledApps() {
  if (!isWindows) return [];

  const targetFolders = [...programFiles, userLocalPrograms];
  const apps = [];

  for (const folder of targetFolders) {
    try {
      const entries = fs.readdirSync(folder);
      for (const entry of entries) {
        const fullPath = path.join(folder, entry);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          const exeFiles = fs
            .readdirSync(fullPath)
            .filter((f) => f.toLowerCase().endsWith(".exe"));
          if (exeFiles.length === 0) continue;

          const exePath = path.join(fullPath, exeFiles[0]); // take first exe
          const size = getFolderSize(fullPath);
          const iconPath = extractAppIcon(exePath);

          apps.push({
            name: entry,
            exePath,
            folderPath: fullPath,
            size,
            created: stats.birthtime,
            modified: stats.mtime,
            iconPath,
            type: "app",
          });
        }
      }
    } catch {
      // skip folder
    }
  }

  return apps;
}

module.exports = { scanInstalledApps };
