import { useState, useEffect, useRef } from "react";
import FileSelector from "./FileSelector";
import FileList from "./FileList";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import Toast from "./Toast";
import { getFromCache, setInCache, invalidateCache } from "../cache";
import { Button } from "./ui/button";

const primary = "#2B2B2B";
const secondary = "#4A4A4A";

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
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [visibleSize, setVisibleSize] = useState(null);
  const [hiddenSize, setHiddenSize] = useState(null);
  const cardFileListRef = useRef(null);

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
    <div
      className="w-full h-full p-4 flex flex-col gap-2"
      style={{
        backgroundColor: "#F1F1F1",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2
          className="font-semibold px-6"
          style={{
            color: "#2B2B2B",
            fontSize: "1.5rem"
          }}
        >
          {title}
        </h2>
      </div>

      <div className="flex px-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleExpand}
        >
          {expanded ? "Collapse" : "View"}
        </Button>
      </div>

      {/* Total Size */}
      <div
        className="text-sm px-6"
        style={{
          color: "#4A4A4A",
        }}
      >
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
        <div className="flex-1 mt-2 px-6">
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
                setFilesToDelete={setFilesToDelete}
                setShowConfirm={setShowConfirm}
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
