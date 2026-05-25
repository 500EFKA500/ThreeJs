import * as THREE from 'three'
// сцена
const scene = new THREE.Scene();
// камера - угол наклона, расположение, отсечения
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// отрисовка
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
//освещение
const light = new THREE.DirectionalLight(0xFFFFFF, 1);
light.position.set(15, 15, 15);
const light2 = new THREE.AmbientLight(0x404040, 1);
scene.add(light);
scene.add(light2);
// фигура и материал
const geometry = new THREE.BoxGeometry(5, 5, 5);
const material = new THREE.MeshStandardMaterial({
    color : 0xF54927,
    roughness : 0.5,
    metalness : 0.5
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 25;

function render() {
    requestAnimationFrame(render);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}
render();


