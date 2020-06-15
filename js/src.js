import { WEBGL } from './three/examples/jsm/WebGL.js';

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
        vertexShader: document.getElementById('vs').textContent,
        fragmentShader: document.getElementById('fs').textContent
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
}

// ループ
function render(timestamp){
    requestAnimationFrame(render);
    material.uniforms.time.value = timestamp * 0.001;
    renderer.render(scene, camera);
}
