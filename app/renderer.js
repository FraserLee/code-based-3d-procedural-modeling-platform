ipcRenderer.on('core-transfer', function (evt, core) {
	let time = document.getElementById('time');
	time.innerHTML = "Rust not yet loaded.";
	time.innerHTML = core.hello();
	
	function process_time(){
		time.innerHTML = core.hello();//++x;
	}
	process_time();
	
	setInterval(process_time, 100);
});