import { useState, useEffect } from "react";

const darkGrey = "rgb(34, 34, 34)";
const lightText = "rgba(230, 230, 230, 1)";

// app icon extractor (takes .exe, .ico)
function AppIcon({ exePath }) {
  const [icon, setIcon] = useState(null);

  useEffect(() => {
    let mounted = true;
    window.electronAPI.getAppIcon(exePath).then((dataUrl) => {
      if (mounted && dataUrl) setIcon(dataUrl);
    });
    return () => {
      mounted = false;
    };
  }, [exePath]);

  return icon ? (
    <img src={icon} alt="icon" style={{ width: 48, height: 48 }} />
  ) : (
    <div
      style={{ width: 48, height: 48, textAlign: "center", lineHeight: "48px" }}
    >
      🗂️
    </div>
  );
}

export default function InstalledAppsCard() {
  const [apps, setApps] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    let mounted = true;

    async function loadApps() {
      try {
        const appsArray = await window.electronAPI.scanInstalledAppsRegistry();
        if (!mounted) return;
        setApps(appsArray);
      } catch (err) {
        console.error("Failed to scan apps:", err);
      }
    }

    loadApps();

    return () => {
      mounted = false;
    };
  }, []);

  // filter + Sort
  const displayedApps = apps
    .filter((app) => app.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "size") return (b.size || 0) - (a.size || 0);
      if (sortBy === "installDate")
        return (b.installDate || 0) - (a.installDate || 0);
      return 0;
    });

  const uninstallApp = (app) => {
    console.log("Uninstall:", app.name, app.uninstallString);
    // implement uninstall ipc handler later
  };

  return (
    <div style={{ padding: "16px", color: lightText }}>
      {/* Controls */}
      <div style={{ marginBottom: "12px", display: "flex", gap: "12px" }}>
        <input
          type="text"
          placeholder="Search apps..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: "6px 10px",
            border: "none",
            background: darkGrey,
            color: lightText,
          }}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: "6px 14px",
            border: "none",
            background: darkGrey,
            color: lightText,
          }}
        >
          <option value="name">Name</option>
          <option value="size">Size</option>
          <option value="installDate">Install Date</option>
        </select>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "12px",
        }}
      >
        {displayedApps.map((app, idx) => (
          <div
            key={idx}
            style={{
              background: darkGrey,
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              minHeight: "120px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                marginBottom: "8px",
                fontSize: "32px",
                lineHeight: "48px",
              }}
            >
              {app.iconPath ? <AppIcon exePath={app.iconPath} /> : "🗂️"}
            </div>
            <span style={{ fontWeight: "bold" }}>{app.name}</span>
            {app.size && (
              <span style={{ fontSize: "12px" }}>
                {(app.size / 1024 / 1024).toFixed(2)} MB
              </span>
            )}
            {app.installDate && (
              <span style={{ fontSize: "12px" }}>{app.installDate}</span>
            )}
            <button
              onClick={() => uninstallApp(app)}
              style={{
                marginTop: "8px",
                padding: "4px 8px",
                fontSize: "12px",
                border: "none",
                background: "rgba(49, 49, 49, 1)",
                color: lightText,
                cursor: "pointer",
              }}
            >
              Uninstall
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
