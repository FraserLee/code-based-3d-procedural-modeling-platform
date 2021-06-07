use neon::prelude::*;
use chrono;

fn load_program(mut cx: FunctionContext) -> JsResult<JsString> {
	Ok(cx.string(include_str!("frag.frag")))// include_str!("alt_test.frag")
}

fn test(mut cx: FunctionContext) -> JsResult<JsString> {
	Ok(cx.string(format!("This is being updated live from rust. The current time-stamp is {}", &chrono::offset::Local::now().to_string())))
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
	cx.export_function("test", test)?;
	cx.export_function("load_program", load_program)?;
	Ok(())
}
