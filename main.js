const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

async function printHtml({ html, title, printerName }) {
  return new Promise((resolve) => {
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const closeWindow = () => {
      if (!printWindow.isDestroyed()) printWindow.close();
    };

    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    printWindow.webContents.once('did-finish-load', () => {
      printWindow.webContents.print(
        {
          silent: Boolean(printerName),
          deviceName: printerName || undefined,
          printBackground: true,
          margins: { marginType: 'none' },
        },
        (success, failureReason) => {
          resolve({ success, failureReason: failureReason || null });
          setTimeout(closeWindow, 100);
        }
      );
    });

    printWindow.webContents.once('did-fail-load', (_, __, failureReason) => {
      resolve({ success: false, failureReason });
      setTimeout(closeWindow, 100);
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // allowing direct node integration for local pos
    },
    icon: path.join(__dirname, 'public/favicon.png'),
    title: 'BuysialPOS Offline',
  });

  mainWindow.loadURL('http://localhost:3000');
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('printer:list', async () => {
  if (!mainWindow) return [];
  try {
    return await mainWindow.webContents.getPrintersAsync();
  } catch {
    return [];
  }
});

ipcMain.handle('printer:print', async (_, payload) => {
  if (!payload?.html || !payload?.title) {
    return { success: false, failureReason: 'Missing print payload' };
  }
  return printHtml(payload);
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
