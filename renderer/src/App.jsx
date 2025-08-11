import { useState } from "react";

const pandaGreen = "rgb(76, 175, 80)"; // fresh green border for selected
const darkGrey = "rgb(34, 34, 34)"; // main bg color (dark grey)
const hoverDarkGrey = "rgb(54, 54, 54)"; // hover bg color (lighter dark grey)
const lightText = "rgb(230, 230, 230)"; // text color (light)

function App() {
  const [folderPath, setFolderPath] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());

  function toggleSelectFile(fileName) {
    setSelectedFiles((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(fileName)) {
        newSelected.delete(fileName);
      } else {
        newSelected.add(fileName);
      }
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
      <button onClick={handleSelectFolder}>Select Folder</button>
      <div style={{ marginTop: 20, fontStyle: "italic" }}>
        {folderPath || "No folder selected"}
      </div>
      <div
        style={{
          marginTop: 10,
          maxHeight: 300,
          overflowY: "auto",
          border: "1px solid #555",
          backgroundColor: darkGrey,
        }}
      >
        {files.length === 0 && (
          <div style={{ padding: 10 }}>No files to display</div>
        )}
        {files.map((file) => {
          const isSelected = selectedFiles.has(file.name);
          return (
            <div
              key={file.name}
              onClick={() => toggleSelectFile(file.name)}
              style={{
                padding: "6px 8px",
                cursor: "pointer",
                backgroundColor: isSelected ? darkGrey : darkGrey,
                borderLeft: isSelected
                  ? `6px solid ${pandaGreen}`
                  : "6px solid transparent",
                userSelect: "none",
                transition: "background-color 0.2s ease",
                color: lightText,
              }}
              onMouseEnter={(e) => {
                if (!isSelected)
                  e.currentTarget.style.backgroundColor = hoverDarkGrey;
              }}
              onMouseLeave={(e) => {
                if (!isSelected)
                  e.currentTarget.style.backgroundColor = darkGrey;
              }}
            >
              {file.name} - {file.size} bytes -{" "}
              {file.isDirectory ? "Folder" : "File"}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
