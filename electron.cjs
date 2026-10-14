
const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

const isDev = !app.isPackaged;
const PORT = 3000;
const SERVER_URL = `http://127.0.0.1:${PORT}`;

function getPaths() {
  if (isDev) {
    return {
      server: path.join(
        __dirname, 'server', 'target', 'release',
        'prompter-server.exe'
      ),
      staticDir: path.join(__dirname, 'dist'),
      dataDir: path.join(__dirname, 'server', 'data')
    };
  }

  return {
    server: path.join(
      process.resourcesPath, 'prompter-server.exe'
    ),
    staticDir: path.join(process.resourcesPath, 'app-dist'),
    dataDir: path.join(app.getPath('userData'), 'data')
  };
}

function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
  serverProcess = null;
}

async function startServer() {
  const paths = getPaths();

  for (const file of [paths.server, path.join(paths.staticDir, 'index.html')]) {
    if (!fs.existsSync(file)) {
      throw new Error(`Fichier introuvable : ${file}`);
    }
  }

  fs.mkdirSync(paths.dataDir, { recursive: true });

  serverProcess = spawn(paths.server, [], {
    cwd: path.dirname(paths.server),
    windowsHide: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      PORT: String(PORT),
      PROMPTER_DATA: paths.dataDir,
      PROMPTER_STATIC: paths.staticDir
    }
  });

  serverProcess.on('error', (err) => {
    console.error('Erreur de démarrage du serveur :', err);
  });

  const deadline = Date.now() + 30000;

  while (Date.now() < deadline) {
    if (!serverProcess || serverProcess.exitCode !== null) {
      throw new Error(
        'Le serveur Rust s’est arrêté avant de devenir disponible.'
      );
    }

    try {
      const response = await fetch(`${SERVER_URL}/api/users`);
      if (response.ok) return;
    } catch {
      // Le serveur n'est pas encore prêt.
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  stopServer();
  throw new Error(
    'Le serveur local ne répond pas sur le port 3000 après 30 secondes.'
  );
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#07070a',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.on('did-fail-load', (_event, code, description) => {
    console.error('Erreur de chargement :', code, description);
  });

  mainWindow.loadURL(SERVER_URL);
}

app.whenReady().then(async () => {
  try {
    await startServer();
    createWindow();
  } catch (error) {
    dialog.showErrorBox(
      'Ultimate Prompter Studio',
      `Impossible de démarrer l’application.\n\n${error.message}`
    );
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', stopServer);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
