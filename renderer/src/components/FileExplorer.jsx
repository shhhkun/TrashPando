import { useRef } from "react";
import FileSelector from "./FileSelector";
import FileList from "./FileList";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import Toast from "./Toast";
import { Button } from "./ui/button";

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
    <div
      className="w-full h-full p-4 flex flex-col gap-4"
      style={{
        backgroundColor: "#F1F1F1",
      }}
    >
      <div className="flex gap-2">
        {/* Select Folder Button */}
        <Button
          variant="outline"
          className="no-drag"
          onClick={handleSelectFolder}
        >
          Select Folder
        </Button>

        {/* Duplicate Scanner Test */}
        <Button
          variant="outline"
          className="no-drag"
          onClick={async () => {
            if (!folderPath) return;

            try {
              console.log("Scanning for duplicates in: ", folderPath);
              const duplicates = await window.electronAPI.findDuplicates(
                folderPath,
                {
                  matchExtension: true,
                }
              );

              // format output
              let output = "";
              duplicates.forEach((group, index) => {
                output += `Group ${index + 1}:\n`;
                group.forEach((file) => {
                  output += `  ${file.path}\n`;
                });
                output += "\n";
              });

              const outputFilePath = await window.electronAPI.writeFile(
                "output.txt",
                output
              );
              console.log("Duplicate scan results written to:", outputFilePath);
            } catch (err) {
              console.error("Duplicate scan error:", err);
            }
          }}
        >
          Test Duplicate Scan
        </Button>

        {/* Registry Scanner Test */}
        <Button
          variant="outline"
          className="no-drag"
          onClick={async () => {
            try {
              console.log("Scanning installed apps (registry)...");
              const apps = await window.electronAPI.scanInstalledAppsRegistry();

              // Sort apps A → Z by display name
              apps.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

              let output = "Installed Apps (Registry):\n\n";

              apps.forEach((app, index) => {
                output += `${index + 1}. ${app.name || "Unknown"}\n`;
                if (app.uninstallString)
                  output += `   Uninstall: ${app.uninstallString}\n`;
                if (app.size)
                  output += `   Size: ${(app.size / 1024).toFixed(2)} KB\n`;
                if (app.iconPath) output += `   Icon: ${app.iconPath}\n`;
                if (app.publisher) output += `   Publisher: ${app.publisher}\n`;
                if (app.version) output += `   Version: ${app.version}\n`;
                output += "\n";
              });

              const outputFilePath = await window.electronAPI.writeFile(
                "output2.txt",
                output
              );
              console.log("Registry scan results written to:", outputFilePath);
            } catch (err) {
              console.error("Registry scan error:", err);
            }
          }}
        >
          Test Registry Installed Scan
        </Button>
      </div>

      {/* Folder Path Display */}
      <div style={{ color: "#2b2b2b" }}>
        {folderPath || "No folder selected"}
      </div>

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
              setFilesToDelete={setFilesToDelete}
              setShowConfirm={setShowConfirm}
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
