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
