---
overall:
  head: |
    #version 300 es
    precision mediump float; // TODO: possibly manually swap precision for pre-rendered vs live modes.
main:
  head: |
    layout(std140) uniform uniforms {
    	float iTime;
    	ivec2 iResolution;
    };
    out vec4 fragColor;
    void main() {
    	vec2 uv = (2.0*gl_FragCoord.xy-vec2(iResolution))/float(min(iResolution.x, iResolution.y));	
  tail: |
    	fragColor = vec4(uv,0.0,1.0);
    }