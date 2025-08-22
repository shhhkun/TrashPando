const { parentPort } = require("worker_threads");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const winattr = require("winattr");
const isWindows = process.platform === "win32";

function logDebug(message) {
  parentPort.postMessage({ type: "log", message });
}

function isHiddenOrSystem(fullPath, fileName) {
  // UNIX/Linux/macOS: hidden files start with dot
  if (!isWindows && fileName.startsWith(".")) return true;

  // Windows: check hidden/system attributes
  if (isWindows) {
    try {
      const attrs = winattr.getSync(fullPath);
      if (attrs.hidden || attrs.system) {
        // logDebug(
        //   `${fullPath} -> hidden=${attrs.hidden}, system=${attrs.system}`
        // );
      }
      return attrs.hidden || attrs.system; // return true if hidden or system attribute is set
    } catch {
      //logDebug(`Failed to read attributes for ${fullPath}: ${err}`);
      return false; // if we can't read attributes, assume not hidden
    }
  }

  return false; // not hidden
}

// recursive scan for folder contents + total size
function scanFolderRecursive(dirPath, recursive = true) {
  const items = [];
  let visibleSize = 0;
  let hiddenSize = 0;

  try {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      let hidden = isHiddenOrSystem(fullPath, file);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        let innerVisible = 0,
          innerHidden = 0,
          innerItems = [];

        if (recursive) {
          const result = scanFolderRecursive(fullPath, true);
          innerVisible = result.visibleSize;
          innerHidden = result.hiddenSize;
          innerItems = result.items;
        } else {
          // shallow: just compute counts and folder size for one level
          try {
            const children = fs.readdirSync(fullPath).filter((f) => {
              const cFullPath = path.join(fullPath, f);
              return !isHiddenOrSystem(cFullPath, f);
            });

            innerItems = children.map((f) => {
              const cFullPath = path.join(fullPath, f);
              const cStats = fs.statSync(cFullPath);
              return {
                isDirectory: cStats.isDirectory(),
                size: cStats.isFile() ? cStats.size : 0,
              };
            });

            innerVisible = innerItems.reduce((acc, c) => acc + c.size, 0);
          } catch {
            innerItems = [];
          }
        }

        if (hidden) hiddenSize += innerVisible + innerHidden;
        else visibleSize += innerVisible;

        if (!hidden) {
          items.push({
            name: file,
            //size: recursive ? innerVisible + innerHidden : 0,
            //size: 0,
            isDirectory: true,
            isEmptyFolder: innerItems.length === 0,
            folderCount: innerItems.filter((i) => i.isDirectory).length,
            fileCount: innerItems.filter((i) => !i.isDirectory).length,
            modified: stats.mtime,
            created: stats.birthtime,
          });
        }
      } else {
        if (hidden) hiddenSize += stats.size;
        else visibleSize += stats.size;

        if (!hidden) {
          items.push({
            name: file,
            size: stats.size,
            isDirectory: false,
            type: mime.lookup(file) || "Unknown",
            modified: stats.mtime,
            created: stats.birthtime,
          });
        }
      }
    }
  } catch {
    // ignore
  }

  return { visibleSize, hiddenSize, items };
}

parentPort.on("message", (payload) => {
  if (payload.task === "scan") {
    const { dir, recursive = true } = payload;
    const result = scanFolderRecursive(dir, recursive);
    parentPort.postMessage(result);
  }
});
