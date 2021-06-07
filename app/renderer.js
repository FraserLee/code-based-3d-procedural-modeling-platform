const core = require('./core');

//<TEXT EDITOR>
	// require('ace-builds/src-noconflict/ace.js');
	require('ace-builds/src-noconflict/ext-language_tools.js');
	var editor = ace.edit("editor", {
		  mode: "ace/mode/glsl" //"ace/mode/python"
		, theme: "ace/theme/dracula"

		, highlightActiveLine: true
		, highlightSelectedWord: true
		, cursorStyle: "smooth"
		, copyWithEmptySelection: true
		, useSoftTabs: false
		, navigateWithinSoftTabs: false
		, enableMultiselect: true

		, printMargin: false
		, fadeFoldWidgets: true
		, showFoldWidgets: true
		, showLineNumbers: true
		, showGutter: true
		, displayIndentGuides: true
		, fontSize: 13
		, scrollPastEnd: 0.5
		, fixedWidthGutter: true

		, newLineMode: "unix"
		, wrap: true

		, enableBasicAutocompletion: true
		, enableLiveAutocompletion: true
		, enableSnippets: true

		// , keyboardHandler: 'ace/keyboard/vim'
		});

	editor.session.setValue(core.load_frag());

	// require('ayu-ace');
	// editor.setTheme('ace/theme/ayu-mirage')
	// editor.setTheme("ace/theme/gruvbox");
	// editor.setTheme("ace/theme/monokai");
	// editor.setTheme("ace/theme/dracula");
//</TEXT EDITOR>

//<WEBGL>
	const PicoGL = require("picogl");
	let app = PicoGL.createApp(document.getElementById('render_target')).clearColor(0.0, 0.0, 1.0, 1.0);
	
	app.createPrograms([core.load_vert(), core.load_frag()]).then(([program]) => {
		let positions = app.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
			-1,  3,
			-1, -1,
			 3, -1
		]));

		let drawCall = app.createDrawCall(program, app.createVertexArray().vertexAttributeBuffer(0, positions));

		app.clear();
		drawCall.draw();
	});
//</WEBGL>

//<CORE INTERFACE>
	// Sends the details of an interaction to rust, and modifies the dom based on its response
	function simulated_interaction(){
		// time.innerHTML = core.test();
		core.test();
	}
	simulated_interaction();
	setInterval(simulated_interaction, 100);
//</CORE INTERFACE>