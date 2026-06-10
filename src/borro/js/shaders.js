// BORRO — GLSL shaders (gaussian blur + film grain).

export const baseVert = `#version 300 es
	in vec3 aPosition;
	in vec2 aTexCoord;
	out vec2 vTexCoord;

	void main() {
		vTexCoord = aTexCoord;
		gl_Position = vec4(aPosition.xy*2.-1., aPosition.z, 1.);
	}
`;

//////////////////////////

export const blurFrag = `#version 300 es
	precision mediump float;
	uniform sampler2D iCanvas;
	uniform float iPixelDensity;
	uniform vec2 iResolution;
	uniform vec2 iRadius;
	uniform float iSigma;
	uniform float iBrightness;
	uniform float iContrast;
	#define PI 3.14159265359
	
	in vec2 vTexCoord;
	out vec4 fragColor;

	float gaussian(float x, float sigma) {
		return exp(-(x*x)/(2.*sigma*sigma))/(sqrt(2.*PI)*sigma);
	}
	
	vec4 GaussianBlur(vec2 uv, sampler2D img, vec2 radius, float sigma, vec2 texelSize) {
		vec4 color = vec4(0.);
		float sum = 0.;
		for (float x = -radius.x; x <= radius.x; x++) {
			for (float y = -radius.y; y <= radius.y; y++) {
				float weight = gaussian(length(vec2(x, y)), sigma);
				color += texture(img, (uv + vec2(x, y) * texelSize)).xyzw * weight;
				sum += weight;
			}
		}
		return color/sum;
	}
	
	// Function to apply contrast
	vec3 applyContrast(vec3 color, float contrast) {
			color = (color - 0.5) * contrast + 0.5;
			return clamp(color, 0.0, 1.0);
	}

	// Function to apply brightness
	vec3 applyBrightness(vec3 color, float brightness) {
			color += brightness;
			return clamp(color, 0.0, 1.0);
	}

	void main() {
		vec2 uv = vTexCoord;
		vec2 texelSize = 1./(iResolution.xy*iPixelDensity);	
		vec4 color = GaussianBlur(uv, iCanvas, iRadius, iSigma, texelSize);
		
    vec3 rgb = applyContrast(color.rgb, iContrast);
    rgb = applyBrightness(rgb, iBrightness);
		
		fragColor = vec4(rgb, color.a);
	}
`;

//////////////////////////

export const grainFrag = `#version 300 es
precision mediump float;

uniform sampler2D iCanvas;
uniform float iPixelDensity;
uniform float iTime;
uniform float iMult;
uniform float iOpacity;
uniform float iContrast;
uniform float iBright;

#define PI 3.14159265359

in vec2 vTexCoord;
out vec4 fragColor;

float rand(vec2 co){
	float a = 12.9898;
	float b = 78.233;
	float c = 43758.5453;
	float dt = dot(co.xy ,vec2(a,b));
	float sn = mod(dt, PI);
	return fract((sin(sn) * c) + iTime * iMult);
}

void main(){
	vec2 uv = vTexCoord * iPixelDensity;
	vec4 color = texture(iCanvas, uv);
	
	float n = rand(uv) - iBright;
	vec3 noise = vec3(n);
	noise = clamp(noise * iContrast, 0.0, 1.0);
	
	fragColor = vec4(mix(color.rgb, noise, iOpacity), color.a);
}
`;
