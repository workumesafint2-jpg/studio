
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "(ወርቁ) - BPMN Generator",
    autoHideMenuBar: true
  });

  // In production, load the exported static files
  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:9002');
  } else {
    // Correctly resolve the path to the index.html inside the 'out' directory
    const indexPath = path.join(__dirname, 'out', 'index.html');
    win.loadFile(indexPath).catch(err => {
      console.error('Failed to load local file:', err);
    });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
