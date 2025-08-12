import { useState } from 'react';
import FileList from './components/FileList';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import Toast from './components/Toast';

const pandaGreen = "rgb(76, 175, 80)"; // fresh green border for selected
const darkGrey = "rgb(34, 34, 34)"; // main bg color (dark grey)
const hoverDarkGrey = "rgb(54, 54, 54)"; // hover bg color (lighter dark grey)
const lightText = "rgba(230, 230, 230, 1)"; // text color (light)

function App() {
  const [folderPath, setFolderPath] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [toastType, setToastType] = useState('info');

  function toggleSelectFile(fileName) {
    setSelectedFiles(prev => {
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
    const pathsToDelete = Array.from(selectedFiles).map(name => `${folderPath}/${name}`);
    const result = await window.electronAPI.deleteFiles(pathsToDelete);

    if (result.success) {
      setToastMsg(`Deleted ${selectedFiles.size} file${selectedFiles.size > 1 ? 's' : ''}`);
      setToastType('info');
      setFiles(files.filter(f => !selectedFiles.has(f.name)));
      setSelectedFiles(new Set());
    } else {
      setToastMsg(`Error deleting files: ${result.error}`);
      setToastType('error');
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
        boxSizing: "border-box",
      }}
    >
      <h1>Storage Cleaner</h1>

      {/* Select Folder */}
      <button onClick={handleSelectFolder}>Select Folder</button>

      {/* Delete Button */}
      <button
        onClick={() => setShowConfirm(true)}
        disabled={selectedFiles.size === 0}
        style={{ marginLeft: 10 }}
      >
        Delete Selected
      </button>

      {/* Folder Contents */}
      <div style={{ marginTop: 20, fontStyle: "italic" }}>
        {folderPath || "No folder selected"}
      </div>

      <FileList
        files={files}
        selectedFiles={selectedFiles}
        toggleSelectFile={toggleSelectFile}
        pandaGreen={pandaGreen}
        darkGrey={darkGrey}
        hoverDarkGrey={hoverDarkGrey}
        lightText={lightText}
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
