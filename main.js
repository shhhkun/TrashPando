const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const isDev = !app.isPackaged;
const mime = require("mime-types");
require("electron-reload")(__dirname, {
  electron: path.join(__dirname, "node_modules", ".bin", "electron"),
});
const winattr = require("winattr");
const isWindows = process.platform === "win32";

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // Preload script
      contextIsolation: true, // secure
      nodeIntegration: false, // Let preload access node APIs
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173"); // vite dev server
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "renderer", "dist", "index.html"));
  }
}

function isHiddenOrSystem(fullPath, fileName) {
  // UNIX/Linux/macOS: hidden files start with dot
  if (!isWindows && fileName.startsWith(".")) return true;

  // Windows: check hidden/system attributes
  if (isWindows) {
    try {
      const attrs = winattr.getSync(fullPath);
      return attrs.hidden || attrs.system; // return true if hidden or system attribute is set
    } catch {
      return false; // if we can't read attributes, assume not hidden
    }
  }

  return false; // not hidden
}

// recursive scan for folder contents + total size
function scanFolderRecursive(dirPath) {
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
        const {
          visibleSize: innerVisible,
          hiddenSize: innerHidden,
          items: innerItems,
        } = scanFolderRecursive(fullPath);
        
        if (hidden) hiddenSize += innerVisible + innerHidden;
        else visibleSize += innerVisible;

        items.push({
          name: file,
          size: innerVisible + innerHidden,
          isDirectory: true,
          isEmptyFolder: innerItems.length === 0,
          folderCount: innerItems.filter((i) => i.isDirectory).length,
          fileCount: innerItems.filter((i) => !i.isDirectory).length,
        });
      } else {
        if (hidden) hiddenSize += stats.size;
        else visibleSize += stats.size;

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
  } catch {
    // ignore
  }

  return { visibleSize, hiddenSize, items };
}


// Open folder dialog when renderer asks
ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  return result.filePaths[0] || null;
});

// Handle scanning folder for files
ipcMain.handle("scan-folder", async (event, folderPath) => {
  if (!folderPath) return [];

  try {
    const files = fs.readdirSync(folderPath);

    const result = files.map((file) => {
      try {
        if (isHiddenOrSystem(folderPath, file)) return null; // ignore hidden/system files

        const fullPath = path.join(folderPath, file);
        const stats = fs.statSync(fullPath);

        let isEmptyFolder = false;
        let folderCount = 0;
        let fileCount = 0;
        let folderSize = 0;

        if (stats.isDirectory()) {
          try {
            const innerFiles = fs
              .readdirSync(fullPath)
              .filter((f) => f.toLowerCase() !== "desktop.ini");
            isEmptyFolder = innerFiles.length === 0;
            folderCount = innerFiles.filter((f) =>
              fs.statSync(path.join(fullPath, f)).isDirectory()
            ).length;
            fileCount = innerFiles.length - folderCount;
          } catch {
            isEmptyFolder = false; // cannot access folder, mark it as non-empty to prevent deletion
          }
        }

        return {
          name: file,
          size: stats.isDirectory() ? folderSize : stats.size,
          isDirectory: stats.isDirectory(),
          modified: stats.mtime,
          created: stats.birthtime,
          type: stats.isDirectory() ? "Folder" : mime.lookup(file) || "Unknown",
          isEmptyFolder,
          folderCount,
          fileCount,
        };
      } catch {
        return null; // skip files/folders we cannot access
      }
    });

    return result.filter(Boolean); // remove nulls
  } catch (err) {
    console.error("Error scanning folder:", err);
    return [];
  }
});

// Handle file deletion
ipcMain.handle("delete-files", async (event, filePaths) => {
  console.log("Trash (delete) request paths:", filePaths);
  try {
    for (const filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        await shell.trashItem(filePath); // move to trash; cross-platform
      }
    }
    return { success: true };
  } catch (err) {
    console.error("Error trashing file(s):", err);
    return { success: false, error: err.message };
  }
});

// Path separator for cross-platform compatibility
ipcMain.handle("get-path-sep", () => {
  return path.sep;
});

// Get common OS folders (may add more as needed)
ipcMain.handle("get-common-folders", () => {
  return {
    documents: app.getPath("documents"),
    downloads: app.getPath("downloads"),
    pictures: app.getPath("pictures"),
    desktop: app.getPath("desktop"),
    music: app.getPath("music"),
    videos: app.getPath("videos"),
  };
});

// Scan documents (test)
ipcMain.handle("scan-documents", () => {
  const docPath = app.getPath("documents");
  const { visibleSize, hiddenSize, items } = scanFolderRecursive(docPath);
  return { path: docPath, visibleSize, hiddenSize, items };
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
