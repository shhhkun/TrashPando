import { useState, useEffect } from "react";
import FileExplorer from "./components/FileExplorer";
import DashboardCard from "./components/DashboardCard";
import InstalledAppsCard from "./components/InstalledAppsCard";
import TrashySidebar from "./components/TrashySidebar"; // tsx

const darkGrey = "rgb(34, 34, 34)";
const lightText = "rgba(230, 230, 230, 1)";

function App() {
  const [activeTab, setActiveTab] = useState("apps");

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
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        backgroundColor: darkGrey,
        color: lightText,
      }}
    >
      {/* Sidebar */}
      <TrashySidebar
        activeSection={activeTab}
        setActiveSection={setActiveTab}
        folderPath={folderPath}
        setFolderPath={setFolderPath}
        commonFolders={commonFolders}
      />

      {/* <div
        style={{
          width: "250px",
          backgroundColor: "#222",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div>
          <button
            style={{
              width: "100%",
              textAlign: "left",
              padding: "8px",
              fontWeight: "bold",
              background: "none",
              border: "none",
              color: lightText,
              cursor: "pointer",
            }}
            onClick={() => toggleGroup("dashboard")}
          >
            Dashboard {expandedGroups.dashboard ? "▼" : "▶"}
          </button>
          {expandedGroups.dashboard && (
            <div
              style={{
                marginLeft: "10px",
                display: "flex",
                flexDirection: "column",
                paddingTop: "12px",
                gap: "4px",
              }}
            >
              {dashboardItems.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    if (item === "Installed Apps") {
                      setActiveTab("apps");
                    } else {
                      const folderKey = item.toLowerCase();
                      const folder = commonFolders[folderKey];
                      setActiveTab(folderKey);
                      if (folder) setFolderPath(folder); // force folderPath to update
                    }
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: "20px" }}>
          <button
            style={{
              width: "100%",
              textAlign: "left",
              padding: "8px",
              fontWeight: "bold",
              background: "none",
              border: "none",
              color: lightText,
              cursor: "pointer",
            }}
            onClick={() => toggleGroup("fileExplorer")}
          >
            File Explorer {expandedGroups.fileExplorer ? "▼" : "▶"}
          </button>
          {expandedGroups.fileExplorer && (
            <div
              style={{
                marginLeft: "10px",
                display: "flex",
                flexDirection: "column",
                paddingTop: "12px",
                gap: "4px",
              }}
            >
              {Object.entries(commonFolders).map(([name, path]) => (
                <button
                  key={name}
                  onClick={() => {
                    setFolderPath(path); // <-- sets the folderPath in App.jsx
                    setActiveTab("files"); // <-- switches main panel to FileExplorer
                  }}
                >
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </button>
              ))}
              <button onClick={() => setActiveTab("files")}>
                Custom Path…
              </button>
            </div>
          )}
        </div>
      </div> */}

      {/* Main Panel */}
      <div style={{ flex: 1, backgroundColor: "#333", padding: "20px" }}>
        <div className="h-14 border-b border-gray-800 flex items-center px-4"></div>
        <div
          className="flex-1 overflow-auto p-4"
          style={{ background: "#333" }}
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

          {/* {activeTab === "documents" && (
            <DashboardCard
              title="Documents"
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
          {activeTab === "pictures" && (
            <DashboardCard
              title="Pictures"
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
          {activeTab === "videos" && (
            <DashboardCard
              title="Videos"
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
          {activeTab === "music" && (
            <DashboardCard
              title="Music"
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
          )} */}
        </div>
      </div>
    </div>
  );
}

export default App;
