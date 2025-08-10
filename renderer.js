const { ipcRenderer } = require('electron');

const selectFolderBtn = document.getElementById('selectFolderBtn');
const folderPathDiv = document.getElementById('folderPath');

selectFolderBtn.addEventListener('click', async () => {
  const folderPath = await ipcRenderer.invoke('select-folder');
  folderPathDiv.textContent = folderPath ? folderPath : 'No folder selected';
  console.log('Selected folder:', folderPath);
});
