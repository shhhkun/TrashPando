const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const isDev = !app.isPackaged;
const mime = require("mime-types");
require("electron-reload")(__dirname, {
  electron: path.join(__dirname, "node_modules", ".bin", "electron"),
});
const { Worker } = require("worker_threads");
// const chokidar = require("chokidar");
// const watchers = new Map(); // to track folder watchers

// const ignoredFolders = [
//   "Music",
//   "Pictures",
//   "Videos",
//   "My Music",
//   "My Pictures",
//   "My Videos",
// ];
// const ignoredRegex = new RegExp(ignoredFolders.join("|"));

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

function runWatcherWorker(task, folderPath) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, "watcherWorker.js"));

    worker.on("message", (msg) => {
      // forward to renderer
      if (msg.folderPath) {
        worker.eventSender?.send("folder-changed", msg);
      }
      resolve(message);
    });

    worker.once("error", reject);

    worker.postMessage({ task, folderPath });
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

// ipcMain.handle("watch-folder", (event, folderPath) => {
//   if (watchers.has(folderPath)) return; // already watching

//   const watcher = chokidar.watch(folderPath, {
//     ignoreInitial: true,
//     ignorePermissionErrors: true,
//     ignored: ignoredRegex,
//     //depth: 0,
//   });

//   let pendingInvalidation = null;

//   watcher.on("all", () => {
//     if (pendingInvalidation) clearTimeout(pendingInvalidation);

//     pendingInvalidation = setTimeout(() =>{
//       event.sender.send("folder-changed", { folderPath });
//       pendingInvalidation = null;
//     }, 500); // 0.5s debounce
//   });

//   watcher.on("error", (err) => {
//     console.warn("[Watcher error]", err.message);
//   });

//   watchers.set(folderPath, watcher);
// });

// ipcMain.handle("unwatch-folder", (event, folderPath) => {
//   const watcher = watchers.get(folderPath);
//   if (watcher) {
//     watcher.close();
//     watchers.delete(folderPath);
//   }
// });

ipcMain.handle("watch-folder", (event, folderPath) => {
  runWatcherWorker("watch", folderPath).then(() => {
    worker.eventSender = event.sender; // attach renderer sender so worker thread can communicate
  });
});

ipcMain.handle("unwatch-folder", (event, folderPath) => {
  runWatcherWorker("unwatch", folderPath);
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
