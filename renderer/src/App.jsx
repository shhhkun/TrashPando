import { useState, useEffect } from "react";
import FileExplorer from "./components/FileExplorer";

const darkGrey = "rgb(34, 34, 34)";
const lightText = "rgba(230, 230, 230, 1)";

function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedGroup, setExpandedGroup] = useState("dashboard");
  const [commonFolders, setCommonFolders] = useState({});
  const [folderPath, setFolderPath] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({
    dashboard: true,
    fileExplorer: false,
  });

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
      <div
        style={{
          width: "250px",
          backgroundColor: "#222",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Dashboard Group */}
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
                  onClick={() =>
                    setActiveTab(item.toLowerCase().replace(/ /g, ""))
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* File Explorer */}
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
              {/* Optional: Custom Path button */}
              <button onClick={() => setActiveTab("files")}>
                Custom Path…
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Panel */}
      <div style={{ flex: 1, backgroundColor: "#333", padding: "20px" }}>
        <div className="h-14 border-b border-gray-800 flex items-center px-4">
          <h1 className="text-xl font-semibold capitalize">{activeTab}</h1>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {activeTab === "overview" && (
            <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
              <h2 className="font-semibold">Storage Overview</h2>
              <p className="text-sm text-gray-400">
                (placeholder for graphs + smart suggestions)
              </p>
            </div>
          )}
          {activeTab === "files" && (
            <FileExplorer
              folderPath={folderPath}
              setFolderPath={setFolderPath}
            />
          )}
          {activeTab === "apps" && (
            <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
              <h2 className="font-semibold">Installed Apps</h2>
              <p className="text-sm text-gray-400">
                (placeholder for app data)
              </p>
            </div>
          )}
          {activeTab === "settings" && (
            <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
              <h2 className="font-semibold">Settings</h2>
              <p className="text-sm text-gray-400">(theme, preferences)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
