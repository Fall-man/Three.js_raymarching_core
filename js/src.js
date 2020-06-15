import {vShader, fShader} from '../shader/shaders.js'; 
import Stats from './three/examples/jsm/libs/stats.module.js';

var scene, camera, renderer;
var geometry, material, mesh;
var canvas;
var stats;

init();
render();

// 初期化
function init(){


    // シーンとカメラオブジェクトを作成
    scene = new THREE.Scene();
    camera = new THREE.Camera();

    //　何もないBuffer Geometry を作成
    geometry = new THREE.PlaneBufferGeometry(2.0, 2.0);

    // Shaderをマテリアルに当てる，Uniformとシェーダファイルの紐付け
    material = new THREE.ShaderMaterial({
        uniforms: {
            time: { type:   "f", value: 0.0 },
            resolution: {   type:   "v2",   value:  new THREE.Vector2(1024.0, 720.0) }
        },
        vertexShader: vShader,
        fragmentShader: fShader
    });

    // meshを作成し，シーンに紐づける
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // rendererを512x512のサイズで作成
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(1024.0, 720.0);


    // canvasを作成し，div要素に紐付ける
    canvas = renderer.domElement;
    document.getElementById('containar').appendChild(canvas);

    stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);
}

// ループ
function render(timestamp){
    requestAnimationFrame(render);

    stats.begin();

    material.uniforms.time.value = timestamp * 0.001 % 10;

    stats.end();
    renderer.render(scene, camera);
}
