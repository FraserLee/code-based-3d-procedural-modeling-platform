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

	let vert_shader_src = include_str!("vert.vert");
	let frag_shader_src = include_str!("frag.frag");
	let program = glium::Program::from_source(&display, vert_shader_src, frag_shader_src, None).unwrap();

	let time_init_over = std::time::Instant::now();
	event_loop.run(move |event, _, control_flow| {
		let next_frame_time = std::time::Instant::now() +
			std::time::Duration::from_nanos(16_666_667); // TODO: find time from monitor refresh rate
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
		let i_resolution_int = display.get_framebuffer_dimensions();
		target.draw(&vertex_buffer, &indices, &program, 
			&uniform! { 
				iTime: next_frame_time.duration_since(time_init_over).as_secs_f32(),
				iResolution: (i_resolution_int.0 as f32, i_resolution_int.1 as f32),
			},
			&Default::default()).unwrap();
		target.finish().unwrap();
	});
}
