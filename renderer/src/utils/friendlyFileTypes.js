const friendlyFileTypes = {
  // Office & Productivity
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word Document",
  "application/msword": "Word Document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel Spreadsheet",
  "application/vnd.ms-excel": "Excel Spreadsheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint Presentation",
  "application/vnd.ms-powerpoint": "PowerPoint Presentation",
  "application/pdf": "PDF Document",

  // Images
  "image/jpeg": "JPEG Image",
  "image/png": "PNG Image",
  "image/gif": "GIF Image",
  "image/svg+xml": "SVG Image",
  "image/webp": "WebP Image",
  "image/bmp": "Bitmap Image",
  "image/tiff": "TIFF Image",

  // Audio
  "audio/mpeg": "MP3 Audio",
  "audio/wav": "WAV Audio",
  "audio/ogg": "OGG Audio",
  "audio/flac": "FLAC Audio",

  // Video
  "video/mp4": "MP4 Video",
  "video/mpeg": "MPEG Video",
  "video/quicktime": "MOV Video",
  "video/x-msvideo": "AVI Video",
  "video/webm": "WebM Video",

  // Code/Markup
  "application/javascript": "JavaScript File",
  "text/javascript": "JavaScript File",
  "application/json": "JSON File",
  "application/xml": "XML File",
  "text/html": "HTML File",
  "text/css": "CSS File",
  "text/markdown": "Markdown File",
  "application/x-python-code": "Python File",
  "text/x-python": "Python File",
  "application/x-java": "Java File",
  "text/x-java-source": "Java File",
  "text/x-csrc": "C Source File",
  "text/x-c++src": "C++ Source File",

  // Archives
  "application/zip": "ZIP Archive",
  "application/x-rar-compressed": "RAR Archive",
  "application/gzip": "GZIP Archive",
  "application/x-7z-compressed": "7-Zip Archive",
  "application/x-tar": "TAR Archive",

  // Shortcuts
  "application/x-ms-shortcut": "Windows Shortcut",
  "application/lnk": "Windows Shortcut",

  // Fallback/Generic
  folder: "Folder",
  unknown: "Unknown File",
};

/**
 * Returns a friendly, human-readable file type
 * @param {string} mimeType - the mime type string from main.js
 * @param {boolean} isDirectory - whether the file is a folder
 * @returns {string}
 */
export function getFriendlyFileType(mimeType, isDirectory = false) {
  if (isDirectory) return friendlyFileTypes.folder || "Folder";
  return friendlyFileTypes[mimeType] || capitalizeMimeFallback(mimeType) || "File";
}

/*
If mime type isn't in the map, try a fallback friendly string
e.g., "application/vnd.customformat" -> "Customformat File"
*/
function capitalizeMimeFallback(mimeType) {
  if (!mimeType) return null;
  const parts = mimeType.split("/");
  if (parts.length < 2) return mimeType;
  let name = parts[1].split(".").pop() || parts[1]; // get last segment
  name = name.replace(/[-_]/g, " "); // replace - or _
  return name.charAt(0).toUpperCase() + name.slice(1) + " File";
}
