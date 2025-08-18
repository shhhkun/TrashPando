const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  scanFolder: (folderPath) => ipcRenderer.invoke("scan-folder", folderPath),
  deleteFiles: (filePaths) => ipcRenderer.invoke("delete-files", filePaths),
  getPathSeparator: () => ipcRenderer.invoke("get-path-sep"),
  getCommonFolders: () => ipcRenderer.invoke("get-common-folders"),
  scanRecursive: () => ipcRenderer.invoke("scan-recursive"),
});
