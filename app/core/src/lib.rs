use neon::prelude::*;
use chrono;

fn load_vert(mut cx: FunctionContext) -> JsResult<JsString> {
	Ok(cx.string(include_str!("vert.vert")))
}
fn load_frag(mut cx: FunctionContext) -> JsResult<JsString> {
	Ok(cx.string(include_str!("frag.frag")))// include_str!("alt_test.frag")
}

fn test(mut cx: FunctionContext) -> JsResult<JsString> {
	Ok(cx.string(format!("This is being updated live from rust. The current time-stamp is {}", &chrono::offset::Local::now().to_string())))
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
	cx.export_function("test", test)?;
	cx.export_function("load_vert", load_vert)?;
	cx.export_function("load_frag", load_frag)?;
	Ok(())
}
