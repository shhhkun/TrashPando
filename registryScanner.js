const { getWinInstalledApps } = require("get-installed-apps");

// fetch relevant info from app install obj
function mapAppObject(app) {
  return {
    name: app.appName || app.DisplayName || "Unknown App",
    uninstallString: app.UninstallString || app.UninstallString_Hidden || null,
    size: app.EstimatedSize ? parseInt(app.EstimatedSize, 16) : null,
    iconPath: app.DisplayIcon || null,
    publisher: app.Publisher || app.appPublisher || null,
    version: app.DisplayVersion || app.appVersion || null,
  };
}

// scan installed apps and return cleaned objects
async function* scanInstalledAppsRegistry(batchSize = 5) {
  let rawApps = [];
  try {
    rawApps = await getWinInstalledApps();
  } catch (err) {
    console.error("Failed to scan installed apps:", err);
    return;
  }

  for (let i = 0; i < rawApps.length; i += batchSize) {
    const batch = rawApps.slice(i, i + batchSize);
    const mappedBatch = batch
      .filter((app) => {
        const sysComp = app.SystemComponent
          ? parseInt(app.SystemComponent, 16) // handles hex or decimal strings
          : 0; // default to 0 if missing
        return app.DisplayName && sysComp !== 1;
      })
      .map(mapAppObject);

    yield mappedBatch; // yield each batch to the caller

    // yield to the event loop
    await new Promise((resolve) => setImmediate(resolve));
  }
}

module.exports = { scanInstalledAppsRegistry };

if (require.main === module) {
  (async () => {
    console.log("Running installed apps registry scan...\n");
    const { scanInstalledAppsRegistry } = require("./registryScanner");
    z;

    const apps = await scanInstalledAppsRegistry();

    console.log("\n--- Scan Complete ---\n");
    apps.forEach((app, index) => {
      console.log(`${index + 1}. ${app.name}`);
      if (app.version) console.log(`   Version: ${app.version}`);
      if (app.publisher) console.log(`   Publisher: ${app.publisher}`);
      if (app.size) console.log(`   Size: ${app.size} bytes`);
      if (app.iconPath) console.log(`   Icon: ${app.iconPath}`);
      if (app.uninstallString)
        console.log(`   Uninstall: ${app.uninstallString}`);
      console.log("");
    });

    console.log(`Total apps found: ${apps.length}`);
  })();
}
