import { useState, useRef, useEffect } from "react";
import Selecto from "react-selecto";
import path from "path";
import FileList from "./components/FileList";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import Toast from "./components/Toast";

const pandaGreen = "rgb(76, 175, 80)"; // fresh green border for selected
const darkGrey = "rgb(34, 34, 34)"; // main bg color (dark grey)
const hoverDarkGrey = "rgb(54, 54, 54)"; // hover bg color (lighter dark grey)
const lightText = "rgba(230, 230, 230, 1)"; // text color (light)

function App() {
  const fileListRef = useRef(null);

  const [folderPath, setFolderPath] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [toastType, setToastType] = useState("info");
  const [filesToDelete, setFilesToDelete] = useState([]); // snapshot of files to delete
  const [pathSeparator, setPathSeparator] = useState("/"); // default

  useEffect(() => {
    async function fetchSeparator() {
      const sep = await window.electronAPI.getPathSeparator();
      setPathSeparator(sep);
    }
    fetchSeparator();
  }, []);

  const [commonFolders, setCommonFolders] = useState({}); // fetch common folder paths

  useEffect(() => {
    async function fetchCommonFolders() {
      const folders = await window.electronAPI.getCommonFolders();
      setCommonFolders(folders);
    }
    fetchCommonFolders();
  }, []);

  function toggleSelectFile(fileName) {
    const clickedFile = files.find((f) => f.name === fileName);

    if (clickedFile?.isDirectory && clickedFile?.isEmptyFolder === false) {
      return; // ignore selection
    }

    setSelectedFiles((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(fileName)) newSelected.delete(fileName);
      else newSelected.add(fileName);
      return newSelected;
    });
  }

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

    // filter out non-empty folders before deleting
    const filteredToDelete = filesToDelete.filter((fileName) => {
      const file = files.find((f) => f.name === fileName);
      // allow deleting if not folder or empty folder
      return !(file.isDirectory && file.isEmptyFolder === false);
    });

    // if nothing left to delete, notify and abort
    if (filteredToDelete.length === 0) {
      setToastMsg("No deletable files selected.");
      setToastType("info");
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }

    // ensure proper file paths for OS
    const pathsToDelete = filesToDelete.map((name) =>
      folderPath.endsWith(pathSeparator)
        ? `${folderPath}${name}`
        : `${folderPath}${pathSeparator}${name}`
    );

    console.log("Selected files:", filesToDelete);
    console.log("Folder path:", folderPath);
    console.log("Paths to delete:", pathsToDelete);

    try {
      const result = await window.electronAPI.deleteFiles(pathsToDelete);

      if (result.success) {
        const deletedCount = filesToDelete.length;
        setToastMsg(
          `Deleted ${deletedCount} file${deletedCount > 1 ? "s" : ""}`
        );
        setToastType("info");

        // update UI to remove deleted files
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

    setTimeout(() => setToastMsg(null), 3000); // auto dismiss toast
  }

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "sans-serif",
        backgroundColor: darkGrey,
        color: lightText,
        height: "100vh",
        width: "100vw",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column", // stack children vertically
        alignItems: "center", // center horizontally
      }}
    >
      <h1>Trashu🐼</h1>

      <div style={{ display: "flex", gap: "10px" }}>
        {/* Select Folder */}
        <button className="no-drag" onClick={handleSelectFolder}>
          Select Folder
        </button>

        {/* Delete Button */}
        <button
          className="no-drag"
          onClick={() => {
            setFilesToDelete(Array.from(selectedFiles));
            setShowConfirm(true);
          }}
          disabled={selectedFiles.size === 0}
          style={{ marginLeft: 10 }}
        >
          Delete Selected
        </button>
      </div>

      {/* Common Folders Buttons */}
      <div
        style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}
      >
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

      {/* Folder Contents */}
      <div style={{ marginTop: 20, fontStyle: "italic" }}>
        {folderPath || "No folder selected"}
      </div>

      <FileList
        files={files}
        selectedFiles={selectedFiles}
        toggleSelectFile={toggleSelectFile}
        listRef={fileListRef} // pass ref
        onOpenFolder={async (folderName) => {
          const newPath = folderPath.endsWith(pathSeparator)
            ? `${folderPath}${folderName}`
            : `${folderPath}${pathSeparator}${folderName}`;

          const scannedFiles = await window.electronAPI.scanFolder(newPath);
          setFolderPath(newPath);
          setFiles(scannedFiles);
          setSelectedFiles(new Set());
        }}
      />

      <Selecto
        container={document.body}
        dragContainer={fileListRef.current} // restrict drag area
        selectableTargets={[".file-item"]}
        hitRate={0}
        selectByClick={true}
        selectFromInside={true}
        onDragStart={(e) => {
          if (e.inputEvent.target.closest(".no-drag")) {
            e.stop(); // prevent drag if clicking on buttons
          }
        }}
        onSelect={(e) => {
          const selectedNames = e.selected
            .map((el) => el.dataset.name)
            .filter((name) => {
              const file = files.find((f) => f.name === name);
              return file && !file.isDirectory; // only select files, not folders
            });
          setSelectedFiles(new Set(selectedNames));
        }}
      />

      {/* Confirm Delete Form/Modal */}
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

export default App;
