const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  nativeImage,
} = require("electron");
const path = require("path");
const fs = require("fs");
const isDev = !app.isPackaged;
require("electron-reload")(path.join(__dirname, "renderer", "src"), {
  electron: path.join(__dirname, "node_modules", ".bin", "electron"),
});

const { Worker } = require("worker_threads");
const { findDuplicates } = require("./duplicateManager.js");
const { scanInstalledAppsRegistry } = require("./registryScanner.js");

const { execFile } = require("child_process");

// function extractIconFromExe(filePath) {
//   return new Promise((resolve, reject) => {
//     const outPath = path.join(
//       app.getPath("temp"),
//       `${path.basename(filePath)}.png`
//     );

//     const psCommand = `
//       Add-Type -AssemblyName System.Drawing;
//       $icon = [System.Drawing.Icon]::ExtractAssociatedIcon('${filePath}');
//       if ($icon -ne $null) {
//         $bitmap = $icon.ToBitmap();
//         $bitmap.Save('${outPath}', [System.Drawing.Imaging.ImageFormat]::Png);
//         Write-Output '${outPath}';
//       }
//     `;

//     execFile(
//       "powershell.exe",
//       ["-NoProfile", "-Command", psCommand],
//       { windowsHide: true },
//       (err, stdout, stderr) => {
//         if (err) {
//           console.error(
//             "[extractIconFromExe] Failed for:",
//             filePath,
//             stderr || err
//           );
//           return reject(err);
//         }

//         const output = stdout.toString().trim();
//         if (!fs.existsSync(outPath)) {
//           return reject(new Error("Icon not created"));
//         }

//         console.log("[extractIconFromExe] Success, cached at:", outPath);
//         resolve(outPath);
//       }
//     );
//   });
// }

function extractIconFromExe(filePathWithIndex) {
  return new Promise((resolve, reject) => {
    // split out index if present
    let [filePath, index] = filePathWithIndex.split(",");
    index = parseInt(index || "0", 10); // default to 0

    const outPath = path.join(
      app.getPath("temp"),
      `${path.basename(filePath)}_${index}.png`
    );

    console.log("[extractIconFromExe] Attempting extraction for:", filePath, "Index:", index);

    const psCommand = `
      Add-Type -AssemblyName System.Drawing;
      $icon = [System.Drawing.Icon]::ExtractAssociatedIcon('${filePath}');
      if ($icon -ne $null) {
        $bitmap = $icon.ToBitmap();
        $bitmap.Save('${outPath}', [System.Drawing.Imaging.ImageFormat]::Png);
        Write-Output '${outPath}';
      }
    `;

    execFile(
      "powershell.exe",
      ["-NoProfile", "-Command", psCommand],
      { windowsHide: true },
      (err, stdout, stderr) => {
        if (err) {
          console.error("[extractIconFromExe] Failed for:", filePath, stderr || err);
          return reject(err);
        }

        if (!fs.existsSync(outPath)) {
          return reject(new Error("Icon not created"));
        }

        console.log("[extractIconFromExe] Success, cached at:", outPath);
        resolve(outPath);
      }
    );
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // Preload script
      contextIsolation: true, // secure
      nodeIntegration: false, // Let preload access node APIs
    },
    autoHideMenuBar: true,
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

function runWatcherWorker(task, folderPath, sender) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, "watcherWorker.js"));

    worker.on("message", (msg) => {
      // forward to renderer
      if (msg.folderPath && sender) {
        sender.send("folder-changed", msg);
        //worker.eventSender?.send("folder-changed", msg);
      }
      resolve(msg);
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

ipcMain.handle("watch-folder", (event, folderPath) => {
  runWatcherWorker("watch", folderPath, event.sender);
});

ipcMain.handle("unwatch-folder", (event, folderPath) => {
  runWatcherWorker("unwatch", folderPath);
});

ipcMain.handle("find-duplicates", async (event, folderPath) => {
  return await findDuplicates(folderPath);
});

ipcMain.handle("scan-installed-apps-registry", async () => {
  try {
    const apps = [];
    for await (const batch of scanInstalledAppsRegistry()) {
      apps.push(...batch);
    }
    return apps;
  } catch (err) {
    console.error("Failed to scan installed apps:", err);
    return [];
  }
});

// for debugging
ipcMain.handle("write-file", async (event, fileName, data) => {
  const filePath = path.join(__dirname, fileName);
  await fs.promises.writeFile(filePath, data, "utf-8");
  return filePath;
});

ipcMain.handle("get-app-icon", async (event, iconPath) => {
  try {
    if (!iconPath || !fs.existsSync(iconPath)) return null;

    // if user directly passed in a png/ico file
    if (/\.(ico|png)$/i.test(iconPath)) {
      const image = nativeImage.createFromPath(iconPath);
      return image.isEmpty()
        ? null
        : image.resize({ width: 48, height: 48 }).toDataURL();
    }

    // otherwise extract from exe/dll (handles index now)
    if (/\.(exe|dll)/i.test(iconPath)) {
      try {
        const extractedPath = await extractIconFromExe(iconPath);
        const image = nativeImage.createFromPath(extractedPath);
        return image.isEmpty()
          ? null
          : image.resize({ width: 48, height: 48 }).toDataURL();
      } catch (err) {
        console.log("Icon extraction failed:", iconPath, err.message);
        return null;
      }
    }

    return null;
  } catch (err) {
    console.error("Failed to get icon:", err);
    return null;
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
