import { getPaletteColor } from './colors'

const backgroundCanvas = document.querySelector(
  '#background'
) as HTMLCanvasElement

window.addEventListener('resize', () => {
  backgroundCanvas.setAttribute('width', `${window.innerWidth * 2}px`)
  backgroundCanvas.setAttribute('height', `${window.innerHeight * 2}px`)

  // TODO: Properly reinstanciate stuff
})

function loadShader(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type)!

  gl.shaderSource(shader, src)
  gl.compileShader(shader)

  return shader
}

function createShaderProgram(
  gl: WebGLRenderingContext,
  vertexSharedSource: string,
  fragmentShaderSource: string
) {
  const vs = loadShader(gl, gl.VERTEX_SHADER, vertexSharedSource)
  const fs = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

  const program = gl.createProgram()!
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program)
    throw new Error(`Could not compile WebGL program. \n\n${info}`)
  }

  return program
}

function createBuffer(gl: WebGLRenderingContext, vertices: number[]) {
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
  return buf
}

const SCALE = 2

backgroundCanvas.setAttribute('width', `${window.innerWidth * 2}px`)
backgroundCanvas.setAttribute('height', `${window.innerHeight * 2}px`)

const vertexShader = `
  attribute vec4 vertex;

  void main() {
    gl_Position = vertex;
  }
`

const fragmentShader = `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 color0;
uniform vec3 color1;
uniform vec3 color2;

float metaball(vec2 a, vec2 b) {
    return 1.0 / ((pow(b.x - a.x, 2.0) + pow(b.y - a.y, 2.0)));
}

// vec3 color0 = vec3(0.98039,0.66275,0.40784);
// vec3 color1 = vec3(0.96078,0.86275,0.67451);
// vec3 color2 = vec3(0.00784,0.51373,0.56863);

#define NUM_BALLS 6

// gl_FragCoord, gl_FragColor

void main() {
    
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float sum = 0.0;
    
    for (int i = 0; i < NUM_BALLS; i++) {
        float j = float(i);
        vec2 ball = vec2(
            sin(u_time * 0.012 * cos(j) + j ) * 0.5 + 0.5,
            cos(u_time * 0.012 * cos(j) * j + j ) * 0.5 + 0.5
        );
      sum += metaball(uv, ball);
    }
    
    float threshold = 50.0;
    
    vec3 col = sum > threshold ? color0 : (sum > (threshold / 2.0) ? color1 : color2);

    
   gl_FragColor = vec4(col, 1.0);
}
`

const gl = backgroundCanvas.getContext('webgl')!

gl.clearColor(0.0, 0.0, 0.0, 1.0)

const program = createShaderProgram(gl, vertexShader, fragmentShader)

const vertexPosition = gl.getAttribLocation(program, 'vertex')

const buf = createBuffer(gl, [-1.0, 3.0, 3.0, -1.0, -1.0, -1.0])

gl.bindBuffer(gl.ARRAY_BUFFER, buf)
gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0)
gl.enableVertexAttribArray(vertexPosition)
// Tell WebGL to use our program when drawing

// Set the shader uniforms
gl.useProgram(program)

const timePosition = gl.getUniformLocation(program, 'u_time')
const resolutionPosition = gl.getUniformLocation(program, 'u_resolution')
const colorPositions = [
  gl.getUniformLocation(program, 'color0'),
  gl.getUniformLocation(program, 'color1'),
  gl.getUniformLocation(program, 'color2'),
]

const loop = () => {
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.uniform2f(
    resolutionPosition,
    window.innerWidth * 2,
    window.innerHeight * 2
  )
  gl.uniform1f(
    timePosition,
    performance.now() / 1000 + 20 + document.documentElement.scrollTop / 40
  )
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3)

  {
    const color = getPaletteColor(3)
    gl.uniform3f(
      colorPositions[0]!,
      color?.r ?? 0,
      color?.g ?? 0,
      color?.b ?? 0
    )
  }
  {
    const color = getPaletteColor(2)
    gl.uniform3f(
      colorPositions[1]!,
      color?.r ?? 0,
      color?.g ?? 0,
      color?.b ?? 0
    )
  }
  {
    const color = getPaletteColor(1)
    gl.uniform3f(
      colorPositions[2]!,
      color?.r ?? 0,
      color?.g ?? 0,
      color?.b ?? 0
    )
  }

  requestAnimationFrame(loop)
}

loop()
