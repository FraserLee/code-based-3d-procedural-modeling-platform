#![feature(format_args_capture)]
use lazy_static::lazy_static;
use neon::prelude::*;
use rand::{Rng, thread_rng, seq::SliceRandom};
use std::{fs::read_to_string, convert::TryFrom};
use yaml_rust::{YamlLoader, yaml::Yaml};

lazy_static! {
	/// A hashmap-style way to access various pieces of shader-code
	static ref SHADER_ELEMENTS: Yaml = YamlLoader::load_from_str(include_str!("../shader-elements.yaml.glsl")).unwrap().remove(0);
}


fn load_vert(mut cx: FunctionContext) -> JsResult<JsString> {
	Ok(cx.string(include_str!("vert.vert")))
}

/// Called from a render layer trigger (either save as, save, open, or reload) 
/// and takes two optional parameters, the path and the buffer contents. 
///
/// If the path is not given, the cached path is used. If the buffer contents 
/// are given, they're written to the path. If the buffer contents are omitted, 
/// the path is read from. The cached path is updated to the most recent path.
/// 
/// save as	->	  buffer,	 path
/// save	->	  buffer, no path
/// open	-> no buffer,	 path
/// reload	-> no buffer, no path
/// 
/// build_shader then builds a shader using the program (buffer contents) and 
/// returns it. This is hot-reloaded by javascript.
///
/// As of the present moment, next to none of this is implemented
fn build_shader(mut cx: FunctionContext) -> JsResult<JsString> {
	let program = read_to_string("core/src/frag.frag").expect("failed at file read.");

	return Ok(cx.string(program));
}

fn build_rand_shader(mut cx: FunctionContext) -> JsResult<JsString> {
	// Generates a set of RGB values: 1.0 (giving us colours colours with a value of 1), 0.25 (setting 
	// saturation at 62%), and a random third value (controlling hue). The values are shuffled, and 
	// poured out into individual variables - all in one snazzy line.
	let mut rand = thread_rng();
	let [r, g, b] = <[f32; 3]>::try_from(vec![1f32, 0.25f32, rand.gen::<f32>()].choose_multiple(&mut rand, 3).cloned().collect::<Vec<f32>>()).ok().unwrap();
	
	// Amends and returns the head and tail of the minimal shader, with our random colour
	// sandwiched in the middle.
	return Ok(cx.string(
			format!("{head}{r:.3}, {g:.3}, {b:.3}{tail}", 
				head=&SHADER_ELEMENTS["minimal"]["head"].as_str().unwrap(), 
				tail=&SHADER_ELEMENTS["minimal"]["tail"].as_str().unwrap())
	));
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
	cx.export_function("load_vert", load_vert)?;
	cx.export_function("build_shader", build_shader)?;
	cx.export_function("build_rand_shader", build_rand_shader)?;
	Ok(())
}
