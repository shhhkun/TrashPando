import { useState, useEffect, useRef } from "react";
import FileSelector from "./FileSelector";
import FileList from "./FileList";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import Toast from "./Toast";

export default function DashboardCard({
  title,
  folderPath,
  setFolderPath,
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
  pathSeparator,
  confirmDelete,
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalSize, setTotalSize] = useState(null);
  const cardFileListRef = useRef(null);

  // compute recursive size when folderPath changes
  useEffect(() => {
    if (!folderPath) return;

    let isMounted = true;
    const fetchRecursiveSize = async () => {
      try {
        setLoading(true);
        const result = await window.electronAPI.scanRecursive(folderPath);
        if (!isMounted) return;
        setTotalSize(result.size);
      } catch (err) {
        console.error("Error scanning size:", err);
        setToastMsg(`Error loading ${title}`);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecursiveSize();
    return () => {
      isMounted = false;
    };
  }, [folderPath]);

  // shallow scan when uncollapsed
  useEffect(() => {
    if (!expanded || !folderPath) return;

    async function fetchFolderContents() {
      try {
        setLoading(true);
        const scannedFiles = await window.electronAPI.scanFolder(folderPath);
        setFiles(scannedFiles);
        setSelectedFiles(new Set());
      } catch (err) {
        console.error("Error scanning folder:", err);
        setToastMsg(`Error loading ${title}`);
      } finally {
        setLoading(false);
      }
    }

    fetchFolderContents();
  }, [expanded, folderPath]);

  const handleToggleExpand = () => setExpanded((prev) => !prev);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col gap-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button onClick={handleToggleExpand}>
          {expanded ? "Collapse" : "View"}
        </button>
      </div>

      {/* Total Size */}
      <div className="text-sm text-gray-400">
        {loading
          ? "Calculating..."
          : totalSize !== null
          ? `${(totalSize / 1e9).toFixed(2)} GB`
          : "-"}
      </div>

      {/* FileList */}
      {expanded && !loading && (
        <div
          className="flex-1 overflow-auto mt-2"
          style={{ maxHeight: "300px" }}
        >
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

          <FileSelector
            containerRef={cardFileListRef}
            items={files}
            selectedIds={selectedFiles}
            render={(items, selectedIds) => (
              <FileList
                files={items}
                selectedFiles={selectedIds}
                toggleSelectFile={(fileName) => {
                  const item = files.find((f) => f.name === fileName);
                  if (!item || (item.isDirectory && !item.isEmptyFolder))
                    return;
                }}
                listRef={cardFileListRef}
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
      )}

      {/* Delete Modal */}
      <ConfirmDeleteModal
        visible={showConfirm}
        count={selectedFiles.size}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />

      {/* Toast */}
      <Toast
        message={toastMsg}
        type={toastType}
        onClose={() => setToastMsg(null)}
      />
    </div>
  );
}
