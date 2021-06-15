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

	var app = PicoGL.createApp(render_target).clearColor(0,0,0,1);

	let uniforms = app.createUniformBuffer([
		PicoGL.FLOAT, // time
		PicoGL.FLOAT, // frame length
		PicoGL.INT_VEC2, // resolution
	]).set(1, 0.0).set(2, [render_target.width, render_target.height]);

	var targetA = app.createTexture2D(render_target.width, render_target.height);
	var targetB = app.createTexture2D(render_target.width, render_target.height);

	window.onresize = function(){
		render_target.width = render_target.parentElement.clientWidth;
		render_target.height = render_target.parentElement.clientHeight;

		app.resize(render_target.width, render_target.height);

		// targetA.delete(); targetB.delete(); 
		// targetA = app.createTexture2D(render_target.width, render_target.height);
		// targetB = app.createTexture2D(render_target.width, render_target.height);

		uniforms.set(1, [render_target.width, render_target.height]);
	}

	var vertexShader = app.createShader(PicoGL.VERTEX_SHADER, core.load_vert());

	var programMain = app.createProgram(vertexShader, core.build_shader());

	var fSourceBlit = `
		#version 300 es
		precision highp float;

		layout(std140) uniform uniforms {
			float iTime;
			float iFrameLength;
			ivec2 iResolution;
		};
		uniform sampler2D texture_in;

		out vec4 fragColor;
		void main() {
			fragColor = texture(texture_in, gl_FragCoord.xy/vec2(iResolution));
		}`;
	var programBlit = app.createProgram(vertexShader, fSourceBlit);

	var triangleArray = app.createVertexArray()
	.vertexAttributeBuffer(0, app.createVertexBuffer(
		PicoGL.FLOAT, 2, new Float32Array([
			-1,  3,
			-1, -1,
			 3, -1
	])));

	var framebufferA = app.createFramebuffer().colorTarget(0, targetA);
	var framebufferB = app.createFramebuffer().colorTarget(0, targetB);

	var callMainA = app.createDrawCall(programMain, triangleArray).uniformBlock("uniforms", uniforms)
	.texture("last_frame", framebufferB.colorAttachments[0]);
	var callMainB = app.createDrawCall(programMain, triangleArray).uniformBlock("uniforms", uniforms)
	.texture("last_frame", framebufferA.colorAttachments[0]);

	var callBlitA = app.createDrawCall(programBlit, triangleArray).uniformBlock("uniforms", uniforms)
	.texture("texture_in", framebufferA.colorAttachments[0]);
	var callBlitB = app.createDrawCall(programBlit, triangleArray).uniformBlock("uniforms", uniforms)
	.texture("texture_in", framebufferB.colorAttachments[0]);

	var flipflop = true;
	function draw() {
		uniforms.set(0, performance.now()/1000.0);
		uniforms.update();


		if(flipflop=!flipflop){
			app.drawFramebuffer(framebufferA).clear();
			callMainA.draw();
			app.defaultDrawFramebuffer().clear();
			callBlitA.draw();
		}else{
			app.drawFramebuffer(framebufferB).clear();
			callMainB.draw();
			app.defaultDrawFramebuffer().clear();
			callBlitB.draw();
		}


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
