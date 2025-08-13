import "./FileList.css"; // CSS file for hover/selection

export default function FileList({
  files,
  selectedFiles,
  toggleSelectFile,
  listRef,
}) {
  return (
    <div
      ref={listRef}
      className="file-list-container"
    >
      {/* Header bar with vertical separators */}
      <div className="file-list-header">
        <div>Name</div>
        <div>Date Modified</div>
        <div>Type</div>
        <div>Size</div>
      </div>

      {/* Files list */}
      {files.length === 0 ? (
        <div className="file-list-empty">No files to display</div>
      ) : (
        files.map((file) => {
          const isSelected = selectedFiles.has(file.name);
          return (
            <div
              key={file.name}
              className={`file-item ${isSelected ? "selected" : ""}`}
              data-name={file.name}
              onClick={() => toggleSelectFile(file.name)}
            >
              <div>{file.name}</div>
              <div>{new Date(file.modified).toLocaleDateString()}</div>
              <div>{file.isDirectory ? "Folder" : "File"}</div>
              <div>{file.size.toLocaleString()} bytes</div>
            </div>
          );
        })
      )}
    </div>
  );
}
