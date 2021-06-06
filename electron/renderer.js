let x = 0;
let time = document.getElementById('time');
time.innerHTML = "Rust not yet loaded.";


function process_time(){
	time.innerHTML = ++x;
}
process_time();

setInterval(process_time, 100);
