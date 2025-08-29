// key = folderPath, value = { files, visibleSize, hiddenSize, timestamp }
const folderCache = new Map();

export function getFromCache(folderPath) {
  return folderCache.get(folderPath) || null;
}

export function setInCache(folderPath, data) {
  folderCache.set(folderPath, { ...data, timestamp: Date.now() });
}

export function invalidateCache(folderPath) {
  folderCache.delete(folderPath);
}

export function clearCache() {
  folderCache.clear();
}

// key = exePath, value = { dataUrl, timestamp }
const appIconCache = new Map();

export function getAppIconFromCache(exePath) {
  const entry = appIconCache.get(exePath);
  if (!entry) return null;
  return entry.dataUrl;
}

export function setAppIconInCache(exePath, dataUrl) {
  appIconCache.set(exePath, { dataUrl, timestamp: Date.now() });
}

export function invalidateAppIconCache(exePath) {
  appIconCache.delete(exePath);
}

export function clearAppIconCache() {
  appIconCache.clear();
}
