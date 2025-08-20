const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  scanFolder: (folderPath) => ipcRenderer.invoke("scan-folder", folderPath),
  deleteFiles: (filePaths) => ipcRenderer.invoke("delete-files", filePaths),
  getPathSeparator: () => ipcRenderer.invoke("get-path-sep"),
  getCommonFolders: () => ipcRenderer.invoke("get-common-folders"),
  scanRecursive: (folderPath) => ipcRenderer.invoke("scan-recursive", folderPath),

  watchFolder: (folderPath) => ipcRenderer.invoke("watch-folder", folderPath),
  unwatchFolder: (folderPath) => ipcRenderer.invoke("unwatch-folder", folderPath),
  onFolderChanged: (callback) => {
    const wrapped = (_event, data) => callback(data);
    ipcRenderer.on("folder-changed", wrapped);
    return wrapped; // return ref so you can remove it later
  },
  offFolderChanged: (listener) => {
    ipcRenderer.removeListener("folder-changed", listener);
  },
});
