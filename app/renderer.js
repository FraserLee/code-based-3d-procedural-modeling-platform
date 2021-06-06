let time = document.getElementById('time');
time.innerHTML = "Rust not yet loaded.";
const core = require('./core');

// Sends the details of an interaction to rust, and modifies the dom based on its response
function simulated_interaction(){
	time.innerHTML = core.hello();
}

simulated_interaction();
setInterval(simulated_interaction, 100);
