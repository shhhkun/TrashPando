import { useState, useEffect, useRef } from "react";
import FileSelector from "./FileSelector";
import FileList from "./FileList";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import Toast from "./Toast";
import { getFromCache, setInCache, invalidateCache } from "../cache";
import { Button } from "./ui/button";

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
  const [visibleSize, setVisibleSize] = useState(null);
  const [hiddenSize, setHiddenSize] = useState(null);
  const cardFileListRef = useRef(null);

  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const sortOptions = [
    { label: "Name", value: "name" },
    { label: "Date Modified", value: "dateModified" },
    { label: "Date Created", value: "dateCreated" },
    { label: "Size", value: "size" },
    { label: "Type", value: "type" },
    { label: "Item Count", value: "itemCount" },
  ];

  useEffect(() => {
    if (!folderPath) return;

    const listener = window.electronAPI.onFolderChanged(
      ({ folderPath: changedPath }) => {
        if (changedPath === folderPath) {
          invalidateCache(folderPath);
        }
      }
    );

    return () => {
      window.electronAPI.offFolderChanged(listener);
    };
  }, [folderPath]);

  // compute recursive size when folderPath changes
  useEffect(() => {
    if (!folderPath) return;

    let isMounted = true;

    const fetchRecursiveSize = async () => {
      try {
        setLoading(true);

        const cached = getFromCache(folderPath);
        if (cached) {
          setVisibleSize(cached.visibleSize);
          setHiddenSize(cached.hiddenSize);
          //setFiles(cached.files || []);
        } else {
          const result = await window.electronAPI.scanRecursive(folderPath);
          if (!isMounted) return;

          setVisibleSize(result.visibleSize);
          setHiddenSize(result.hiddenSize);
          setInCache(folderPath, {
            //files: result.items,
            visibleSize: result.visibleSize,
            hiddenSize: result.hiddenSize,
          });

          // start watcher after initial scan
          window.electronAPI.watchFolder(folderPath);
        }
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
    <div className="bg-gray-900 p-4 flex flex-col gap-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button variant="secondary" size="sm" onClick={handleToggleExpand}>
          {expanded ? "Collapse" : "View"}
        </Button>
      </div>

      {/* Total Size */}
      <div className="text-sm text-gray-400">
        {loading
          ? "Calculating..."
          : visibleSize !== null
          ? `${(visibleSize / 1e9).toFixed(2)} GB / ${
              hiddenSize / 1e3
            } KB (hidden/system)`
          : "-"}
      </div>

      {/* FileList */}
      {expanded && !loading && (
        <div
          className="flex-1 overflow-auto mt-2"
        >
          <Button
            variant="destructive"
            size="sm"
            className="no-drag"
            onClick={() => {
              setFilesToDelete(Array.from(selectedFiles));
              setShowConfirm(true);
            }}
            disabled={selectedFiles.size === 0}
          >
            Delete Selected
          </Button>

          {/* Sort Dropdown */}
          <select
            className="no-drag border rounded px-3 py-1 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFolderPath(folderPath)}
          >
            Refresh Size
          </Button>

          {/* Ascending/Descending Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="no-drag"
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
          >
            {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
          </Button>

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
                sortField={sortField}
                sortOrder={sortOrder}
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
