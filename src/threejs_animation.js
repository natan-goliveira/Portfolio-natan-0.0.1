// src/threejs_animation.js
import * as THREE from 'https://cdn.skypack.dev/three@0.136.0/build/three.module.js';
// import { OrbitControls } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js'; // Manter comentado
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js';
// import { GUI } from 'https://cdn.skypack.dev/dat.gui@0.7.7'; // Manter comentado

const container = document.getElementById('threejs-background-container');
if (!container) {
    console.error('Three.js container not found!');
    throw new Error('Three.js container not found. Animation not initialized.');
}

const canvas = document.querySelector('#goo-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); // Adicionado antialias para suavizar bordas
// Não definir o tamanho inicial aqui. Ele será definido no resize.
// renderer.setSize(container.clientWidth, container.clientHeight); 
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding; // Boa prática para cores

const scene = new THREE.Scene();
scene.background = null; 

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100); // Inicie com aspect 1 (quadrado) para ajustar dinamicamente
camera.position.z = 5;

// Remova ou comente OrbitControls se não houver interação do usuário
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;

const light = new THREE.PointLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

const rotatingGroup = new THREE.Group();
scene.add(rotatingGroup); 

// === ESTRELAS ===
const starGeometry = new THREE.BufferGeometry();
const starCount = 1000;
const starsPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i++) {
  starsPositions[i] = (Math.random() - 0.5) * 200;
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
const starMaterial = new THREE.PointsMaterial({
  color: 0x2CE1C6,
  size: 0.1,
  sizeAttenuation: true
});
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// === ICOSAEDROS / ESFERA PRINCIPAL ===
// Manter os tamanhos originais, a câmera ajustará o zoom
const innerGeometry = new THREE.IcosahedronGeometry(2, 1);
const innerMaterial = new THREE.MeshStandardMaterial({
  color: 0x222222,
  roughness: 0.5,
  metalness: 1,
  flatShading: true,
  transparent: true,
  opacity: 0.7
});
const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
rotatingGroup.add(innerMesh); 
 
const outerGeometry = new THREE.IcosahedronGeometry(2, 1);
const wireframeMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true,
  transparent: true,
  opacity: 0.1
});
const wireframeMesh = new THREE.Mesh(outerGeometry, wireframeMaterial);
rotatingGroup.add(wireframeMesh); 
 
const positions = [];
const posAttr = outerGeometry.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
  positions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
}

const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 4));
const particleMaterial = new THREE.PointsMaterial({
  color: 0x2E86D0,
  size: 0.025
});
const particles = new THREE.Points(particleGeometry, particleMaterial);
rotatingGroup.add(particles); 
 
// === PÓS-PROCESSAMENTO ===
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(container.clientWidth, container.clientHeight), // Tamanho inicial pode ser 1,1
  1.5,
  0.4,
  0.05
);
composer.addPass(bloomPass);

const ShockwaveShader = {
  uniforms: {
    tDiffuse: { value: null },
    center: { value: new THREE.Vector2(0.5, 0.5) },
    time: { value: 0.0 },
    maxRadius: { value: 1.0 },
    amplitude: { value: 0.1 },
    speed: { value: 0.3 },
    width: { value: 0.3 },
    aspect: { value: 1.0 }, // Será atualizado no resize
    smoothing: { value: 1.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    #define PI 3.14159265359
    uniform sampler2D tDiffuse;
    uniform vec2 center;
    uniform float time;
    uniform float maxRadius;
    uniform float amplitude;
    uniform float speed;
    uniform float width;
    uniform float aspect;
    uniform float smoothing;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      vec2 aspectUV = vec2((uv.x - center.x) * aspect, uv.y - center.y);
      float dist = length(aspectUV);
      float wave = 0.0;
      float t = mod(time * speed, maxRadius + width);
      if (dist < t && dist > t - width) {
        float edgeDist = abs(dist - (t - width / 2.0)) / (width / 2.0);
        float smoothFactor = smoothstep(1.0 - smoothing, 1.0, edgeDist);
        wave = amplitude * sin((dist - t + width) / width * PI * 2.0) * (1.0 - smoothFactor);
      }
      uv += normalize(aspectUV) * wave;
      gl_FragColor = texture2D(tDiffuse, uv);
    }
  `
};

const shockwavePass = new ShaderPass(ShockwaveShader);
shockwavePass.renderToScreen = true;
composer.addPass(shockwavePass);

let shockwaveActive = false;
let shockwaveStartTime = 0;
let shockwaveDuration = 10;

// Reajuste o double click para a área do container
window.addEventListener('dblclick', (event) => {
    const rect = container.getBoundingClientRect();
    if (event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom) {
        
        // Mapeia as coordenadas do clique para o espaço do canvas do Three.js dentro do container
        const mouseX = (event.clientX - rect.left) / rect.width;
        const mouseY = 1.0 - (event.clientY - rect.top) / rect.height; // Inverte Y para Three.js
        
        shockwavePass.uniforms.center.value.set(mouseX, mouseY);
        shockwaveActive = true;
        shockwaveStartTime = performance.now() / 1000;
        shockwavePass.uniforms.time.value = 0.0;
    }
});

// === FUNÇÃO DE REDIMENSIONAMENTO (CRUCIAL) ===
function onWindowResize() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Se o contêiner tiver 0 de largura ou altura, pare e não tente renderizar
    if (width === 0 || height === 0) {
        console.warn('Container has zero dimensions, skipping resize.');
        return;
    }

    camera.aspect = width / height;
    
    // Ajuste da posição Z da câmera para garantir que a esfera se ajuste ao contêiner
    // Isso é uma estimativa. Pode precisar de ajuste fino.
    // O objetivo é que a esfera (raio ~1.15) caiba na altura ou largura do viewport da câmera.
    // Se o aspect ratio for diferente de 1 (ex: container retangular),
    // a esfera pode parecer esticada ou cortada.
    // Para compensar, podemos ajustar o FOV ou a posição Z com base no aspect ratio.
    const fov = camera.fov * ( Math.PI / 180 ); // Convert FOV to radians
    const objectSize = 1.5; // Aproximadamente 2 * raio do icosaedro externo
    let distance = objectSize / ( 2 * Math.tan( fov / 2 ) );

    // Se a largura for menor que a altura (contêiner mais alto que largo), 
    // precisamos garantir que o objeto caiba na largura.
    // Ajuste a distância da câmera se a largura for o fator limitante.
    if (width / height < 1) { // Portrait orientation
        const aspectCompensation = (1 / (width / height));
        camera.position.z = distance * aspectCompensation * 1.5; // Multiplicador para dar um pouco mais de "zoom out"
    } else { // Landscape or square
        camera.position.z = distance * 1.5; // Um pouco de zoom out
    }
    
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
    bloomPass.setSize(width, height);
    shockwavePass.uniforms.aspect.value = width / height;
}

// Chame a função de redimensionamento na inicialização
onWindowResize();
window.addEventListener('resize', onWindowResize);


function animate() {
  requestAnimationFrame(animate);
//   controls.update(); // Manter comentado

  rotatingGroup.rotation.x += 0.002;
  rotatingGroup.rotation.y += 0.001;

  if (shockwaveActive) {
    const elapsedTime = performance.now() / 1000 - shockwaveStartTime;
    if (elapsedTime < shockwaveDuration) {
      shockwavePass.uniforms.time.value = elapsedTime;
    } else {
      shockwaveActive = false;
      shockwavePass.uniforms.time.value = 0.0;
    }
  }
  composer.render();
}

animate();

// Remova ou comente todas as linhas relacionadas ao dat.gui e title_ui para produção
// const gui = new GUI();
// gui.close();

// ... (restante do código dat.gui e title_ui comentado) ...