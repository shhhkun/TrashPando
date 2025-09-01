import React, { useState } from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  User,
  HardDrive,
  FileText,
  Image,
  Video,
  Music,
  Download,
  Monitor,
  Plus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

interface TrashySidebarProps {
  activeItem: string | null;
  setActiveItem: (item: string | null) => void;
  folderPath: string;
  setFolderPath: (path: string) => void;
  commonFolders: Record<string, string>;
}

const TrashySidebar: React.FC<TrashySidebarProps> = ({
  activeItem,
  setActiveItem,
  folderPath,
  setFolderPath,
  commonFolders,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    dashboard: true,
    explorer: true,
  });
  const [activePanel, setActivePanel] = useState("dashboard");

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const navigationItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "explorer", icon: FolderOpen, label: "File Explorer" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const dashboardItems = [
    { icon: HardDrive, label: "Installed Apps" },
    { icon: FileText, label: "Documents" },
    { icon: Image, label: "Pictures" },
    { icon: Video, label: "Videos" },
    { icon: Music, label: "Music" },
  ];

  const explorerItems = [
    { icon: FileText, label: "Documents" },
    { icon: Download, label: "Downloads" },
    { icon: Image, label: "Pictures" },
    { icon: Monitor, label: "Desktop" },
    { icon: Music, label: "Music" },
    { icon: Video, label: "Videos" },
    { icon: Plus, label: "Custom Path...", isCustom: true },
  ];

  const renderContent = () => {
    switch (activePanel) {
      case "dashboard":
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3 py-2">
              <h3 className="text-sm font-medium" style={{ color: "#F1F1F1" }}>
                Quick Access
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection("dashboard")}
                className="h-5 w-5 p-0"
                style={{ color: "#F1F1F1", opacity: "0.7" }}
              >
                {expandedSections.dashboard ? (
                  <ChevronDown size={12} />
                ) : (
                  <ChevronRight size={12} />
                )}
              </Button>
            </div>
            {expandedSections.dashboard && (
              <div className="space-y-1">
                {dashboardItems.map((item, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start gap-3 px-3 py-2 h-auto transition-all duration-200"
                    style={{ color: "#F1F1F1" }}
                    onClick={() => {
                      if (item.label === "Installed Apps") {
                        setActiveItem("apps");
                      } else {
                        const folderKey = item.label.toLowerCase();
                        const folder = commonFolders[folderKey];
                        setActiveItem(folderKey);
                        if (folder) setFolderPath(folder);
                      }
                    }}
                  >
                    <item.icon
                      size={16}
                      style={{ color: "#F1F1F1", opacity: "0.7" }}
                    />
                    <span className="text-sm">{item.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        );

      case "explorer":
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3 py-2">
              <h3 className="text-sm font-medium" style={{ color: "#F1F1F1" }}>
                File Browser
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection("explorer")}
                className="h-5 w-5 p-0"
                style={{ color: "#F1F1F1", opacity: "0.7" }}
              >
                {expandedSections.explorer ? (
                  <ChevronDown size={12} />
                ) : (
                  <ChevronRight size={12} />
                )}
              </Button>
            </div>
            {expandedSections.explorer && (
              <div className="space-y-1">
                {explorerItems.map((item, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className={`w-full justify-start gap-3 px-3 py-2 h-auto transition-all duration-200 ${
                      item.isCustom ? "mt-2" : ""
                    }`}
                    style={{
                      color: "#F1F1F1",
                      border: item.isCustom
                        ? "1px dashed rgba(241, 241, 241, 0.3)"
                        : "none",
                    }}
                    onClick={() => {
                      if (item.isCustom) {
                        setActiveItem("files");
                      } else {
                        const folderKey = item.label.toLowerCase();
                        const folder = commonFolders[folderKey];
                        if (folder) setFolderPath(folder);
                        setActiveItem("files");
                      }
                    }}
                  >
                    <item.icon
                      size={16}
                      style={{
                        color: item.isCustom ? "#A7C957" : "#F1F1F1",
                        opacity: item.isCustom ? "1" : "0.7",
                      }}
                    />
                    <span className="text-sm">{item.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        );

      case "settings":
        return (
          <div className="space-y-4 px-3">
            <h3 className="text-sm font-medium" style={{ color: "#F1F1F1" }}>
              Settings
            </h3>
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-3 py-2 h-auto transition-all duration-200"
                style={{ color: "#F1F1F1" }}
              >
                <Settings
                  size={16}
                  style={{ color: "#F1F1F1", opacity: "0.7" }}
                />
                <span className="text-sm">General</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-3 py-2 h-auto transition-all duration-200"
                style={{ color: "#F1F1F1" }}
              >
                <Monitor
                  size={16}
                  style={{ color: "#F1F1F1", opacity: "0.7" }}
                />
                <span className="text-sm">Display</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-3 py-2 h-auto transition-all duration-200"
                style={{ color: "#F1F1F1" }}
              >
                <HardDrive
                  size={16}
                  style={{ color: "#F1F1F1", opacity: "0.7" }}
                />
                <span className="text-sm">Storage</span>
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: "#2B2B2B" }}>
      {/* Left Icon Panel */}
      <div
        className="w-16 flex flex-col items-center"
        style={{
          backgroundColor: "#4A4A4A",
          borderRight: "1px solid rgba(241, 241, 241, 0.15)",
          paddingTop: "16px",
          paddingBottom: "16px",
        }}
      >
        {/* Logo/Mascot Area */}
        <div className="mb-6 flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
            style={{ backgroundColor: "#3A5F3B" }}
          >
            <span className="text-lg" style={{ color: "#F1F1F1" }}>
              🦝
            </span>
          </div>
        </div>

        <Separator
          className="w-8 mb-4"
          style={{ backgroundColor: "rgba(241, 241, 241, 0.1)" }}
        />

        {/* Navigation Icons */}
        <div className="space-y-3 flex-1 flex flex-col items-center">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => setActivePanel(item.id)}
              className={`w-10 h-10 p-0 rounded-lg transition-all duration-200 ${
                activePanel === item.id ? "shadow-md" : "hover:shadow-sm"
              }`}
              style={{
                backgroundColor:
                  activePanel === item.id ? "#3A5F3B" : "transparent",
                color: "#F1F1F1",
              }}
              title={item.label}
            >
              <item.icon size={18} />
            </Button>
          ))}
        </div>

        {/* User Icon at Bottom */}
        <div className="mt-auto flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0 rounded-lg transition-all duration-200"
            style={{ color: "#F1F1F1" }}
            title="User Profile"
          >
            <User size={18} />
          </Button>
        </div>
      </div>

      {/* Right Content Panel */}
      <div
        className="w-80"
        style={{
          backgroundColor: "#4A4A4A",
          borderRight: "1px solid rgba(241, 241, 241, 0.15)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid rgba(241, 241, 241, 0.1)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ backgroundColor: "#3A5F3B" }}
            >
              {navigationItems.find((item) => item.id === activePanel)?.icon &&
                React.createElement(
                  navigationItems.find((item) => item.id === activePanel)!.icon,
                  { size: 16, style: { color: "#F1F1F1" } }
                )}
            </div>
            <div>
              <h2
                className="text-lg font-medium capitalize"
                style={{ color: "#F1F1F1" }}
              >
                {activePanel}
              </h2>

              <p className="text-xs opacity-70" style={{ color: "#F1F1F1" }}>
                {activePanel === "dashboard" &&
                  "Quick access to common locations"}
                {activePanel === "explorer" && "Browse and manage your files"}
                {activePanel === "settings" && "Configure Trashu preferences"}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div style={{ padding: "16px" }}>{renderContent()}</div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default TrashySidebar;
