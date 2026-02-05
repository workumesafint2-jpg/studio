
const { app, BrowserWindow, Menu } = require('electron');
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
      sandbox: true
    },
    title: "(ወርቁ) - BPMN Generator",
    autoHideMenuBar: true,
    backgroundColor: '#F0F0F0'
  });

  const isDev = !app.isPackaged;
  
  if (isDev) {
    win.loadURL('http://localhost:9002');
  } else {
    // In production, we load the exported Next.js HTML files from the 'out' directory
    const indexPath = path.join(__dirname, 'out', 'index.html');
    win.loadFile(indexPath).catch(err => {
      console.error('Failed to load local file:', err);
    });
  }

  // Handle external links securely
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) {
      require('electron').shell.openExternal(url);
    }
    return { action: 'deny' };
  });
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
