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

    let vertex1 = Vertex { position: [ 0.0,  0.75] };
    let vertex2 = Vertex { position: [ 0.25, -0.25] };
    let vertex3 = Vertex { position: [-0.25, -0.5] };
    let shape = vec![vertex1, vertex2, vertex3];

	let vertex_buffer = glium::VertexBuffer::new(&display, &shape).unwrap();
	let indices = glium::index::NoIndices(glium::index::PrimitiveType::TrianglesList);

	let vertex_shader_src = r#"
		#version 140
		in vec2 position;
		void main() {
			gl_Position = vec4(position, 0.0, 1.0);
		}
	"#;

	let fragment_shader_src = r#"
		#version 140
		out vec4 color;
		void main() {
			color = vec4(0.0, 0.501, 0.741, 1.0);
		}
	"#;

	let program = glium::Program::from_source(&display, vertex_shader_src, fragment_shader_src, None).unwrap();
	
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
		target.draw(&vertex_buffer, &indices, &program, &glium::uniforms::EmptyUniforms,
					&Default::default()).unwrap();
		target.finish().unwrap();
	});
}
