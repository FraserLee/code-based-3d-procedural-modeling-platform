#version 330

float SDF(vec3 pos){
	return length(pos)-0.3;
}

vec3 calcNormal(vec3 pos){
	vec2 EPSILON = vec2(0.0001,0.0);
	return normalize(vec3(	SDF(pos+EPSILON.xyy)-SDF(pos-EPSILON.xyy),
							SDF(pos+EPSILON.yxy)-SDF(pos-EPSILON.yxy),
							SDF(pos+EPSILON.yyx)-SDF(pos-EPSILON.yyx)));
}

uniform float iTime;
uniform vec2 iResolution;
out vec4 color;
const float FOV_OFFSET = 1.73; //=1/tan(0.5*FOV)
const float FAR_PLANE = 50.0; //=1/tan(0.5*FOV)
const int RAY_ITERATIONS = 512; //=1/tan(0.5*FOV)
void main() {
	vec2 uv = (2.0*gl_FragCoord.xy-iResolution)/min(iResolution.x, iResolution.y);
	
	vec3 ray_pos = vec3(.0,.0,1.0); // 1.0≈1m
	vec3 ray_dir = normalize(vec3(uv,-FOV_OFFSET));
	vec3 ray_col = vec3(0,0,0);
	
	float ray_length = 0.0;
	for(int i=0;i<RAY_ITERATIONS;i++){
		float dist = SDF(ray_pos);
		if(dist<0.001){
			ray_col = calcNormal(ray_pos);
			break;
		}
		if(ray_length>FAR_PLANE){
			ray_col = vec3(0,0,0);
			break;
		}
		ray_pos += dist * ray_dir;
	}

	color = vec4(ray_col,1.0);
}
