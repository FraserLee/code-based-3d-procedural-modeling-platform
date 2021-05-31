#version 330
uniform float iTime;
uniform vec2 iResolution;
out vec4 color;
void main() {
	vec2 uv = (2.0*gl_FragCoord.xy-iResolution)/min(iResolution.x, iResolution.y);
	
	float f=step(length(uv),1);

	vec3 col = vec3(f,f,f);
	color = vec4(col,1.0);
}
