use neon::prelude::*;
use chrono;

fn test(mut cx: FunctionContext) -> JsResult<JsString> {
	Ok(cx.string(format!("<br><i>This</i>, to contrast, is being updated live from rust. The current time-stamp is {}", &chrono::offset::Local::now().to_string())))
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
	cx.export_function("test", test)?;
	Ok(())
}
