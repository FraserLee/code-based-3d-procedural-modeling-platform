use neon::prelude::*;
use chrono;

fn test(mut cx: FunctionContext) -> JsResult<JsString> {
	// println!("{:?}", chrono::offset::Local::now());	
	Ok(cx.string("TODO: time string here"))
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
	cx.export_function("test", test)?;
	Ok(())
}
