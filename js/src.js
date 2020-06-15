import { WEBGL } from './three/examples/jsm/WebGL.js';
import {vShader, fShader} from '../shader/shaders.js'; 
import Stats from './three/examples/jsm/libs/stats.module.js';

let scene, camera, renderer;
let  material;

init();
render();

// 初期化
function init(){

    if(WEBGL.isWebGL2Available() === false){
        document.body.appendChild(WEBGL.getWebGL2ErrorMessage());
    }

    // シーンとカメラオブジェクトを作成
    scene = new THREE.Scene();
    camera = new THREE.Camera();

    //　何もないBuffer Geometry を作成
    const geometry = new THREE.PlaneBufferGeometry(2.0, 2.0);

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
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // rendererを512x512のサイズで作成
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', {alpha: false});
    renderer = new THREE.WebGLRenderer(
    {
        canvas: canvas, 
        context: context
    }
    );
    renderer.setSize(1024.0, 720.0);


    // canvasを作成し，div要素に紐付ける
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
