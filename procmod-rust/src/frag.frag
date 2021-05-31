#version 330
uniform float iTime;
uniform vec2 iResolution;
out vec4 color;
void main() {
	vec2 uv = gl_FragCoord.xy/iResolution;
	vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
	color = vec4(col,1.0);
	// color = vec4(uv,1.0,1.0);
}
