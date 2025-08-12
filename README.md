# Trashu — A Smart Desktop Storage Cleaner

## Overview  
Trashu is a desktop app built with Electron that helps users clean up their storage by finding duplicate, unused, or forgotten files. With plans to integrate smart metrics like last access time and usage frequency, which aims to make disk cleanup simple and efficient.

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

### **Upcoming v1.0**
- Added file deletion
- Supports multi-file selection, delete confirmation modal, and toast popup messages for number of files removed
- Implemented drag and select for multiple file selection
- File recovery?

---

## Roadmap
- [x] Implement basic file scanning and metadata collection
- [ ] File previews and sorting/filtering options
- [ ] Undo button for last delete action/safety net
- [ ] Duplicate detection & improve metadata collection
- [ ] Smart metrics integration (last access time, usage frequency)
- [ ] Packaged installers for Windows/macOS
- [ ] Panda themed UI (big UI overhaul once core features are implemented and thoroughly tested)

---

## Known Issues
- Path separator fetching is a bit unoptimized, check/look into preload.js loading properly as to use electronAPI calls rather than state & useEffect

---

## Developer

Project by **Serjo Barron**