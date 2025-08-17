import { useRef } from "react";
import FileSelector from "./FileSelector";
import FileList from "./FileList";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import Toast from "./Toast";

// const pandaGreen = "rgb(76, 175, 80)"; // fresh green border for selected
// const darkGrey = "rgb(34, 34, 34)"; // main bg color (dark grey)
// const hoverDarkGrey = "rgb(54, 54, 54)"; // hover bg color (lighter dark grey)
// const lightText = "rgba(230, 230, 230, 1)"; // text color (light)

export default function FileExplorer({
  folderPath,
  setFolderPath,
  pathSeparator,
  files,
  setFiles,
  selectedFiles,
  setSelectedFiles,
  showConfirm,
  setShowConfirm,
  toastMsg,
  setToastMsg,
  toastType,
  setFilesToDelete,
  handleSelectFolder,
  confirmDelete,
}) {
  const fileListRef = useRef(null);

  return (
    <div className="flex flex-col p-4 gap-4">
      {/* Select Folder and Delete Buttons */}
      <div className="flex gap-2">
        <button className="no-drag" onClick={handleSelectFolder}>
          Select Folder
        </button>

        <button
          className="no-drag"
          onClick={() => {
            setFilesToDelete(Array.from(selectedFiles));
            setShowConfirm(true);
          }}
          disabled={selectedFiles.size === 0}
        >
          Delete Selected
        </button>
      </div>

      {/* Folder Path Display */}
      <div className="italic">{folderPath || "No folder selected"}</div>

      {/* Folder Contents Render */}
      <div id="file-list-wrapper" className="flex-1 overflow-auto">
        <FileSelector
          containerRef={fileListRef}
          items={files}
          selectedIds={selectedFiles}
          render={(items, selectedIds) => (
            <FileList
              files={items}
              selectedFiles={selectedIds}
              toggleSelectFile={(fileName) => {
                const item = files.find((f) => f.name === fileName);
                if (!item || (item.isDirectory && !item.isEmptyFolder)) return;
              }}
              listRef={fileListRef}
              onOpenFolder={async (folderName) => {
                const newPath = folderPath.endsWith(pathSeparator)
                  ? `${folderPath}${folderName}`
                  : `${folderPath}${pathSeparator}${folderName}`;
                const scannedFiles = await window.electronAPI.scanFolder(
                  newPath
                );
                setFolderPath(newPath);
                setFiles(scannedFiles);
                setSelectedFiles(new Set());
              }}
            />
          )}
          onSelectionChange={(newSelection) =>
            setSelectedFiles(new Set(newSelection))
          }
        />
      </div>

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
