#version 300 es

precision mediump float;

// Attributes
in vec3 normals;
in float indices;
in vec3 vertices;
in vec2 coordinates;

// Outputed texture
out vec3 fragNormal;
out vec4 fragPosition;
out vec2 fragCoordinates;
out float fragVisibility;

// Texture's number of rows and columns
uniform int albedoRowCount;
uniform int albedoColumnCount;

// World and projection-view matrices
uniform mat4 view;
uniform mat4 world;
uniform mat4 projection;

// Constants
const float gradient = 1.5;
const float density = 0.01;

void main()
{
  int intIndex = int(indices);
  int x = int(coordinates.x) + int(intIndex % albedoColumnCount);
  int y = int(coordinates.y) + albedoRowCount - int(intIndex / albedoColumnCount) - 1;

  fragNormal = mat3(transpose(inverse(world))) * normals;
  fragCoordinates = vec2(float(x) / float(albedoColumnCount), float(y) / float(albedoRowCount));

  fragPosition = world * vec4(vertices, 1.0);
  vec4 fragCameraRelation = view * fragPosition;
  float dist = length(fragCameraRelation.xyz);
  
  fragVisibility = exp(-pow((dist * density), gradient));
  fragVisibility = clamp(fragVisibility, 0.0, 1.0);
  
  gl_Position = projection * fragCameraRelation;
}