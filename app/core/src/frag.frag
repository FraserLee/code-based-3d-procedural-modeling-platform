#version 300 es
precision highp float;

#define SKY_MAT    0u
#define MATTE_MAT  1u
#define ORANGE_MAT 2u
#define GREEN_MAT  3u
#define LIGHT_MAT  4u

struct DistIden{
	float dist;
	uint  iden;
};

float smin(float a, float b, float k){
	return -log2(exp2(-k*a) + exp2(-k*b))/k;
}
float smax(float a, float b, float k){
	return log2(exp2(k*a) + exp2(k*b))/k;
}

#define windowPeriod 3.0
#define boxwidth 3.0
#define boxheight 1.5
#define boxthickness 0.1

#define ENABLE_boxroundness 0
#define boxroundness 0.0

float SDF_SPHERE(vec3 pos, float r){
	return length(pos)-r;
}

float SDF_BOXTUBE(vec3 pos){
	vec2 q2 = abs(pos.yz) - vec2(boxheight/2.0, boxwidth/2.0);
	float d_tube = abs(length(max(q2,0.0)) + min(max(q2.x,q2.y),0.0)-boxroundness*3.0) - boxthickness;
	vec3 q3 = abs(vec3(mod(pos.x, windowPeriod)-windowPeriod*0.5, pos.y-boxheight/2.0, pos.z)) - vec3(0.5,0.5,0.5);
	float d_hole = length(max(q3,0.0)) + min(max(q3.x,max(q3.y,q3.z)),0.0)-boxroundness;
#if ENABLE_boxroundness == 0
	return max(d_tube, -d_hole);
#else
	return smax(d_tube, -d_hole, 50.0);
#endif
}

DistIden DI_MIN(DistIden a, DistIden b){
	// return a.dist < b.dist ? a : b; doesn't work in GLSL for some reason, but this is basically that.
	if(a.dist < b.dist) return a; return b;
}

DistIden DI_SMIN(DistIden a, DistIden b, float k){
	DistIden di;
	di.dist = -log2(exp2(-k*a.dist) + exp2(-k*b.dist))/k;
	di.iden = a.dist < b.dist ? a.iden : b.iden;
	return di;
}

DistIden DI_WORLD(vec3 pos){
	float d_sphere1   = SDF_SPHERE(vec3(mod(pos.x,2.62)-1.31, pos.y+0.6, pos.z+1.25), 0.85);
	float d_sphere2   = SDF_SPHERE(vec3(mod(pos.x-4.0,11.0)-5.5, pos.y-0.35, pos.z-1.1), 0.25);
	float d_left_wall = max(1.35-pos.z, abs(pos.y)-boxheight/2.0-boxthickness-0.1);
	float d_boxtube   = SDF_BOXTUBE(pos);

	DistIden di;

	di.iden = MATTE_MAT; // as either option on this junction uses MATTE
	di.dist = smin(d_boxtube, d_sphere1, 12.0);
	
	di.iden = d_sphere2 < di.dist ? ORANGE_MAT : di.iden;
	di.dist = min(d_sphere2, di.dist);
	
	di.iden = d_left_wall < di.dist ? GREEN_MAT : di.iden;
	di.dist = min(d_left_wall, di.dist);

	return di;
}

const int RAY_ITERATIONS = 512; // set via macro
const float FAR_PLANE = 10000.0; // set via macro, optionally non-existent via macro
DistIden raycast(vec3 ray_org, vec3 rayDir){
	float ray_length = 0.0;
	DistIden query;
	for(int i=0;i<RAY_ITERATIONS;i++){
		query = DI_WORLD(ray_org + ray_length * rayDir);
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
	return normalize(EPSILON.xyy*DI_WORLD(pos+EPSILON.xyy).dist+ 
					 EPSILON.yyx*DI_WORLD(pos+EPSILON.yyx).dist+ 
					 EPSILON.yxy*DI_WORLD(pos+EPSILON.yxy).dist+ 
					 EPSILON.xxx*DI_WORLD(pos+EPSILON.xxx).dist);	
}


vec3 skyColour(vec3 dir){
	return vec3(0.639, 0.941, 1) - dir.y * 0.63;
}

const vec3 sun_dir = normalize(vec3(-0.03,0.5,0.5));

vec3 render(vec3 pos, vec3 dir){
	vec3 col = skyColour(dir);
	
	DistIden ray = raycast(pos, dir);
	if(ray.iden != SKY_MAT){
		pos += ray.dist * dir;
		vec3 normal = calcNormal(pos);
		
		float ambient 		= clamp(1.0-normal.y,0.25,2.0)*0.4;
		ambient 			+=clamp(1.0-normal.x,0.0 ,2.0)*0.1;
		float sun_diffuse	= clamp(dot(sun_dir,normal),0.0,1.0);
		float sun_shadow	= (raycast(pos+normal*0.001, sun_dir).iden==SKY_MAT)?1.0:0.0;
		vec3 matte = vec3(0.2);
		switch(ray.iden){
			case ORANGE_MAT:
				matte *= vec3(1.0,0.5,0.0);
				break;
			case GREEN_MAT:
				matte *= vec3(0.0,1.0,0.16);
				break;
		}
		
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
const float FOV_OFFSET = 1.64; //=1/tan(0.5*FOV)

void main() {
	//<Camera>
	vec2 uv = (2.0*gl_FragCoord.xy-vec2(iResolution))/float(min(iResolution.x, iResolution.y));
	// 1.0≈1m
	// this following 4 var system is temporary, will be turned into a proper set of uniforms with more control later.
		vec3  subjectPos    = vec3(0.0, -0.3, 0.0); 
		float yawAngle      = -0.2;// + sin(iTime*0.347)*0.05;
		float subjectXZDist = 2.0; 
		float subjectYDist  = 0.6; // + sin(iTime*0.6)*0.1;
	vec3 rayOrg = subjectPos + vec3(subjectXZDist*cos(yawAngle), subjectYDist, subjectXZDist*sin(yawAngle));
	vec3 rayDir = cameraMatrix(normalize(rayOrg - subjectPos)) * normalize(vec3(uv, FOV_OFFSET));
	//</Camera>

	vec3 col = render(rayOrg, rayDir);
	
	col = pow(col,vec3(0.4545)); // gamma correction
	
	fragColor = vec4(col,1.0);
}