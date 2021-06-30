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
		, fontSize: 12
		, scrollPastEnd: 0.5
		, fixedWidthGutter: true

		, newLineMode: "unix"
		, wrap: true

		, enableBasicAutocompletion: true
		, enableLiveAutocompletion: true
		, enableSnippets: true

		// , keyboardHandler: 'ace/keyboard/vim'
		});

	editor.session.setValue(core.build_shader());

	// require('ayu-ace');
	// editor.setTheme('ace/theme/ayu-mirage')
	// editor.setTheme("ace/theme/gruvbox");
	// editor.setTheme("ace/theme/monokai");
	// editor.setTheme("ace/theme/dracula");
//</TEXT EDITOR>

//<WEBGL>
	const PicoGL = require("picogl");
	var render_target = document.getElementById('render_target');
	render_target.width = render_target.parentElement.clientWidth;
	render_target.height = render_target.parentElement.clientHeight;

	var width, height;

	var app = PicoGL.createApp(render_target).clearColor(0,0,0,1);
	
	let uniforms = app.createUniformBuffer([
		PicoGL.FLOAT, // time
		PicoGL.FLOAT, // frame length
		PicoGL.INT_VEC2, // resolution
		PicoGL.FLOAT  // render frame number
	]).set(1, 0.0);
	
	var vertexShader = app.createShader(PicoGL.VERTEX_SHADER, core.load_vert());
	var programMain = app.createProgram(vertexShader, core.build_shader());
	var programPost = app.createProgram(vertexShader, core.load_postprocess_accumulator());

	var triangleArray = app.createVertexArray()
	.vertexAttributeBuffer(0, app.createVertexBuffer(
		PicoGL.FLOAT, 2, new Float32Array([
			-1,  3,
			-1, -1,
			 3, -1
	])));


	// all the parts of initialization that - in one way or another - depend on size. This is called again every resize.
	var framebufferA, framebufferB, callMainA, callPostA, callMainB, callPostB;
	function init(){
		// the width and height of the render target, in real pixels irregardless of view scale
		width  = Math.round(window.devicePixelRatio*render_target.parentElement.getBoundingClientRect().width );
		height = Math.round(window.devicePixelRatio*render_target.parentElement.getBoundingClientRect().height);
		console.log(width, height);

		app.resize(width, height); // I think this does some internal stuff, also sets render_target.width and .height
		render_target.clientWidth  = render_target.parentElement.clientWidth;
		render_target.clientHeight = render_target.parentElement.clientHeight;


		uniforms.set(2, [width, height]);
		
		framebufferA = app.createFramebuffer().colorTarget(0, app.createTexture2D(width, height, { internalFormat: PicoGL.RGBA16F }));
		framebufferB = app.createFramebuffer().colorTarget(0, app.createTexture2D(width, height, { internalFormat: PicoGL.RGBA16F }));
		
		
		callMainA = app.createDrawCall(programMain, triangleArray).uniformBlock("uniforms", uniforms)
			.texture("last_frame", framebufferB.colorAttachments[0]);
		callMainB = app.createDrawCall(programMain, triangleArray).uniformBlock("uniforms", uniforms)
			.texture("last_frame", framebufferA.colorAttachments[0]);

		callPostA = app.createDrawCall(programPost, triangleArray).uniformBlock("uniforms", uniforms)
			.texture("texture_in", framebufferA.colorAttachments[0]);
		callPostB = app.createDrawCall(programPost, triangleArray).uniformBlock("uniforms", uniforms)
			.texture("texture_in", framebufferB.colorAttachments[0]);
	}
	init();
	
	window.onresize = init; 


	var render_frame_num = 0;
	var flipflop = true;
	function draw() {
		uniforms.set(0, performance.now()/1000.0);
		uniforms.set(3, render_frame_num);
		uniforms.update();

		if(flipflop=!flipflop){
			app.drawFramebuffer(framebufferA).clear();
			callMainA.draw();
			app.defaultDrawFramebuffer().clear();
			callPostA.draw();
		}else{
			app.drawFramebuffer(framebufferB).clear();
			callMainB.draw();
			app.defaultDrawFramebuffer().clear();
			callPostB.draw();
		}
		render_frame_num++;

		requestAnimationFrame(draw);
	}
	requestAnimationFrame(draw);
		
	
//</WEBGL>

//<CORE INTERFACE>
	// Sends the details of an interaction to rust, and modifies the dom based on its response
	/* function simulated_interaction(){
	 *     // time.innerHTML = core.test();
	 *     core.test();
	 * }
	 * simulated_interaction();
	 * setInterval(simulated_interaction, 100); */
//</CORE INTERFACE>
