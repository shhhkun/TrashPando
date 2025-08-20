const { parentPort } = require("worker_threads");
const chokidar = require("chokidar");

const watchers = new Map();

const ignoredFolders = [
  "Music",
  "Pictures",
  "Videos",
  "My Music",
  "My Pictures",
  "My Videos",
];
const ignoredRegex = new RegExp(ignoredFolders.join("|"));

parentPort.on("message", ({ task, folderPath }) => {
    if (task == "watch") {
        if (watchers.has(folderPath)) return; // already watching

        const watcher = chokidar.watch(folderPath ,{
            ignoreInitial: true,
            ignorePermissionErrors: true,
            ignored: ignoredRegex,
        });

        let pendingInvalidation = null;

        watcher.on("all", () => {
            if (pendingInvalidation) clearTimeout(pendingInvalidation);

            pendingInvalidation = setTimeout(() => {
                parentPort.postMessage({ folderPath });
                pendingInvalidation = null;
            }, 500);
        });

        watchers.set(folderPath, watcher);
    } else if (task === "unwatch") {
        if (watcher) {
            watcher.close();
            watcher.delete(folderPath);
        }
    }
});