const { app, BrowserWindow, ipcMain } = require('electron');

function createWindow () {
	const win = new BrowserWindow({
		width: 1200,
		height: 600,
		useContentSize: true,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		}
	});

	win.loadFile('index.html');
}

app.on('window-all-closed', function () {
	app.quit();
});

app.whenReady().then(() => {
	createWindow();

	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	})
});