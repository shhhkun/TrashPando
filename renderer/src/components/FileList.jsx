export default function FileList({ files, selectedFiles, toggleSelectFile, pandaGreen, darkGrey, hoverDarkGrey, lightText }) {
  return (
    <div
      style={{
        marginTop: 10,
        maxHeight: 300,
        overflowY: 'auto',
        border: '1px solid #555',
        backgroundColor: darkGrey,
      }}
    >
      {files.length === 0 && (
        <div style={{ padding: 10, color: lightText }}>No files to display</div>
      )}
      {files.map(file => {
        const isSelected = selectedFiles.has(file.name);
        return (
          <div
            key={file.name}
            onClick={() => toggleSelectFile(file.name)}
            style={{
              padding: '6px 8px',
              cursor: 'pointer',
              backgroundColor: isSelected ? darkGrey : darkGrey,
              borderLeft: isSelected ? `6px solid ${pandaGreen}` : '6px solid transparent',
              userSelect: 'none',
              transition: 'background-color 0.2s ease',
              color: lightText,
            }}
            onMouseEnter={e => {
              if (!isSelected) e.currentTarget.style.backgroundColor = hoverDarkGrey;
            }}
            onMouseLeave={e => {
              if (!isSelected) e.currentTarget.style.backgroundColor = darkGrey;
            }}
          >
            {file.name} - {file.size} bytes - {file.isDirectory ? 'Folder' : 'File'}
          </div>
        );
      })}
    </div>
  );
}
