#version 330

float SDF_WORLD(vec3 pos){
	return max(0.65-length(mod(pos+vec3(0.5),vec3(1.0))-vec3(0.5)),pos.y);
}

// using iq's "tetrahedron technique"
vec3 calcNormal(vec3 pos){
	vec2 EPSILON = 0.0001*vec2(1,-1);
	return normalize(EPSILON.xyy*SDF_WORLD(pos+EPSILON.xyy)+ 
					 EPSILON.yyx*SDF_WORLD(pos+EPSILON.yyx)+ 
					 EPSILON.yxy*SDF_WORLD(pos+EPSILON.yxy)+ 
					 EPSILON.xxx*SDF_WORLD(pos+EPSILON.xxx));	
}


const float FAR_PLANE = 5000.0; //=1/tan(0.5*FOV)
const int RAY_ITERATIONS = 512; //=1/tan(0.5*FOV)
float raycast(vec3 ray_org, vec3 ray_dir){
	float ray_length = 0.0;
	for(int i=0;i<RAY_ITERATIONS;i++){
		float dist = SDF_WORLD(ray_org + ray_length * ray_dir);
		if(dist<0.001) break;
		if(ray_length>FAR_PLANE){
			ray_length=-1;
			break;
		}
		ray_length += dist;
	}
	return ray_length;
}

mat3 rotMatrix(vec2 angles){
	vec2 s = sin(angles);
	vec2 c = cos(angles);
	return mat3 (c.x, -s.x*s.y, -s.x*c.y,
					0.0, c.y, -s.y,
					s.x, c.x*s.y, c.x*c.y);
}

uniform float iTime;
uniform vec2 iResolution;
out vec4 color;
const float FOV_OFFSET = 1.73; //=1/tan(0.5*FOV)
const vec3 sun_dir = normalize(vec3(0.3,0.5,0.7));
const vec3 mate = vec3(0.2);
void main() {
	vec2 uv = (2.0*gl_FragCoord.xy-iResolution)/min(iResolution.x, iResolution.y);
	
	vec3 ray_pos = vec3(-1.8,2.5-0.3*iTime,2.7); // 1.0≈1m
	vec3 ray_dir = rotMatrix(vec2(0.2-0.1*iTime,0.3)) * normalize(vec3(uv,-FOV_OFFSET));
	vec3 ray_col = vec3(ray_dir.y);
	
	float ray_length = raycast(ray_pos, ray_dir);
	if(ray_length > 0){
		ray_pos += ray_length * ray_dir;
		vec3 normal = calcNormal(ray_pos);
		
		float sun_diffuse	= clamp(dot(sun_dir,normal),0,1);
		float sun_shadow	= step(raycast(ray_pos+normal*0.001, sun_dir),0);
		float light_shadow	= step(raycast(ray_pos+normal*0.001, -normalize(ray_pos)),0)*0.5+0.5;
		float light_diffuse	= clamp(0.75/length(ray_pos),0,1);
		
		ray_col =  mate*vec3(7,4,11)*0.5*sun_shadow*sun_diffuse;
		ray_col += mate*vec3(2.3, 1.7, 1.2)*10*light_shadow*light_diffuse;
	}
	
	/* glium performs gamma correction for me through the "outputs_srgb: true" flag in the program macro.
	 * If I swap engines and need to manually enable gamma correction, the following line is how I'd do it */
	// ray_col = pow(ray_col,vec3(0.4545));
	
	color = vec4(ray_col,1.0);
}
