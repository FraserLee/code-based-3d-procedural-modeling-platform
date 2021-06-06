let time = document.getElementById('time');
time.innerHTML = "Rust not yet loaded.";
const core = require('./core');


// require('ace-builds/src-noconflict/ace.js');
require('ace-builds/src-noconflict/ext-language_tools.js');
var editor = ace.edit("editor", {
	mode: "ace/mode/glsl",//"ace/mode/python",
	theme: "ace/theme/dracula",

	highlightActiveLine: true,
	highlightSelectedWord: true,
	cursorStyle: "smooth",
	copyWithEmptySelection: true,
	useSoftTabs: false,
	navigateWithinSoftTabs: false,
	enableMultiselect: true,

	printMargin: false,
	fadeFoldWidgets: true,
	showFoldWidgets: true,
	showLineNumbers: true,
	showGutter: true,
	displayIndentGuides: true,
	fontSize: 13,
	scrollPastEnd: 0.5,
	fixedWidthGutter: true,

	newLineMode: "unix",
	wrap: true,

	enableBasicAutocompletion: true,
	enableLiveAutocompletion: true,
	enableSnippets: true
	});

editor.session.setValue(core.load_program());

// require('ayu-ace');
// editor.setTheme('ace/theme/ayu-mirage')
// editor.setTheme("ace/theme/gruvbox");
// editor.setTheme("ace/theme/monokai");
// editor.setTheme("ace/theme/dracula");


// Sends the details of an interaction to rust, and modifies the dom based on its response
function simulated_interaction(){
	time.innerHTML = core.test();
}
simulated_interaction();
setInterval(simulated_interaction, 100);
