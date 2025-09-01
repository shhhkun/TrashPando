# Trashu — A Smart Desktop Storage Manager

## Overview

Trashu is a desktop application designed to help users efficiently manage their storage. Built with Electron, it scans folders for duplicate, unused, and large files, providing clear insights and safe cleanup options. Trashu aims to go beyond basic file deletion by introducing smart metrics—such as last access time and usage frequency—to deliver personalized recommendations for organizing photos, games, documents, and more.

_Built with: Electron, Node.js, React, Vite, JavaScript, TypeScript, Tailwind CSS, Figma_

---

## Screenshots

_Screenshots coming soon_

---

## Features

- Select folders to scan for duplicate files
- Display file metadata such as size and last modified date
- Basic duplicate detection based on file size and hashing (MD5/SHA256)
- User-friendly interface to review and delete files safely
- Smart recommendations based on file usage

---

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher recommended)
- npm (comes with Node.js)

Clone the repo:

```bash
git clone https://github.com/yourusername/Trashu.git
```

Navigate into the folder:

```bash
cd Trashu
```

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm start
```

## Usage

_Detailed instructions coming as features are implemented_

---

## Development Log

### **v0.1 – Initial Setup**

- Electron app initialized with a window and basic UI
- Folder selection implemented
- Display selected folder path
- Show the folder paths included files as well as their metadata (filename, size, filetype)

### **v1.0 - Navigation, Manipulation, & Selection**

- Added file selection & deletion
- Supports multi-file selection, delete confirmation modal, and toast popup messages for number of files removed
- Implemented drag and select for multiple file selection
  - 'Ctrl +' shortcut for appending selections together
  - Dynamic select/unselect logic based on drag selection box
- Load/scan common folders as quick navigations

### **v1.1 - Sidebar Nav & Simple Metrics Scanning**

- Updated layout to have a sidebar with primary Dashboard and File Explorer dropdowns
- Dashboard:
  - Will include installed apps, documents, other, etc.
  - Central area for storage management
- File Explorer:
  - More free-use file/folder navigator for precise deletion
- Basic metrics (suggestion/sort by) based on:
  - Folder contents (empty/non-empty)
  - File size
  - Modified/created dates
  - Duplicate files
- Moved recursive folder scanning on workers threads
- Adjusted file scanning to avoid sensitive system files (winattr for Windows, "." prefix for UNIX/Linux/macOS)

### **v1.2 - ???**

- UI Overhaul
  - Used Figma to test out layout & color palettes
  - Creating app specific icon/logo
- Optimize OS scanning
  - Check worker thread compatibility
  - Improve caching/fetching
  - Move cache to lightweight database (SQLite)

### **v?.? - Later Development**

- Advanced metrics?
  - Screentime/usage time to be incorporated into suggestion logic
  - Perhaps fetch info from other OS apps such as Task Manager
- More file select shortcuts/optimizations:
  - Shift + click range selection
  - Dynamic selection box whilst scrolling & autoscroll

---

## Roadmap

- [x] Implement basic file scanning and metadata collection
- [ ] File previews and sorting/filtering options
- [ ] Undo button for last delete action/safety net
  - Trashing/recycling (depends on OS) items rather than permanent delete currently
  - Will later make it togglable in settings for power users
- [ ] Duplicate detection & improve metadata collection
- [ ] Smart metrics integration (last access time, usage frequency)

- [ ] Panda themed UI overhaul:
  - Using Figma to create/test/plan out UI for:
    - Sidebar panel
    - Main content panels
    - App specific logos
    - Inclusion of future menus (settings, user profile, etc.)

- [ ] Dashboard Implementation:

  - Documents/Pictures/Videos/Music
    - Recursive scan of user directories (on worker threads)
    - Sum total size (GB) of each category
    - Display sum, and have option to view FileList

  - Other
    - Separate category from apps, docs, music, temp, etc.
    - Perform recursive scan at C:\Users\User (or different based on OS)
    - Display sum, and option to view FileList

  - Installed Apps (Windows First)
    - First detect and find desired apps with their sizes, and display in dashboard (with their respective icons)
    - Later/After, add uninstall feature thats gated behind admin prompts
    - Check common folders:
      - Program Files
      - Program Files (x86)
      - Local Disk (C:)
    - Recursively scan folders for actual app/game .exe which often contains:
      - Proper name
      - Version info
      - Game icon
      - Date modified/other
    - Heuristically Filter while recursing folders
      - Watch out for basenames, folder names, small folder sizes
    - Search containing folder (or broader install root)
      - Leads to finding total/containg folder (app size)
      - Leads to finding for nearby uninstallers (.exe)
    - Obtaining registry keys
      - Optional, but would still require heuristic filtering to avoid getting unwanted .exe's

- [ ] Caching:

  - Avoid rescanning folders for file/folder size or other metrics if no changes are made on initial load
  - Watch for folder changes with fs.watch

- [ ] Database:

  - Could use SQLite
  - Introduce a App Activity Tracker/Usage Insights?
  - Allow user to begin tracking apps of their choosing, helpful for understanding workflow or play habits

---

## Known Issues

- [ ] Path separator fetching is a bit unoptimized, check/look into preload.js loading properly as to use electronAPI calls rather than state & useEffect
- [ ] Common folders scan is somewhat restricted/limited by how its defined in main.js, possibly allow user to add their own preference of common folders
- [ ] File selecting whilst scrolling
  - Not using React Selecto anymore
  - Using component for selecting logic to more easily implement and debug autoscroll, 'ctrl +', and selection persistence
  - Selection is more dynamic, recomputing each frame
  - Likely issue is how the drag selection box behaves on scroll, it should dynamically increase or decrease its height based on scroll movement to ensure the same intersections exist for files to overlap with
- [x] Inconsistent file selecting and odd file selection persistence
  - Was due to autoScroll handler (currently commented out to be reimplmented later)
  - Implemented a global onMouseDown handler, to handle out of div selects
- [ ] 'Ctrl +' behavior:
  - Holding 'Ctrl +' prevents dynamic drag select/deselect
- [ ] Installed apps scanning hitrate)
  - Could look into potential other folders like ones for Xbox Desktop or Microsoft Apps
  - Icon scanning still limited, indexing likely bugged for .exe/.dll's

---

## Developer

Project by **Serjo Barron**
