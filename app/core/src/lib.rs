use neon::prelude::*;
use yaml_rust::YamlLoader;

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
/// save as	->    buffer,    path
/// save	->    buffer, no path
/// open	-> no buffer,    path
/// reload	-> no buffer, no path
/// 
/// build_shader then builds a shader using the program (buffer contents) and 
/// returns it. This is hot-reloaded by javascript.
///
/// As of the present moment, next to none of this is implemented

fn build_shader(mut cx: FunctionContext) -> JsResult<JsString> {
	Ok(cx.string(include_str!("minimal.frag")))
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
	let shader_elements = &(YamlLoader::load_from_str(
		include_str!("../shader-elements.yaml.glsl")).unwrap())[0];

	println!("{:?}", shader_elements);

	cx.export_function("load_vert", load_vert)?;
	cx.export_function("build_shader", build_shader)?;
	Ok(())
}
