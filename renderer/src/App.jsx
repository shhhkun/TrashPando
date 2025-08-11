import { useState } from 'react';

function App() {
  const [folderPath, setFolderPath] = useState(null);
  const [files, setFiles] = useState([]);

  async function handleSelectFolder() {
    const path = await window.electronAPI.selectFolder();
    setFolderPath(path);
    if (path) {
      const scannedFiles = await window.electronAPI.scanFolder(path);
      setFiles(scannedFiles);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Storage Cleaner</h1>
      <button onClick={handleSelectFolder}>Select Folder</button>
      <div style={{ marginTop: 20, fontStyle: 'italic' }}>
        {folderPath || 'No folder selected'}
      </div>
      <div style={{ marginTop: 10 }}>
        {files.map(file => (
          <div key={file.name}>
            {file.name} - {file.size} bytes - {file.isDirectory ? 'Folder' : 'File'}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
