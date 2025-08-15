import "./FileList.css"; // CSS file for hover/selection

function formatFileSize(bytes) {
  if (bytes === 0) return "0 bytes";
  const units = ["bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(1)} ${units[i]}`;
}

export default function FileList({
  files,
  selectedFiles,
  toggleSelectFile,
  listRef,
  onOpenFolder,
}) {
  return (
    <div ref={listRef} className="file-list-container">
      {/* Header bar with vertical separators */}
      <div className="file-list-header">
        <div>Name</div>
        <div>Date Modified</div>
        <div>Size</div>
        <div>Type</div>
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
              className={`file-item ${isSelected ? "selected" : ""} ${
                file.isDirectory && !file.isEmptyFolder ? "disabled" : ""
              }`}
              data-id={file.name}
              data-name={file.name}
              data-selectable
              onClick={() => {
                if (!(file.isDirectory && !file.isEmptyFolder)) {
                  toggleSelectFile(file.name);
                }
              }}
            >
              <div
                title={
                  file.isDirectory
                    ? `Created: ${new Date(file.created).toLocaleString()}
Folders: ${file.folderCount}
Files: ${file.fileCount}`
                    : `Name: ${file.name}
Type: ${file.type}
Size: ${formatFileSize(file.size)}
Modified: ${new Date(file.modified).toLocaleString()}`
                }
              >
                {file.name}
              </div>

              <div>{new Date(file.modified).toLocaleDateString()}</div>

              <div>
                {file.isDirectory
                  ? file.isEmptyFolder
                    ? "Empty"
                    : `${file.itemsCount} items`
                  : formatFileSize(file.size)}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{file.isDirectory ? "Folder" : "File"}</span>
                {file.isDirectory && (
                  <span
                    className="open-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenFolder(file.name);
                    }}
                  >
                    [Open]
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
