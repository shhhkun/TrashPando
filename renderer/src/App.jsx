import { useState, useEffect } from "react";
import FileExplorer from "./components/FileExplorer";
import DashboardCard from "./components/DashboardCard";
import InstalledAppsCard from "./components/InstalledAppsCard";
import TrashySidebar from "./components/TrashySidebar"; // tsx
import { Badge } from "./components/ui/badge";
import logo from "./assets/trashulogo2.png"; // logo image

function DiskUsageDiv() {
  const [diskUsage, setDiskUsage] = useState({ used: 0, total: 0 });

  useEffect(() => {
    // check for the electronAPI before calling to prevent errors
    if (window.electronAPI && window.electronAPI.getDiskUsage) {
      window.electronAPI.getDiskUsage().then((result) => {
        setDiskUsage(result);
      }).catch(error => {
        console.error("Failed to get disk usage:", error);
      });
    }
  }, []);

  return diskUsage;
}

function App() {
  const [activeTab, setActiveTab] = useState("documents"); // default: home

  const [folderPath, setFolderPath] = useState(null);
  const [pathSeparator, setPathSeparator] = useState("/");
  const [commonFolders, setCommonFolders] = useState({});

  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());

  const [showConfirm, setShowConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [toastType, setToastType] = useState("info");
  const [filesToDelete, setFilesToDelete] = useState([]);

  const { used, total } = DiskUsageDiv();

  // fetch common folders dynamically
  useEffect(() => {
    async function fetchCommonFolders() {
      const folders = await window.electronAPI.getCommonFolders();
      setCommonFolders(folders);
    }
    fetchCommonFolders();
  }, []);

  useEffect(() => {
    // fetch path separator for OS
    async function fetchSeparator() {
      const sep = await window.electronAPI.getPathSeparator();
      setPathSeparator(sep);
    }
    fetchSeparator();
  }, []);

  useEffect(() => {
    // fetch common folders
    async function fetchCommonFolders() {
      const folders = await window.electronAPI.getCommonFolders();
      setCommonFolders(folders);
    }
    fetchCommonFolders();
  }, []);

  // scan folder whenever folderPath changes
  useEffect(() => {
    if (!folderPath) return;
    async function scan() {
      const scannedFiles = await window.electronAPI.scanFolder(folderPath);
      setFiles(scannedFiles);
      setSelectedFiles(new Set());
    }
    scan();
  }, [folderPath]);

  async function handleSelectFolder() {
    const path = await window.electronAPI.selectFolder();
    setFolderPath(path);
    if (path) {
      const scannedFiles = await window.electronAPI.scanFolder(path);
      setFiles(scannedFiles);
      setSelectedFiles(new Set());
    } else {
      setFiles([]);
      setSelectedFiles(new Set());
    }
  }

  async function confirmDelete() {
    setShowConfirm(false);

    const filteredToDelete = filesToDelete.filter((fileName) => {
      const file = files.find((f) => f.name === fileName);
      return !(file.isDirectory && file.isEmptyFolder === false);
    });

    if (filteredToDelete.length === 0) {
      setToastMsg("No deletable files selected.");
      setToastType("info");
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }

    const pathsToDelete = filesToDelete.map((name) =>
      folderPath.endsWith(pathSeparator)
        ? `${folderPath}${name}`
        : `${folderPath}${pathSeparator}${name}`
    );

    try {
      const result = await window.electronAPI.deleteFiles(pathsToDelete);

      if (result.success) {
        const deletedCount = filesToDelete.length;
        setToastMsg(
          `Deleted ${deletedCount} file${deletedCount > 1 ? "s" : ""}`
        );
        setToastType("info");
        setFiles((prev) => prev.filter((f) => !filesToDelete.includes(f.name)));
        setSelectedFiles(new Set());
      } else {
        setToastMsg(`Error deleting files: ${result.error}`);
        setToastType("error");
      }
    } catch (err) {
      setToastMsg(`Unexpected error: ${err.message}`);
      setToastType("error");
    }

    setTimeout(() => setToastMsg(null), 3000);
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        height: "100vh",
        width: "100vw",
      }}
    >
      {/* Sidebar */}
      <TrashySidebar
        setActiveItem={setActiveTab}
        setFolderPath={setFolderPath}
        commonFolders={commonFolders}
        used={used}
        total={total}
      />

      {/* Home Screen */}
      {activeTab === "home" && (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: "#F1F1F1" }}
        >
          <div className="text-center">
            {/* Updated Logo Integration */}
            <img
              src={logo}
              alt="Trashu Logo"
              className="mx-auto"
              style={{
                width: "128px", // Corresponds to w-24
                height: "128px", // Corresponds to h-24
              }}
            />

            <h3
              className="text-xl font-medium mb-2"
              style={{ color: "#2B2B2B" }} // primary font clr
            >
              Welcome to Trashu
            </h3>
            <p
              className="mb-6 opacity-80"
              style={{ color: "#4A4A4A" }} // secondary font clr
            >
              Your friendly storage manager
            </p>
            <Badge
              variant="secondary"
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor: "#A7C957",
                color: "#2B2B2B",
                fontSize: "12px",
              }}
            >
              🐾 Trash Panda Mode Active
            </Badge>
            <div
              className="mt-8 p-6 rounded-lg shadow-sm"
              style={{
                backgroundColor: "#4A4A4A",
                maxWidth: "400px",
                border: "1px solid rgba(241, 241, 241, 0.1)",
              }}
            >
              <p className="text-sm" style={{ color: "#F1F1F1" }}>
                Select a section from the sidebar to get started with managing
                your files and storage.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Other Main Panels */}
      {activeTab === "files" && (
        <FileExplorer
          // navigation props
          folderPath={folderPath}
          setFolderPath={setFolderPath}
          pathSeparator={pathSeparator}
          // files
          files={files}
          setFiles={setFiles}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          // popups/prompts
          showConfirm={showConfirm}
          setShowConfirm={setShowConfirm}
          toastMsg={toastMsg}
          setToastMsg={setToastMsg}
          toastType={toastType}
          // actions
          setFilesToDelete={setFilesToDelete}
          handleSelectFolder={handleSelectFolder}
          confirmDelete={confirmDelete}
        />
      )}

      {activeTab === "apps" && <InstalledAppsCard />}

      {["documents", "pictures", "videos", "music"].includes(activeTab) && (
        <DashboardCard
          title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          folderPath={folderPath}
          setFolderPath={setFolderPath}
          files={files}
          setFiles={setFiles}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          showConfirm={showConfirm}
          setShowConfirm={setShowConfirm}
          toastMsg={toastMsg}
          setToastMsg={setToastMsg}
          toastType={toastType}
          setFilesToDelete={setFilesToDelete}
          pathSeparator={pathSeparator}
          confirmDelete={confirmDelete}
        />
      )}
    </div>
  );
}

export default App;
