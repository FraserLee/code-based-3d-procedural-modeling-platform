#version 300 es
precision mediump float; // TODO: possibly manually swap precision for pre-rendered vs live modes.

float SDF_WORLD(vec3 pos){
	return min(length(vec3(pos.x, pos.y-0.495, pos.z))-0.5,pos.y);
}

const int RAY_ITERATIONS = 512; // set via macro
const float FAR_PLANE = 5000.0; // set via macro, optionally non-existent via macro
float raycast(vec3 ray_org, vec3 rayDir){
	float ray_length = 0.0;
	for(int i=0;i<RAY_ITERATIONS;i++){
		float dist = SDF_WORLD(ray_org + ray_length * rayDir);
		if(dist<0.001) break;
		if(ray_length>FAR_PLANE){
			ray_length=-1.;
			break;
		}
		ray_length += dist;
	}
	return ray_length;
}

// using iq's "tetrahedron technique"
vec3 calcNormal(vec3 pos){
	vec2 EPSILON = 0.0001*vec2(1,-1);
	return normalize(EPSILON.xyy*SDF_WORLD(pos+EPSILON.xyy)+ 
					 EPSILON.yyx*SDF_WORLD(pos+EPSILON.yyx)+ 
					 EPSILON.yxy*SDF_WORLD(pos+EPSILON.yxy)+ 
					 EPSILON.xxx*SDF_WORLD(pos+EPSILON.xxx));	
}


vec3 skyColour(vec3 dir){
	return vec3(0.639, 0.941, 1) - dir.y * 0.63;
}

const vec3 sun_dir = normalize(vec3(0.3,0.5,0.7));
const vec3 mate = vec3(0.2);

vec3 render(vec3 pos, vec3 dir){
	vec3 col = skyColour(dir);
	
	float rayLength = raycast(pos, dir);
	if(rayLength > 0.0){
		pos += rayLength * dir;
		vec3 normal = calcNormal(pos);
		
		float sun_diffuse	= clamp(dot(sun_dir,normal),0.0,1.0);
		float sun_shadow	= step(raycast(pos+normal*0.001, sun_dir),0.0);
		float light_shadow	= step(raycast(pos+normal*0.001, -normalize(pos)),0.0)*0.5+0.5;
		float light_diffuse	= clamp(0.75/length(pos),0.0,1.0);
		
		col =  mate*vec3(1.0, 0.1, 0.709)*2.3*sun_shadow*sun_diffuse;
		col += mate*vec3(0.0, 1.0, 0.584)*6.0*light_shadow*light_diffuse;
		// col = mix(vec3(0.5), col, clamp(pow(0.9995, ray_length-10.0),0.0,1.0));
	}
	return col;
}

mat3 cameraMatrix(vec3 cameraPointingVec){
	vec3 x = normalize(vec3(cameraPointingVec.z, 0.0, -cameraPointingVec.x));
	return mat3(x, cross(cameraPointingVec,x), -cameraPointingVec);
}

layout(std140) uniform uniforms {
	float iTime;
	ivec2 iResolution;
};

out vec4 fragColor;
const float FOV_OFFSET = 1.73; //=1/tan(0.5*FOV)

void main() {
	//<Camera>
	vec2 uv = (2.0*gl_FragCoord.xy-vec2(iResolution))/float(min(iResolution.x, iResolution.y));

	// this following 4 var system is temporary, will be turned into a proper set of uniforms with more control later.
		vec3  subjectPos    = vec3(0, 0.25, 0); 
		float yawAngle      = iTime*0.2;
		float subjectXZDist = 2.0; // 1.0≈1m
		float subjectYDist  = 1.0;
	vec3 rayOrg = subjectPos + vec3(subjectXZDist*cos(yawAngle), subjectYDist, subjectXZDist*sin(yawAngle));
	vec3 rayDir = cameraMatrix(normalize(rayOrg - subjectPos)) * normalize(vec3(uv, FOV_OFFSET));
	//</Camera>

	vec3 col = render(rayOrg, rayDir);
	
	col = pow(col,vec3(0.4545)); // gamma correction
	
	fragColor = vec4(col,1.0);
}


