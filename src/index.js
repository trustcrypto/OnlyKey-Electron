/* eslint-disable no-console */
/* eslint-disable arrow-parens */
/* eslint-disable no-plusplus */
import { app, BrowserWindow } from 'electron';
import usbDetect from 'usb-detection';
import OK from './ok';
import retry from './utils/retry';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    usbDetect.stopMonitoring();
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

function okConnect(deviceInfo, retries = 40) {
  const ok = new OK();
  retry(ok.connect.bind(ok, deviceInfo), retries, 250);
}

function listen() {
  // Detect add/insert
  OK.SUPPORTED_DEVICES.forEach(deviceInfo => usbDetect.on(`add:${deviceInfo.vendorId}:${deviceInfo.productId}`, () => okConnect(deviceInfo)));
  usbDetect.startMonitoring();
}

function appInit() {
  createWindow();

  let connected = false;
  OK.SUPPORTED_DEVICES.forEach(deviceInfo => {
    connected = !!okConnect(deviceInfo, 5);
  });

  if (!connected) listen();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', appInit);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    appInit();
  }
});
