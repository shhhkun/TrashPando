const selectFolderBtn = document.getElementById('selectFolderBtn');
const folderPathDiv = document.getElementById('folderPath');
const fileListDiv = document.getElementById('fileList');

selectFolderBtn.addEventListener('click', async () => {
  const folderPath = await window.electronAPI.selectFolder();
  folderPathDiv.textContent = folderPath || 'No folder selected';

  if (folderPath) {
    const files = await window.electronAPI.scanFolder(folderPath);
    fileListDiv.innerHTML = files.map(file =>
      `<div>${file.name} - ${file.size} bytes - ${file.isDirectory ? `Folder` : `File`}</div>`
    ).join('');
  }
  
  console.log('Selected folder:', folderPath);
});
