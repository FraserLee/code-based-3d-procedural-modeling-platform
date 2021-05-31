#[macro_use]
extern crate glium;

fn main() {
	use glium::{glutin::{self as gl, dpi::LogicalSize}, Surface};
	
	let win_size = LogicalSize {
		width: 1200f32,
		height: 600f32,
	};
	let wb = gl::window::WindowBuilder::new().with_title("procmodl").with_inner_size(win_size);
	let cb = gl::ContextBuilder::new();
	let event_loop = gl::event_loop::EventLoop::new();
	let display = glium::Display::new(wb, cb, &event_loop).unwrap();

	#[derive(Copy, Clone)]
	struct Vertex {
		position: [f32; 2],
	}

	implement_vertex!(Vertex, position);

	let vertex1 = Vertex { position: [-1f32, 3f32] };
	let vertex2 = Vertex { position: [-1f32,-1f32] };
	let vertex3 = Vertex { position: [ 3f32,-1f32] };
	let shape = vec![vertex1, vertex2, vertex3];

	let vertex_buffer = glium::VertexBuffer::new(&display, &shape).unwrap();
	let indices = glium::index::NoIndices(glium::index::PrimitiveType::TrianglesList);

	let vertex_shader_src = r#"
		#version 330
		in vec2 position;
		void main() {
			gl_Position = vec4(position, 0.0, 1.0);
		}
	"#;

	let fragment_shader_src = r#"
		#version 330
		uniform float iTime;
		out vec4 color;
		void main() {
			// color = vec4(0.0, 0.501, 0.741, 1.0);
		
			vec3 col = 0.5 + 0.5*cos(iTime+vec3(0,2,4));
			color = vec4(col,1.0);
		}
		// out vec4 fracColor;
		// void main(out vec4 fragColor, in vec2 fragCoord ) {
		// void main() {
			// Normalized pixel coordinates (from 0 to 1)
			// vec2 uv = fragCoord/iResolution.xy;
		
			// Time varying pixel color
			// vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
				
			// Output to screen
			// fragColor = vec4(col,1.0);
		// }
	"#;

	let program = glium::Program::from_source(&display, vertex_shader_src, fragment_shader_src, None).unwrap();

	let time_init_over = std::time::Instant::now();
	event_loop.run(move |event, _, control_flow| {
		let next_frame_time = std::time::Instant::now() +
			std::time::Duration::from_nanos(16_666_667);
		*control_flow = gl::event_loop::ControlFlow::WaitUntil(next_frame_time);

		match event {
			gl::event::Event::WindowEvent { event, .. } => match event {
				gl::event::WindowEvent::CloseRequested => {
					*control_flow = gl::event_loop::ControlFlow::Exit;
					return;
				},
				_ => return,
			},
			_ => (),
		}
		
		let mut target = display.draw();
		target.clear_color(0.070, 0.078, 0.090, 1.0);
		target.draw(&vertex_buffer, &indices, &program, &uniform! { iTime: next_frame_time.duration_since(time_init_over).as_secs_f32() },
					&Default::default()).unwrap();
		target.finish().unwrap();
	});
}
