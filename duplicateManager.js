import fs from "fs";
import path from "path";
import { hashFile } from "./renderer/src/utils/hash.js";

export async function findDuplicates(folderPath, options = { matchExtension: true }) {
  const hashMap = new Map();

  async function traverse(currentPath) {
    const items = await fs.promises.readdir(currentPath, {
      withFileTypes: true,
    });

    for (const item of items) {
      const fullPath = path.join(currentPath, item.name);

      if (item.isDirectory) {
        await traverse(fullPath); // recurse into folder and wait till cleared
      } else if (item.isFile()) {
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
