const { app, BrowserWindow, shell, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');

// Registrar el esquema antes del ready para que funcione en el AppImage
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true } }
]);

// Protocolo personalizado que resuelve rutas absolutas dentro de web-build/
app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    let urlPath = new URL(request.url).pathname;
    if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
    const filePath = path.join(__dirname, 'web-build', urlPath);
    if (fs.existsSync(filePath)) {
      return net.fetch('file://' + filePath);
    }
    // fallback a index.html para SPA routing
    return net.fetch('file://' + path.join(__dirname, 'web-build', 'index.html'));
  });

  createWindow();
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 860,
    minWidth: 960,
    minHeight: 600,
    title: 'MUA Biodiversidad',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#f7f5ee',
  });

  win.setMenuBarVisibility(false);

  if (app.isPackaged) {
    win.loadURL('app://localhost/index.html');
  } else {
    win.loadURL('http://localhost:8081');
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.on('window-all-closed', () => {
  app.quit();
});
