#version 300 es
precision highp float;

// Overall design architecture is a montecarlo path tracer, with sphere-marching
// a combined world sdf as the intersection function. Design is inspired by 
// iquilezles' 2012 article "Simple Pathtracing", the 2003 book "Global 
// Illumination Compendium" by Philip Dutré, and the path tracing wikipedia 
// page - with a number of modifications of my own.

//--<UNIFORMS>------------------------------------------------------------------
	layout(std140) uniform uniforms {
		float iTime;
		float iFrameLength;
		ivec2 iResolution;
		float iRenderFrameNum;
	};
//--</UNIFORMS>-----------------------------------------------------------------

//--<RANDOM>--------------------------------------------------------------------
	#define UV_NOISE 1
	// Rand functions postfixed with _tuv are generally for scattering, take UVs 
	// as a seed (which may or may not be used depending on a define), and use  
	// an internal time-based seed.

	// I'm about 60% sure random's originally from the book of shaders, though I've
	// seen it used literally everywhere 
	float rand_base_uv(float x, vec2 uv){
		#if UV_NOISE == 1
			return fract(sin(dot(vec3(uv, x), vec3(12.9898, 78.233, 47.2964))) * 43758.5453);
		#else
			return fract(sin(x) * 43758.5453);
		#endif
	}

	// TODO: after multi-frame average is implemented don't seed with uvs, 
	// instead swap to a per-frame seed supplied via uniform (so real frames 
	// still drive when animation's paused) 

	// A few quick wrapper functions, probably could be faster if I put more time into it.
	// These should be made so tweaking any component in gives an unpredictably 
	// different out on all components.
	float rand_f_tuv(vec2 seed){
		return rand_base_uv(iRenderFrameNum, seed);
	}
	vec2 rand_2f_tuv(vec2 seed){
		return vec2(rand_base_uv(iRenderFrameNum, seed), 
					rand_base_uv(iRenderFrameNum+3341.23138, seed));
	}
	vec2 rand_unitCircle_tuv(vec2 seed){ // uniform (in theory)
		vec2 r = rand_2f_tuv(seed);
		r.x *= 6.2831853;
		return sqrt(r.y) * vec2(cos(r.x), sin(r.x));
	}
	vec3 rand_disk_tuv(vec3 nor, vec2 seed){
		vec3 u = vec3(0, -nor.z, nor.y);
		vec3 v = vec3(nor.y*nor.y+nor.z*nor.z, -nor.x*nor.y, -nor.x*nor.z);
		vec2 p = rand_unitCircle_tuv(seed);
		return u*p.x+v*p.y;
	}

	// fizzer's tan-less method (http://www.amietia.com/lambertnotangent.html)
	vec3 cosDir_tuv(vec3 nor, vec2 seed){
		vec2 r = rand_2f_tuv(seed);
		r.x *= 6.2831853;
		r.y = 2.0*r.y-1.0;
		return normalize(nor + vec3(sqrt(1.0-r.y*r.y) * 
			vec2(cos(r.x), sin(r.x)), r.y));
	}
	// from wolfram-alpha, maybe could be faster.
	vec3 hemiSphereDir_tuv(vec3 nor, vec2 seed){
		vec2 r = rand_2f_tuv(seed);
		r.x *= 6.2831853;
		r.y = acos(2.0*r.y-1.0);
		return normalize(nor + vec3(sqrt(1.0-r.y*r.y) * 
			vec2(cos(r.x), sin(r.x)), r.y));
	}
//--</RANDOM>-------------------------------------------------------------------

//--<DATA TYPES>----------------------------------------------------------------
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
//--</DATA TYPES>---------------------------------------------------------------

//--<DISTANCE FUNCTIONS>--------------------------------------------------------
	// speed isn't particularly important rn, so I'm going with an exponential 
	// implementation for commutability. We can change this later for RTRT.  
	float smin(float a, float b, float k){
		return -log2(exp2(-k*a) + exp2(-k*b))/k;
	}
	float smax(float a, float b, float k){
		return log2(exp2(k*a) + exp2(k*b))/k;
	}
	float SDF_SPHERE(vec3 pos, float r){
		return length(pos)-r;
	}

	#define windowPeriod 3.0
	#define boxwidth 3.0
	#define boxheight 1.5
	#define boxthickness 0.1

	#define ENABLE_boxroundness 0
	#define boxroundness 0.0

	#define holewidth 0.5 // 0.5
	float SDF_BOXTUBE(vec3 pos){
		vec2 q2 = abs(pos.yz) - vec2(boxheight/2.0, boxwidth/2.0);
		float d_tube = abs(length(max(q2,0.0)) + min(max(q2.x,q2.y),0.0)-boxroundness*3.0) - boxthickness;
		vec3 q3 = abs(vec3(mod(pos.x, windowPeriod)-windowPeriod*0.5, pos.y-boxheight/2.0, pos.z)) - vec3(holewidth,0.5,holewidth);
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
		
		di.iden = d_boxtube < d_sphere1 ?  MATTE_MAT : ORANGE_MAT;
		di.dist = smin(d_boxtube, d_sphere1, 12.0);
		
		di.iden = d_sphere2 < di.dist ? GREEN_MAT : di.iden;
		di.dist = min(d_sphere2, di.dist);
		
		di.iden = d_left_wall < di.dist ? MATTE_MAT : di.iden;
		di.dist = min(d_left_wall, di.dist); 
		
		return di;
	}
//--</DISTANCE FUNCTIONS>-------------------------------------------------------

//--<WORLD-RENDERER INTERFACE>--------------------------------------------------
	#define SPHEREMARCH_ITERATIONS 512 // set via macro
	DistIden raycast(vec3 rayOrg, vec3 rayDir, float maxDist){
		float rayLength = 0.0;
		DistIden query;
		for(int i=0;i<SPHEREMARCH_ITERATIONS;i++){
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

	// using IQ's "tetrahedron technique"
	vec3 calcNormal(vec3 pos){
		vec2 EPSILON2 = 0.0001*vec2(1,-1);
		return normalize(EPSILON2.xyy*DI_WORLD(pos+EPSILON2.xyy).dist+ 
						 EPSILON2.yyx*DI_WORLD(pos+EPSILON2.yyx).dist+ 
						 EPSILON2.yxy*DI_WORLD(pos+EPSILON2.yxy).dist+ 
						 EPSILON2.xxx*DI_WORLD(pos+EPSILON2.xxx).dist);	
	}

	// occlusion-only version of raycast (0.0 for hit, 1.0 for miss)
	// once I'm generating shaders through code, write this as a separate 
	// implementation to save from unnecessarily calculating identifiers.
	float raycastOcc(vec3 rayOrg, vec3 rayDir, float maxDist){
		return (raycast(rayOrg, rayDir, maxDist).iden==SKY_MAT)?1.0:0.0;
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
//--</WORLD-RENDERER INTERFACE>-------------------------------------------------

//--<RENDERER>------------------------------------------------------------------
	#define FAR_PLANE 5000.0 // set via macro, optionally non-existent via macro

	const vec3 sun_dir = normalize(vec3(-0.03,0.5,0.5));
	// general direct-lighting function
	vec3 worldLighting(vec3 pos, vec3 nor, vec2 seed){
		// Procedure: for every (easy) light in the scene (including the sun and 
		// sky), pick a random point on the surface of the light (weighted even in 
		// regards to area from the perspective of pos). Calculate the Lambert (dot 
		// product) lighting, and perform a direct occlusion test (with the light's 
		// distance as the max dist). Add this to a running total.
		vec3 col = vec3(0.0);
		{	// sky -----------
			// importance sampling: cosign weighted random means the dot product is baked into the distribution (and it's way faster).
			vec3 dir = cosDir_tuv(nor, seed);
			col += skyColour(dir) * raycastOcc(pos, dir, FAR_PLANE);
		}{	// sun -----------
			vec3  src	  = 1000.0 * sun_dir + 50.0 * rand_disk_tuv(nor, seed);
			vec3  dir	  = normalize(src - pos);
			float lambert = max(0.0, dot(dir, nor));
			col += (vec3(1, 0.976, 0.929)*20.0) * lambert * raycastOcc(pos, dir, FAR_PLANE);
		}	//    ------------
		return col;
	}

	#define EPSILON1 0.001;
	#define DEPTH 6
	vec3 render(vec3 pos, vec3 dir, vec2 seed){
		vec3 summed = vec3(0.0);
		vec3 factional = vec3(1.0);
		
		for(int i=0;i<DEPTH;i++){
			DistIden ray = raycast(pos, dir, FAR_PLANE);
			// fall out criteria
			if(ray.iden == SKY_MAT) {
			   if(i==0) return skyColour(dir);
			   break;
			}
			//update normal and pos
			pos += ray.dist * dir;
			vec3 nor = calcNormal(pos);
			// nudge so next raycast doesn't just immediately return a hit
			// (if very large scale things don't work make this dependent on dist from cam (|pos| if org = 0))
			pos += nor * EPSILON1; 

			// loop unpacks to surface_1(direct_1 + surface_2(direct_2 + surface_3(direct_3 + ... ) ) )
			// (same as recursive approach)
			factional *= renderMaterial(ray.iden);
			summed += factional * worldLighting(pos, nor, seed);
			// currently random weight, possibly change later to allow for shiny mats
			dir = cosDir_tuv(nor, seed);
		}
		return summed;
	}
//--</RENDERER>-----------------------------------------------------------------

//--<IMAGE>---------------------------------------------------------------------
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

	out vec4 fragColor;
	#define FOV_OFFSET 1.64 //=1/tan(0.5*FOV)
	#define FOCUS_DIST 1.7
	#define BLUR_AMOUNT 0.01

	uniform sampler2D last_frame;
	void main() {
		
		vec3 col = vec3(0);
		{
			// AA within pixel
			vec2 uv = (2.0*(gl_FragCoord.xy+rand_2f_tuv(gl_FragCoord.xy)-0.5)
				-vec2(iResolution))/float(min(iResolution.x, iResolution.y));
			// motion blur
			float time = iTime + rand_f_tuv(uv)*iFrameLength;

			//<Camera with DOF (random offset of rayOrg on uv plane)>
				mat4x3 camM = cameraMatrix(time);
				
				vec3 uv3 = normalize(vec3(uv, FOV_OFFSET));

				vec3 randOffset = BLUR_AMOUNT*vec3(2.0*rand_2f_tuv(uv)-1.0, 0);
				vec3 randDir	= normalize(uv3*FOCUS_DIST - randOffset);

				vec3 rayOrg = camM[0] + randOffset.x*camM[1] + randOffset.y*camM[2];
				vec3 rayDir = normalize((uv3.x+randDir.x)*camM[1] + (uv3.y+randDir.y)*camM[2] + uv3.z*camM[3]);
			//</Camera>

			col = render(rayOrg, normalize(rayDir), uv);
		}
		
		vec4 data = texture(last_frame, gl_FragCoord.xy/vec2(iResolution));
		fragColor = data + vec4(col,1.0);
	}
//--</IMAGE>---------------------------------------------------------------------