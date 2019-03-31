/**
 * Terrain visualization with three.js.
 *
 * OrbitControls and scene scale preserving window resizing taken from three.js docs.
 *
 * Terrain is built by reading a .bin file into a Uint16Array of elevations and loading
 * these elevations into a buffer attribute of a THREE.PlaneBufferGeometry. Three.js and
 * the terrain shaders (./shaders) do the rest.
 */

const terrainInfoPath = "./terrainInfo.json";
const vertexShaderPath = "./shaders/terrain.vert";
const fragmentShaderPath = "./shaders/terrain.frag";

let scene, camera, renderer, controls, tanFOV, windowHeight;
init();
addTerrain().then(animate);

// Handles all the three.js initialization boilerplate
function init() {
  scene = new THREE.Scene({ antialias: true });
  scene.background = new THREE.Color(0xffffff);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    5000,
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera);
  //controls.update() must be called after any manual changes to the camera's transform
  camera.position.set(0, 20, 120);
  controls.update();

  // Remember these initial values (used to maintain scene size when the window is resized)
  tanFOV = Math.tan(((Math.PI / 180) * camera.fov) / 2);
  windowHeight = window.innerHeight;
}

/**
 * Fetches and reads the terrain elevation data contained in the binary (.bin) file.
 * @returns {promise} that resolves to a Uint16Array of elevation data.
 */
async function fetchTerrainElevations(filename) {
  return fetch(filename)
    .then(response => {
      if (!response.ok) {
        throw Error(`failed to fetch ${filename}`);
      }
      return response.arrayBuffer();
    })
    .then(arrayBuffer => {
      return new Uint16Array(arrayBuffer);
    });
}

/**
 * Creates a Terrain mesh out of a Plane and some elevation data.
 * @param {object} planeGeometryOptions
 * @param {Uint16Array} terrainElevations
 */
async function createTerrainMesh(planeGeometryOptions, terrainElevations) {
  let geometry = new THREE.PlaneBufferGeometry(
    ...Object.values(planeGeometryOptions),
  );

  // This is how the plane is made to reflect the terrain.
  // The original .IMG file stores elevation in a similar way conventional PNGs store colors, but instead
  // of storing color, each pixel stores a height of a chunk of Martian terrain. By adjusting the z-coordinate
  // of each vertex to match an elevation, the plane is made to *roughly* match the shape of the original terrain.

  // The z-coordinate adjustment is done in the vertex shader.
  geometry.addAttribute(
    "elevation",
    new THREE.BufferAttribute(terrainElevations, 1),
  );

  let uniforms = {
    u_verticalExaggeration: { type: "f", value: 25.0 },
  };

  let vertexShader = await fetch(vertexShaderPath).then(response =>
    response.text(),
  );
  let fragmentShader = await fetch(fragmentShaderPath).then(response =>
    response.text(),
  );

  let material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.DoubleSide,
    wireframe: true,
  });

  return new THREE.Mesh(geometry, material);
}

// Fetches data necessary to create the terrain mesh, then creates and returns the mesh.
async function addTerrain() {
  let terrainInfo = await fetch(terrainInfoPath).then(response =>
    response.json(),
  );
  let terrainElevations = await fetchTerrainElevations(
    `./${terrainInfo.filename}`,
  );

  let planeGeometryOptions = {
    width: terrainInfo.width / 100,
    height: terrainInfo.height / 100,
    widthSegments: terrainInfo.reducedWidth - 1,
    heightSegments: terrainInfo.reducedHeight - 1,
  };

  let plane = await createTerrainMesh(planeGeometryOptions, terrainElevations);
  scene.add(plane);
}

function animate() {
  requestAnimationFrame(animate);
  // required if controls.enableDamping or controls.autoRotate are set to true
  controls.update();
  renderer.render(scene, camera);
}

// Handle window resizing.
// Taken from: https://threejs.org/docs/index.html#manual/en/introduction/FAQ
window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;

  // adjust the FOV
  camera.fov =
    (360 / Math.PI) * Math.atan(tanFOV * (window.innerHeight / windowHeight));

  camera.updateProjectionMatrix();
  camera.lookAt(scene.position);

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
}
