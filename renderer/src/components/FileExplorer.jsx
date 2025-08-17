import { useState, useRef, useEffect } from "react";
import FileSelector from "./FileSelector";
import FileList from "./FileList";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import Toast from "./Toast";

// const pandaGreen = "rgb(76, 175, 80)"; // fresh green border for selected
// const darkGrey = "rgb(34, 34, 34)"; // main bg color (dark grey)
// const hoverDarkGrey = "rgb(54, 54, 54)"; // hover bg color (lighter dark grey)
// const lightText = "rgba(230, 230, 230, 1)"; // text color (light)

export default function FileExplorer({ folderPath, setFolderPath }) {
  const fileListRef = useRef(null);

  //const [folderPath, setFolderPath] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [toastType, setToastType] = useState("info");
  const [filesToDelete, setFilesToDelete] = useState([]);
  const [pathSeparator, setPathSeparator] = useState("/");
  const [commonFolders, setCommonFolders] = useState({});

  useEffect(() => {
    // fetch path separator for OS
    async function fetchSeparator() {
      const sep = await window.electronAPI.getPathSeparator();
      setPathSeparator(sep);
    }
    fetchSeparator();
  }, []);

  useEffect(() => {
    // fetch common folders
    async function fetchCommonFolders() {
      const folders = await window.electronAPI.getCommonFolders();
      setCommonFolders(folders);
    }
    fetchCommonFolders();
  }, []);

  // scan folder whenever folderPath changes
  useEffect(() => {
    if (!folderPath) return;
    async function scan() {
      const scannedFiles = await window.electronAPI.scanFolder(folderPath);
      setFiles(scannedFiles);
      setSelectedFiles(new Set());
    }
    scan();
  }, [folderPath]);

  async function handleSelectFolder() {
    const path = await window.electronAPI.selectFolder();
    setFolderPath(path);
    if (path) {
      const scannedFiles = await window.electronAPI.scanFolder(path);
      setFiles(scannedFiles);
      setSelectedFiles(new Set());
    } else {
      setFiles([]);
      setSelectedFiles(new Set());
    }
  }

  async function confirmDelete() {
    setShowConfirm(false);

    const filteredToDelete = filesToDelete.filter((fileName) => {
      const file = files.find((f) => f.name === fileName);
      return !(file.isDirectory && file.isEmptyFolder === false);
    });

    if (filteredToDelete.length === 0) {
      setToastMsg("No deletable files selected.");
      setToastType("info");
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }

    const pathsToDelete = filesToDelete.map((name) =>
      folderPath.endsWith(pathSeparator)
        ? `${folderPath}${name}`
        : `${folderPath}${pathSeparator}${name}`
    );

    try {
      const result = await window.electronAPI.deleteFiles(pathsToDelete);

      if (result.success) {
        const deletedCount = filesToDelete.length;
        setToastMsg(
          `Deleted ${deletedCount} file${deletedCount > 1 ? "s" : ""}`
        );
        setToastType("info");
        setFiles((prev) => prev.filter((f) => !filesToDelete.includes(f.name)));
        setSelectedFiles(new Set());
      } else {
        setToastMsg(`Error deleting files: ${result.error}`);
        setToastType("error");
      }
    } catch (err) {
      setToastMsg(`Unexpected error: ${err.message}`);
      setToastType("error");
    }

    setTimeout(() => setToastMsg(null), 3000);
  }

  return (
    <div className="flex flex-col p-4 gap-4">
      {/* Select Folder and Delete Buttons */}
      <div className="flex gap-2">
        <button className="no-drag" onClick={handleSelectFolder}>
          Select Folder
        </button>

        <button
          className="no-drag"
          onClick={() => {
            setFilesToDelete(Array.from(selectedFiles));
            setShowConfirm(true);
          }}
          disabled={selectedFiles.size === 0}
        >
          Delete Selected
        </button>
      </div>

      {/* Common Folders Quick Access/Nav */}
      {/*
      <div className="flex gap-2 flex-wrap">
        {Object.entries(commonFolders).map(([key, folder]) => (
          <button
            key={key}
            className="no-drag"
            onClick={async () => {
              setFolderPath(folder);
              const scannedFiles = await window.electronAPI.scanFolder(folder);
              setFiles(scannedFiles);
              setSelectedFiles(new Set());
            }}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>
      */}

      {/* Folder Path Display */}
      <div className="italic">{folderPath || "No folder selected"}</div>

      {/* Folder Contents Render */}
      <div id="file-list-wrapper" className="flex-1 overflow-auto">
        <FileSelector
          containerRef={fileListRef}
          items={files}
          selectedIds={selectedFiles}
          render={(items, selectedIds) => (
            <FileList
              files={items}
              selectedFiles={selectedIds}
              toggleSelectFile={(fileName) => {
                const item = files.find((f) => f.name === fileName);
                if (!item || (item.isDirectory && !item.isEmptyFolder)) return;
              }}
              listRef={fileListRef}
              onOpenFolder={async (folderName) => {
                const newPath = folderPath.endsWith(pathSeparator)
                  ? `${folderPath}${folderName}`
                  : `${folderPath}${pathSeparator}${folderName}`;
                const scannedFiles = await window.electronAPI.scanFolder(
                  newPath
                );
                setFolderPath(newPath);
                setFiles(scannedFiles);
                setSelectedFiles(new Set());
              }}
            />
          )}
          onSelectionChange={(newSelection) =>
            setSelectedFiles(new Set(newSelection))
          }
        />
      </div>

      <ConfirmDeleteModal
        visible={showConfirm}
        count={selectedFiles.size}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />

      <Toast
        message={toastMsg}
        type={toastType}
        onClose={() => setToastMsg(null)}
      />
    </div>
  );
}
