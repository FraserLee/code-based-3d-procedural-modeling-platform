#version 300 es
precision mediump float; // TODO: possibly manually swap precision for pre-rendered vs live modes.

#define SKY_MAT    0u;
#define MATTE_MAT  1u;
#define ORANGE_MAT 2u;
#define GREEN_MAT  3u;
#define LIGHT_MAT  4u;

struct DistIden{
	float dist;
	uint  iden;
};

DistIden SDF_SPHERE1(vec3 pos){
	DistIden di;
	di.dist = length(vec3(pos.x, pos.y-0.65, pos.z))-0.5;
	di.iden = MATTE_MAT;
	return di;
}
DistIden SDF_GROUND(vec3 pos){
	DistIden di;
	di.dist = pos.y;
	di.iden = GREEN_MAT;
	return di;
}

DistIden SDF_MIN(DistIden a, DistIden b){
	// return a.dist < b.dist ? a : b; doesn't work in GLSL for some reason..
	if(a.dist < b.dist) return a; return b;
}

DistIden SDF_SMIN(DistIden a, DistIden b, float k){
	DistIden di;
	di.dist = -log2(exp2(-k*a.dist) + exp2(-k*b.dist))/k;
	di.iden = a.dist < b.dist ? a.iden : b.iden;
	return di;
}

DistIden SDF_WORLD(vec3 pos){
	return SDF_SMIN(SDF_SPHERE1(pos), SDF_GROUND(pos), 8.0);
}

const int RAY_ITERATIONS = 512; // set via macro
const float FAR_PLANE = 10000.0; // set via macro, optionally non-existent via macro
DistIden raycast(vec3 ray_org, vec3 rayDir){
	float ray_length = 0.0;
	DistIden query;
	for(int i=0;i<RAY_ITERATIONS;i++){
		query = SDF_WORLD(ray_org + ray_length * rayDir);
		if(query.dist<0.001) break;
		if(ray_length>FAR_PLANE){
			query.iden = SKY_MAT;
			break;
		}
		ray_length += query.dist;
	}
	query.dist = ray_length;
	return query;
}

// using iq's "tetrahedron technique"
vec3 calcNormal(vec3 pos){
	vec2 EPSILON = 0.0001*vec2(1,-1);
	return normalize(EPSILON.xyy*SDF_WORLD(pos+EPSILON.xyy).dist+ 
					 EPSILON.yyx*SDF_WORLD(pos+EPSILON.yyx).dist+ 
					 EPSILON.yxy*SDF_WORLD(pos+EPSILON.yxy).dist+ 
					 EPSILON.xxx*SDF_WORLD(pos+EPSILON.xxx).dist);	
}


vec3 skyColour(vec3 dir){
	return vec3(0.639, 0.941, 1) - dir.y * 0.63;
}

const vec3 sun_dir = normalize(vec3(0.3,0.5,0.7));
const vec3 matte = vec3(0.2);

vec3 render(vec3 pos, vec3 dir){
	vec3 col = skyColour(dir);
	
	DistIden ray = raycast(pos, dir);
	if(ray.iden != SKY_MAT){
		pos += ray.dist * dir;
		vec3 normal = calcNormal(pos);
		
		float ambient 		= clamp(1.0-normal.y,0.25,2.0)*0.5;
		float sun_diffuse	= clamp(dot(sun_dir,normal),0.0,1.0);
		float sun_shadow	= (raycast(pos+normal*0.001, sun_dir).iden==SKY_MAT)?1.0:0.0;
		
		col =  matte*(vec3(1, 0.980, 0.839)*6.0*sun_shadow*sun_diffuse+ambient*vec3(1, 0.95, 0.93)*1.2);
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


