const { app, BrowserWindow } = require('electron');
const core = require('./core');

function createWindow () {
	const win = new BrowserWindow({
		width: 1200,
		height: 600
	});
	win.loadFile('index.html');
	win.webContents.send('core-transfer', core);
	console.log(core.hello());
}

app.on('window-all-closed', function () {
	app.quit();
})

app.whenReady().then(() => {
	createWindow();

	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	})
})

