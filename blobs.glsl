#define NUM_BALLS 7

float metaball(vec2 a, vec2 b) {
    return 1.0 / ((pow(b.x - a.x, 2.0) + pow(b.y - a.y, 2.0)));
}

vec3 colors[3] = vec3[3](
    vec3(0.97255,0.33333,0.14510),
    vec3(0.98039,0.66275,0.40784),
    vec3(0.96078,0.86275,0.67451)
);

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 balls[NUM_BALLS];
    
    for (int i = 0; i < NUM_BALLS; i++) {
        float j = float(i);
        balls[i] = vec2(
            sin(iTime * 0.012 * cos(j) + j + fragCoord.x * 0.01) * 0.5 + 0.5,
            cos(iTime * 0.012 * cos(j) * j + j + fragCoord.y * 0.01) * 0.5 + 0.5
        );
    }
    
    vec2 uv = fragCoord/iResolution.xy;
    float sum = 0.0;
    for (int i = 0; i < NUM_BALLS; i++) {
      sum += metaball(uv, balls[i]);
    }
    
    float threshold = 60.0;
    
    vec3 col = sum > threshold ? colors[0] : (sum > (threshold / 2.0) ? colors[1] : colors[2]);

    fragColor = vec4(col,1.0);
}