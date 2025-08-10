const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

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

  win.loadFile("index.html");
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

    return files.map(file => {
      const fullPath = path.join(folderPath, file);
      const stats = fs.statSync(fullPath); // get file details

      return {
        name: file,
        size: stats.size, // byte size
        isDirectory: stats.isDirectory(),
        modified: stats.mtime // last modified date
      };
    });
  } catch (err) {
    console.error('Error scanning folder:', err);
    return [];
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
