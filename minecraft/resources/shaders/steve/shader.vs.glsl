#version 300 es

precision mediump float;

in vec3 normals;
in vec3 vertices;
in vec2 coordinates;

out vec3 fragNormal;
out vec4 fragPosition;
out vec2 fragCoordinates;
out float fragVisibility;

uniform mat4 view;
uniform mat4 world;
uniform mat4 projection;

void main()
{
  fragVisibility = 1.0;
  fragCoordinates = coordinates;
  fragNormal = mat3(transpose(inverse(world))) * normals;
  fragPosition = world * vec4(vertices, 1.0);
  gl_Position = projection * view * fragPosition;
}