#version 300 es
precision highp float;

// A way of packaging together distance information with an object identifier 
// (uint standing in for an enum). Possibly expand to include more information 
// (blending, etc) later, though it'll be tough without even so much as a 
// c-union, never-mind something like rust-enums.
#define SKY_MAT	0u
#define MATTE_MAT  1u
#define ORANGE_MAT 2u
#define GREEN_MAT  3u
#define LIGHT_MAT  4u
struct DistIden{
	float dist;
	uint  iden;
};

// speed isn't particularly important rn, so I'm going with an exponential 
// implementation for commutability. We can change this later for RTRT.  
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

#define RAY_ITERATIONS 512 // set via macro
DistIden raycast(vec3 rayOrg, vec3 rayDir, float maxDist){
	float rayLength = 0.0;
	DistIden query;
	for(int i=0;i<RAY_ITERATIONS;i++){
		query = DI_WORLD(rayOrg + rayLength * rayDir);
		if(query.dist<0.001) break;
		if(rayLength>maxDist){
			query.iden = SKY_MAT;
			break;
		}
		rayLength += query.dist;
	}
	query.dist = rayLength;
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

// In the future this can be expanded to possibly take more parameters 
// (position, normal, incident ray angle, etc)
vec3 renderMaterial(uint mat_iden){ 
	vec3 matte = vec3(0.2);
		switch(mat_iden){
			case ORANGE_MAT:
				matte *= vec3(1.0,0.5,0.0);
				break;
			case GREEN_MAT:
				matte *= vec3(0.0,1.0,0.16);
				break;
		}
	return matte;
}

const vec3 sun_dir = normalize(vec3(-0.03,0.5,0.5));






#define FAR_PLANE 5000.0 // set via macro, optionally non-existent via macro
#define DEPTH 6

vec3 render(vec3 pos, vec3 dir){
	DistIden ray = raycast(pos, dir, FAR_PLANE);

	if(ray.iden == SKY_MAT)
		return skyColour(dir);
	

	pos += ray.dist * dir;
	dir = calcNormal(pos);
		
	float ambient 		= clamp(1.0-dir.y,0.25,2.0)*0.4;
	ambient 			+=clamp(1.0-dir.x,0.0 ,2.0)*0.1;
	float sun_diffuse	= clamp(dot(sun_dir,dir),0.0,1.0);
	float sun_shadow	= (raycast(pos+dir*0.001, sun_dir, FAR_PLANE).iden==SKY_MAT)?1.0:0.0;

	return renderMaterial(ray.iden)*(vec3(1, 0.980, 0.839)*6.0*sun_shadow*sun_diffuse+ambient*vec3(1, 0.95, 0.93)*1.2);
}






//--<RANDOM>--------------------------------------------------------------------
	
	// I'm about 60% sure random's originally from the book of shaders, though I've
	// seen it used literally everywhere 
	float rand_base(vec2 co){
		return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
	}

	// A few quick wrapper functions, probably could be faster if I put more time into it.
	// These should be made so tweaking any component in gives an unpredictably 
	// different out on all components.
	float rand_f(vec2 uv, float time, int rayNum){
		return rand_base(vec2(rand_base(vec2(rand_base(uv), time)),rayNum));
	}
	vec2 rand_2f(vec2 uv, float time, int rayNum){
		return vec2(rand_f(uv.xy, time, rayNum), 
					rand_f(uv.yx, time, rayNum));
	}

//--</RANDOM>-------------------------------------------------------------------


mat4x3 cameraMatrix(float time){
	// this following 4 var system is temporary, will be turned into a proper set of uniforms with full control later.

	vec3  subjectPos	= vec3(0.0, -0.3, 0.0); 
	float yawAngle	  = -0.2;// + sin(time*0.347)*0.05;
	float subjectXZDist = 2.0; 
	float subjectYDist  = 0.6; // + sin(time*0.6)*0.1;

	//cameraPointingVec
	vec3 cpv = vec3(subjectXZDist*cos(yawAngle), subjectYDist, subjectXZDist*sin(yawAngle));
	vec3 cpv_n = normalize(cpv);

	vec3 x = normalize(vec3(cpv_n.z, 0.0, -cpv_n.x));
	return mat4x3(subjectPos + cpv, x, cross(cpv_n,x), -cpv_n);
}

layout(std140) uniform uniforms {
	float iTime;
	float iFrameLength;
	ivec2 iResolution;
};

out vec4 fragColor;
#define FOV_OFFSET 1.64 //=1/tan(0.5*FOV)
#define FOCUS_DIST 3.0
#define BLUR_AMOUNT 0.02
#define RAYS_PER_PIX 16//256	// convert to uniform, set dynamically to keep app responsive with minimal rendering calls


// Overall design archetecture is a montecarlo path tracer, with sphere-marching
// a combined world sdf as the intersection function. Design is inspired by 
// iquilezles' 2012 article "Simple Pathtracing" and the 2003 book "Global 
// Illumination Compendium" by Philip Dutré, with a number of modifications of 
// my own.
void main() {
	vec3 col = vec3(0);

	for(int i=0;i<RAYS_PER_PIX;i++){
		// AA within pixel
		vec2 uv = (2.0*(gl_FragCoord.xy+rand_2f(gl_FragCoord.xy, iTime, i)-0.5)
			-vec2(iResolution))/float(min(iResolution.x, iResolution.y));
		// motion blur
		float time = iTime + rand_f(uv, iTime, i)*iFrameLength;

		//<Camera with DOF (random offset of rayOrg on uv plane)>
			mat4x3 camM = cameraMatrix(time);
			
			vec3 uv3 = normalize(vec3(uv, FOV_OFFSET));

			vec3 randOffset = BLUR_AMOUNT*vec3(2.0*rand_2f(uv, time, i)-1.0, 0);
			vec3 randDir    = normalize(uv3*FOCUS_DIST - randOffset);

			vec3 rayOrg = camM[0] + randOffset.x*camM[1] + randOffset.y*camM[2];
			vec3 rayDir = normalize((uv3.x+randDir.x)*camM[1] + (uv3.y+randDir.y)*camM[2] + uv3.z*camM[3]);
		//</Camera>

		col += render(rayOrg, normalize(rayDir));
	}
	col /= float(RAYS_PER_PIX);
	
	col = pow(col,vec3(0.4545)); // gamma correction
	
	fragColor = vec4(col,1.0);
}
