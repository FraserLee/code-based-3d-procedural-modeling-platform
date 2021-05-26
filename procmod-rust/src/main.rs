extern crate sdl2;

use sdl2::pixels::Color;
use sdl2::event::Event;
use std::time::Duration;

pub fn main() {
	let sdl_context = sdl2::init().unwrap();
	let video_subsystem = sdl_context.video().unwrap();

	let (width, height) = (1200u32, 600u32);
	let window = video_subsystem.window("procmodl", width, height)
		.position_centered()
		.build()
		.unwrap();

	let mut canvas = window.into_canvas().build().unwrap();
	
	canvas.set_draw_color(Color::RGB(18, 20, 23));
	canvas.clear();
	canvas.present();
	
	let mut event_pump = sdl_context.event_pump().unwrap();
	'running: loop {
		canvas.clear();
		for event in event_pump.poll_iter() {
			match event {
				Event::Quit {..} => {
					break 'running
				},
				_ => {}
			}
		}
		// The rest of the game loop goes here...

		canvas.present();
		::std::thread::sleep(Duration::new(0, 1_000_000_000u32 / 60)); // TODO: simple adaptive sleep time
	}
}
