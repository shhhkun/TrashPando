import { useState, useEffect } from "react";
import {
  getAppIconFromCache,
  setAppIconInCache,
  invalidateAppIconCache,
} from "../cache";
import { Button } from "./ui/button";

const darkGrey = "rgb(34, 34, 34)";
const lightText = "rgba(230, 230, 230, 1)";

// app icon extractor (takes .exe, .ico)
function AppIcon({ exePath }) {
  const [icon, setIcon] = useState(() => getAppIconFromCache(exePath));

  useEffect(() => {
    if (!exePath || icon) return;

    let mounted = true;

    // check if already cached
    const cachedIcon = getAppIconFromCache(exePath);
    if (cachedIcon) {
      setIcon(cachedIcon);
      return; // no need to call main process
    }

    // otherwise, fetch from main
    window.electronAPI.getAppIcon(exePath).then((dataUrl) => {
      if (mounted && dataUrl) {
        setAppIconInCache(exePath, dataUrl); // store in cache
        setIcon(dataUrl);
      }
    });

    return () => {
      mounted = false;
    };
  }, [exePath, icon]);

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

function formatFromKB(kb) {
  if (kb == null) return "";
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  if (gb < 1024) return `${gb.toFixed(2)} GB`;
  const tb = gb / 1024;
  return `${tb.toFixed(2)} TB`;
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
    <div
      className="w-full h-full overflow-y-auto"
      style={{ backgroundColor: "#F1F1F1", padding: "16px", color: "#616161" }}
    >
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
            borderRadius: "18px",
            background: "#e0e0e0ff",
            color: "#616161",
          }}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: "6px 14px",
            border: "none",
            borderRadius: "18px",
            background: "#e0e0e0ff",
            color: "#616161",
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
            key={`${app.iconPath || app.name}-${idx}`}
            style={{
              background: "#e0e0e0ff",
              borderRadius: "18px",
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
              <span style={{ fontSize: "12px" }}>{formatFromKB(app.size)}</span>
            )}
            {app.installDate && (
              <span style={{ fontSize: "12px" }}>{app.installDate}</span>
            )}
            <Button
              variant="outline"
              onClick={() => uninstallApp(app)}
              style={{
                cursor: "pointer",
              }}
            >
              Uninstall
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
