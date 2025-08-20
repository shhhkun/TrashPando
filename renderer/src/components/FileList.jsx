import "../styles/FileList.css"; // CSS file for hover/selection
import "../utils/friendlyFileTypes"; // import friendly file types utility
import { getFriendlyFileType } from "../utils/friendlyFileTypes";
import { useMemo } from "react";

function formatFileSize(bytes) {
  if (bytes === 0) return "0 bytes";
  const units = ["bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(1)} ${units[i]}`;
}

function sortFiles(files, field, direction) {
  const multiplier = direction === "asc" ? 1 : -1;

  const compare = (a, b) => {
    // folders pinned to top
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;

    switch (field) {
      case "name":
        return a.name.localeCompare(b.name) * multiplier;

      case "size":
        if (a.isDirectory && b.isDirectory) {
          const aCount = (a.folderCount ?? 0) + (a.fileCount ?? 0);
          const bCount = (b.folderCount ?? 0) + (b.fileCount ?? 0);
          return (aCount - bCount) * multiplier;
        } else if (a.isDirectory || b.isDirectory) {
          return 0; // don’t mix folder vs file size
        }
        return (a.size - b.size) * multiplier;

      case "dateModified":
        return (new Date(a.modified) - new Date(b.modified)) * multiplier;

      case "dateCreated":
        return (new Date(a.created) - new Date(b.created)) * multiplier;

      case "type":
        return (a.type || "").localeCompare(b.type || "") * multiplier;

      case "itemCount":
        const aCount = (a.folderCount ?? 0) + (a.fileCount ?? 0);
        const bCount = (b.folderCount ?? 0) + (b.fileCount ?? 0);
        return (aCount - bCount) * multiplier;

      default:
        return 0;
    }
  };

  return [...files].sort(compare);
}

export default function FileList({
  files,
  selectedFiles,
  toggleSelectFile,
  listRef,
  onOpenFolder,
  sortField,
  sortOrder,
}) {
  
  const sortedFiles = useMemo(() => {
    return sortFiles(files, sortField, sortOrder);
  }, [files, sortField, sortOrder]);

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
      {sortedFiles.length === 0 ? (
        <div className="file-list-empty">No files to display</div>
      ) : (
        sortedFiles.map((file) => {
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
Type: ${getFriendlyFileType(file.type, file.isDirectory)}
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
                    : `${file.folderCount + file.fileCount} items`
                  : formatFileSize(file.size)}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  minWidth: 0,
                }}
              >
                <span className="type-text">
                  {getFriendlyFileType(file.type, file.isDirectory)}
                </span>
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
