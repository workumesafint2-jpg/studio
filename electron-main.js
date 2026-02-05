
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "(ወርቁ) - BPMN Generator",
    icon: path.join(__dirname, 'public/favicon.ico')
  });

  // In production, load the exported static files
  // In development, you might point to localhost:9002
  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:9002');
  } else {
    win.loadFile(path.join(__dirname, 'out/index.html'));
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
