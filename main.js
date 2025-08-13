const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const isDev = !app.isPackaged;
require("electron-reload")(__dirname, {
  electron: path.join(__dirname, "node_modules", ".bin", "electron"),
});

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
    const files = fs.readdirSync(folderPath); // files in folder

    return files.map((file) => {
      const fullPath = path.join(folderPath, file);
      const stats = fs.statSync(fullPath); // get file details

      return {
        name: file,
        size: stats.size, // byte size
        isDirectory: stats.isDirectory(),
        modified: stats.mtime, // last modified date
      };
    });
  } catch (err) {
    console.error("Error scanning folder:", err);
    return [];
  }
});

// Handle file deletion
ipcMain.handle("delete-files", async (event, filePaths) => {
  console.log("Delete request paths:", filePaths);
  try {
    for (const filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true }); // delete folder & contents
        } else {
          fs.unlinkSync(filePath); // delete singular file
        }
      }
    }
    return { success: true };
  } catch (err) {
    console.error("Error deleting file(s):", err);
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

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
