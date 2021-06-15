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
	fragColor = texture(texture_in, gl_FragCoord.xy/vec2(iResolution));
}