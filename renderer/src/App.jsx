import { useState, useEffect } from "react";
import FileExplorer from "./components/FileExplorer";
import DashboardCard from "./components/DashboardCard";
import InstalledAppsCard from "./components/InstalledAppsCard";
import TrashySidebar from "./components/TrashySidebar"; // tsx
import { Badge } from "./components/ui/badge";

const darkGrey = "rgb(34, 34, 34)";
const lightText = "rgba(230, 230, 230, 1)";

function App() {
  const [activeTab, setActiveTab] = useState("home");

  const [expandedGroups, setExpandedGroups] = useState({
    dashboard: true,
    fileExplorer: false,
  });

  const [folderPath, setFolderPath] = useState(null);
  const [pathSeparator, setPathSeparator] = useState("/");
  const [commonFolders, setCommonFolders] = useState({});

  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());

  const [showConfirm, setShowConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [toastType, setToastType] = useState("info");
  const [filesToDelete, setFilesToDelete] = useState([]);

  const dashboardItems = [
    "Installed Apps",
    "Documents",
    "Pictures",
    "Videos",
    "Music",
  ];

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName], // toggle only the clicked group
    }));
  };

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
        backgroundColor: darkGrey,
        color: lightText,
      }}
    >
      {/* Sidebar */}
      <TrashySidebar
        activeItem={activeTab}
        setActiveItem={setActiveTab}
        folderPath={folderPath}
        setFolderPath={setFolderPath}
        commonFolders={commonFolders}
      />

      {/* Main Panel */}
      {/* Home Screen */}
      {activeTab === "home" && (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: "#F1F1F1" }}
        >
          <div className="text-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
              style={{ backgroundColor: "#3A5F3B" }}
            >
              <span className="text-4xl">🦝</span>
            </div>
            <h3
              className="text-xl font-medium mb-2"
              style={{ color: "#2B2B2B" }}
            >
              Welcome to Trashu
            </h3>
            <p className="mb-6 opacity-80" style={{ color: "#4A4A4A" }}>
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

      <div
        className="w-full flex-1 overflow-auto"
        style={{ flex: 1, backgroundColor: "#333", padding: "20px" }}
      >
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
    </div>
  );
}

export default App;
