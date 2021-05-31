extern crate glium;

fn main() {
	use glium::{glutin::{self as gl, dpi::LogicalSize}, Surface};
	let event_loop = gl::event_loop::EventLoop::new();
	let win_size = LogicalSize {
        width: 1200f32,
        height: 600f32,
    };
	let wb = gl::window::WindowBuilder::new().with_title("procmodl").with_inner_size(win_size);
	let cb = gl::ContextBuilder::new();
	let display = glium::Display::new(wb, cb, &event_loop).unwrap();

	use std::time;
	event_loop.run(move |ev, _, control_flow| {
		
		let next_frame_time = time::Instant::now() +
			time::Duration::from_nanos(16_666_667);


		let mut target = display.draw();
		target.clear_color(0.070, 0.078, 0.090, 1.0);
		target.finish().unwrap();


		*control_flow = gl::event_loop::ControlFlow::WaitUntil(next_frame_time);
		
		//exit window
		match ev {
			gl::event::Event::WindowEvent { event, .. } => match event {
				gl::event::WindowEvent::CloseRequested => {
					*control_flow = gl::event_loop::ControlFlow::Exit;
					return;
				},
				_ => return,
			},
			_ => (),
		}
	});
}
