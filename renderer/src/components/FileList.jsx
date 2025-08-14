import "./FileList.css"; // CSS file for hover/selection

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
              <div>{file.name}</div>
              <div>{new Date(file.modified).toLocaleDateString()}</div>
              <div>{file.size.toLocaleString()} bytes</div>
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
