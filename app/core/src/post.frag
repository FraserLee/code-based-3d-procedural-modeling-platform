#version 300 es
precision highp float;

layout(std140) uniform uniforms {
	float iTime;
	float iFrameLength;
	ivec2 iResolution;
	float iRenderFrameNum;
};
uniform sampler2D texture_in;

out vec4 fragColor;
void main() {
	vec4 data = texture(texture_in, gl_FragCoord.xy/vec2(iResolution));
	vec3 col = data.xyz / data.w;
	col = pow(col,vec3(0.4545)); // gamma correction

	fragColor = vec4(col, 1.0);
}