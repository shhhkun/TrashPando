# Trashu — A Smart Desktop Storage Cleaner

## Overview  
Trashu is a desktop app built with Electron that helps users clean up their storage by finding duplicate, unused, or forgotten files. With plans to integrate smart metrics, including last access and usage time, the app aims to provide suggestions that simplify and optimize disk cleanup.

*Built with: Electron, Node.js, React, Vite, JavaScript, Tailwind CSS*

---

## Screenshots  

*Screenshots coming soon*

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

*Detailed instructions coming as features are implemented*

---

## Development Log

### **v0.1 – Initial Setup**
- Electron app initialized with a window and basic UI
- Folder selection implemented
- Display selected folder path
- Show the folder paths included files as well as their metadata (filename, size, filetype)

### **v1.0 - Navigation, Manipulation, & Selection**
- Added file deletion
- Supports multi-file selection, delete confirmation modal, and toast popup messages for number of files removed
- Implemented drag and select for multiple file selection
    - 'Ctrl +' shortcut for appending selections together
    - Dynamic select/unselect logic based on drag selection box
- Load/scan common folders on OS as suggested areas of cleaning

### **v1.1 - Upcoming**
- Smart metrics (suggestion based file cleanup) based on:
    - Folder contents (empty/non-empty)
    - File size
    - Recently used/modified dates
    - Duplicate files
- Will adjust suggestions to ignore sensitive/important areas like Systems Files, Device Driver, etc.
- Advanced metrics?
    - Screentime/usage time to be incorporated into suggestion logic
    - Perhaps fetch info from other OS apps such as Task Manager

---

## Roadmap
- [x] Implement basic file scanning and metadata collection
- [ ] File previews and sorting/filtering options
- [ ] Undo button for last delete action/safety net
    - Trashing/recycling (depends on OS) items rather than permanent delete currently
    - Will later make it togglable in settings for power users
- [ ] Duplicate detection & improve metadata collection
- [ ] Smart metrics integration (last access time, usage frequency)
- [ ] Packaged installers for Windows/macOS
- [ ] Panda themed UI (big UI overhaul once core features are implemented and thoroughly tested)

---

## Known Issues
- [ ] Path separator fetching is a bit unoptimized, check/look into preload.js loading properly as to use electronAPI calls rather than state & useEffect
- [ ] Common folders scan is somewhat restricted/limited by how its defined in main.js, possibly allow user to add their own preference of common folders
- [ ] File selecting whilst scrolling
    - Not using React Selecto anymore
    - Using component for selecting logic to more easily implement and debug autoscroll, 'ctrl +', and selection persistence
    - Selection is more dynamic, recomputing each frame
    - Will reimplement autoscroll handling later
- [x] Inconsistent file selecting and odd file selection persistence
    - Was due to autoScroll handler (currently commented out to be reimplmented later)
    - Implemented a global onMouseDown handler, to handle out of div selects

---

## Developer

Project by **Serjo Barron**