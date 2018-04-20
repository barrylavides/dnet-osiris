const electron = require('electron')

// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
const dialog = electron.dialog
const shell = electron.shell
const path = require('path')
const url = require('url')
const jsonfile = require('jsonfile');
const dateFormat = require('dateformat');
var download_history = path.join(__dirname, 'download_history.json');


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 800, height: 600})

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })

    // Opens a folder in a computer
    // shell.showItemInFolder('/Users/barry.lavides/Downloads/electron-files')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

function addDownloadHistory(filename) {
    jsonfile.readFile(download_history, function(err, file) {
        var _date = dateFormat(new Date(), 'm/d/yyyy');
        var dataObject = {};

        if (file === undefined) {
            dataObject[_date] = {
                'files': [{
                    'icon': '',
                    'title': filename,
                    'status': '',
                    'source': '',
                    'action': 'show folder or retry'
                }]
            }
        } else {
            file[String(_date)]['files'].push({
                'icon': '',
                'title': filename,
                'status': '',
                'source': '',
                'action': 'show folder or retry'
            })

            dataObject = file;
        }

        jsonfile.writeFile(download_history, dataObject, function (err) {
        })
    });
}

electron.BrowserWindow.prototype.setDownloadSavePath = function (path) {
    this.webContents.session.once('will-download', (event, item) => {
        addDownloadHistory(item.getFilename());

        // var savePath = dialog.showSaveDialog(mainWindow, {
        //     title: 'foo',
        //     defaultPath: path + '/' + item.getFilename()
        // });
        var savePath = dialog.showSaveDialog({});

        console.log(savePath)

        // item.setSavePath(savePath);
        // item.setSavePath(path);
    });
};




// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.