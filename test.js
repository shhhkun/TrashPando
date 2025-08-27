const { getWinInstalledApps } = require('get-installed-apps');

async function listInstalledApps() {
  try {
    const apps = await getWinInstalledApps();
    console.log('Installed Applications:', apps);
  } catch (error) {
    console.error('Error retrieving installed applications:', error);
  }
}

listInstalledApps();
