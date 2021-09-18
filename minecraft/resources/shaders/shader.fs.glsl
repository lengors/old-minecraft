#version 300 es

// Set float precision
precision mediump float;

// Fragment normal
in vec3 fragNormal;

// Fragment POS
in vec4 fragPosition;

// Fragment's texture coordinates
in vec2 fragCoordinates;

// Fragment's visibility
in float fragVisibility;

// Fragment result
out vec4 fragColor;

// Material uniforms
uniform vec3 ambient;
uniform vec3 diffuse;
uniform vec3 specular;
uniform float shininess;
uniform sampler2D albedoMap;

// Set max number of lights
#define MAX_LIGHT_COUNT 10

// Light uniforms
uniform int lightCount;
uniform vec3 lightColors[MAX_LIGHT_COUNT];
uniform vec3 lightDirections[MAX_LIGHT_COUNT];

// Predefined uniforms
uniform vec4 skyColor;
uniform vec3 viewPosition;

void main()
{
  // Compute texel
	vec4 texel = texture(albedoMap, fragCoordinates);

  // Discard on transperancy
  if (texel.a < 0.5)
    discard;

  // Compute lights
  vec3 accumulatedLightColor = vec3(0.0, 0.0, 0.0);

  // For each light
  for (int i = 0; i < lightCount; ++i) {

    // Compute diffuse
    vec3 surfaceNormal = normalize(fragNormal);
    vec3 normalLightDirection = normalize(lightDirections[i]);
	  vec3 fragDiffuse = max(dot(surfaceNormal, normalLightDirection), 0.0) * diffuse;

    // compute specular
    vec3 viewDirection = normalize(viewPosition - fragPosition.xyz);
    vec3 reflectDirection = reflect(normalLightDirection, surfaceNormal); 
    float specularStrength = pow(max(dot(viewDirection, reflectDirection), 0.0), shininess);
    vec3 fragSpecular = specularStrength * specular; 

    // Compute intensity
    vec3 intensity = ambient + fragDiffuse + fragSpecular;

    // Accumulate final light color
    accumulatedLightColor += lightColors[i] * intensity;
  }

  // Compute final color
  fragColor = vec4(accumulatedLightColor * texel.rgb, texel.a);
  fragColor = mix(skyColor, fragColor, fragVisibility);
}