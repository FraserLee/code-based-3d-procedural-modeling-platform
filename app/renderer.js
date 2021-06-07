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
	let render_target = document.getElementById('render_target');
	render_target.width = render_target.parentElement.clientWidth;
	render_target.height = render_target.parentElement.clientHeight;

	let app = PicoGL.createApp(render_target).clearColor(0.0, 0.0, 0.0, 1.0);
	window.onresize = function(){
		app.resize(render_target.parentElement.clientWidth, render_target.parentElement.clientHeight);
	}

	let uniforms = app.createUniformBuffer([
		PicoGL.FLOAT//, // time
		// PicoGL.INT_VEC2 // resolution
	]).set(0, 0.5)// performance.now()/1000.0)
	// .set(1, [render_target.width, render_target.height])
	.update();

	app.createPrograms([core.load_vert(), core.load_frag()]).then(([program]) => {
		let positions = app.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
			-1,  3,
			-1, -1,
			 3, -1
		]));
		// console.log('test');
		let drawCall = app.createDrawCall(program, app.createVertexArray().vertexAttributeBuffer(0, positions)).uniformBlock("uniforms", uniforms);

		function draw() {
			uniforms.set(0, performance.now()/1000.0);
			uniforms.update();
			app.clear();
			drawCall.draw();
			requestAnimationFrame(draw);
		}
		requestAnimationFrame(draw);
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