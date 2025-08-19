const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const isDev = !app.isPackaged;
const mime = require("mime-types");
require("electron-reload")(__dirname, {
  electron: path.join(__dirname, "node_modules", ".bin", "electron"),
});
// const winattr = require("winattr");
// const isWindows = process.platform === "win32";
const { Worker } = require("worker_threads");

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

function runWorker(task, payload) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, "scanWorker.js"));

    // worker.once("message", (result) => {
    //   resolve(result);
    //   worker.terminate();
    // });

    worker.on("message", (msg) => {
      if (msg.type === "log") console.log("WORKER LOG:", msg.message);
      else resolve(msg); // the result of scan
    });

    worker.once("error", (err) => {
      reject(err);
      worker.terminate();
    });

    worker.postMessage({ task, ...payload });
  });
}

// Open folder dialog when renderer asks
ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  return result.filePaths[0] || null;
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

ipcMain.handle("scan-folder", async (event, folderPath) => {
  if (!folderPath) return [];
  const result = await runWorker("scan", { dir: folderPath, recursive: false });
  return result.items;
});

ipcMain.handle("scan-recursive", async (event, folderPath) => {
  if (!folderPath) return { visibleSize: 0, hiddenSize: 0, items: [] };
  const result = await runWorker("scan", { dir: folderPath, recursive: true });
  return { path: folderPath, ...result };
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
