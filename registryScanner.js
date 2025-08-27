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
async function scanInstalledAppsRegistry() {
  let apps = [];
  try {
    const rawApps = await getWinInstalledApps();
    apps = rawApps.map(mapAppObject);
  } catch (err) {
    console.error("Failed to scan installed apps:", err);
  }

  return apps;
}

module.exports = { scanInstalledAppsRegistry };

if (require.main === module) {
  (async () => {
    console.log("Running installed apps registry scan...\n");
    const { scanInstalledAppsRegistry } = require("./registryScanner");

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
