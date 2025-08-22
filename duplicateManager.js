import fs from "fs";
import path from "path";
import { hashFile } from "./renderer/src/utils/hash.js";

function shouldSkipFolder(folderName, fullPath) {
  const skipPatterns = [
    "node_modules",
    "temp",
    "tmp",
    "cache",
    "logs",
    "bak",
    "backup",
    "Autogen",
    "Intermediate",
    "Saved",
    ".nyc_output",
    ".git", // skip entire .git folders
    ".svn", // SVN users
    ".hg", // for Mercurial users
  ];

  return skipPatterns.some((p) =>
    folderName.toLowerCase().includes(p.toLowerCase())
  );
}

function shouldSkipFile(fileName, fullPath) {
  const skipExtensions = [".tmp", ".log", ".bak", ".swp"];

  const skipNames = [
    ".DS_Store",
    "Thumbs.db",
    ".babelrc",
    "package-lock.json",
    "yarn.lock",
    "PROFSAVE", // game saves
    "kvstore", // game cache/state
  ];

  if (skipExtensions.some((ext) => fileName.toLowerCase().endsWith(ext)))
    return true;
  if (
    skipNames.some((name) =>
      fileName.toLowerCase().includes(name.toLowerCase())
    )
  )
    return true;

  return false;
}

export async function findDuplicates(
  folderPath,
  options = { matchExtension: true }
) {
  const hashMap = new Map();

  async function traverse(currentPath) {
    const items = await fs.promises.readdir(currentPath, {
      withFileTypes: true,
    });
    console.log("currentPath: ", currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item.name);

      if (item.isDirectory()) {
        // skip unwanted directories
        const dirName = path.basename(fullPath);
        if (shouldSkipFolder(dirName, fullPath)) continue;

        await traverse(fullPath); // recurse into folder and wait till cleared
      } else if (item.isFile()) {
        // skip unwanted files
        if (shouldSkipFile(item.name, fullPath)) continue;

        console.log("Traversing:", currentPath);
        const stats = await fs.promises.stat(fullPath); // get file stats/metadata

        if (stats.size === 0) continue; // skip empty files

        const ext = path.extname(item.name); // grab extension
        const fileHash = await hashFile(fullPath);

        const entry = {
          path: fullPath,
          extension: ext,
          size: stats.size,
        };

        if (hashMap.has(fileHash)) {
          // found potential duplicate
          // if matchExtension = true, latter condition must hold true (same extension type)
          // if matchExtension = false, duplicate regardless of extension type
          // comparing against first file stored under "fileHash" for extension equality
          if (
            !options.matchExtension ||
            hashMap.get(fileHash)[0].extension === ext
          ) {
            hashMap.get(fileHash).push(entry); // push entry into existing array
          }
        } else {
          hashMap.set(fileHash, [entry]); // create object array for new fileHash
        }
      }
    }
  }

  await traverse(folderPath);

  const duplicates = [];
  for (const files of hashMap.values()) {
    if (files.length > 1) duplicates.push(files); // push object array of duplicates
  }

  return duplicates;
}
