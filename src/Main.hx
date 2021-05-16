import hxd.*;
import h2d.*;
class Main extends App {
    override function init() {
        super.init();
			
		var tf = new h2d.Text(hxd.res.DefaultFont.get(), s2d);
        tf.text = "test";
    }
    static function main() {
        new Main();
    }
}
