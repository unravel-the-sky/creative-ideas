import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui';
import gsap from 'gsap'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'

const gltfLoader = new GLTFLoader();

const fishUrlList = [
    '/models/nemo.glb',
    '/models/anglerFish.glb',
    '/models/blueFish.glb',
    '/models/puffer.glb',
    '/models/bigFish.glb',
]

let addedList = []

/**
 * Base
 */
const params = {
    mainColor: '#1e665a',
    background: '#5199db',
    cameraPos: 8,
    addRandomFish: () => {
        const url = fishUrlList[Math.floor(Math.random() * fishUrlList.length)];
        addFish(url)
    }
};



const material = new THREE.MeshStandardMaterial(
    {
        color: params.mainColor
    }
)

// Debug
const gui = new GUI()
gui.addColor(params, 'mainColor').onChange((color) => { 
    console.log(color)
    material.color.set(color)
})
gui.addColor(params, 'background').onChange((color) => { 
    console.log(color)
    scene.background.set(color)
})
gui.add(params, 'cameraPos').min(0).max(15).step(0.01).onChange((val) => {
    camera.position.z = val;
})
gui.add(params, 'addRandomFish').onFinishChange(() => {
    console.log('clicked here')
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(params.background)

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const texture = textureLoader.load('/textures/particles/8.png')

/**
 * Load models
 */
const fishesList = []
// const addFishes = (strings = ['']) => {
//     strings.forEach(url => {
//         gltfLoader.load(url, 
//             (glb) => {
//                 console.log(glb)
//                 const fish = {
//                     model: glb.scene,
//                     mixer: new THREE.AnimationMixer(glb.scene)
//                 }
//                 fishesList.push(fish)
                
//                 const action = fish.mixer.clipAction(glb.animations[5] ?? glb.animations[0])
//                 action.play();

//                 console.log(fish)
        
//                 fish.model.scale.setScalar(0.6 * Math.random() + 0.2)
//                 fish.model.position.set((Math.random() - 0.5) * 100, (Math.random() - 0.5 ) * 2, -200)
//                 scene.add(fish.model)
//             }
//         )
//     });
// }
// addFish([
//     '/models/nemo.glb',
//     '/models/anglerFish.glb',
//     '/models/blueFish.glb',
//     '/models/puffer.glb',
//     '/models/bigFish.glb',
// ])

const addFish = (url) => {
    gltfLoader.load(url, 
        (glb) => {
            console.log(glb)
            const fish = {
                model: glb.scene,
                mixer: new THREE.AnimationMixer(glb.scene)
            }
            fishesList.push(fish)
            
            const action = fish.mixer.clipAction(glb.animations[5] ?? glb.animations[0])
            action.play();

            console.log(fish)
    
            fish.model.scale.setScalar(0.6 * Math.random() + 0.2)
            console.log((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 2)
            fish.model.position.set(Math.sin((Math.random() - 0.5) * 100) * 5, Math.sin((Math.random() - 0.5) * 2) * 5, -200)
            scene.add(fish.model)
        }
    )
}
addFish(fishUrlList[0])

/**
 * Test cube
 */
const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    material
)
cube.position.set(0, 0, -400)
// scene.add(cube)

const torus = new THREE.Mesh(
    new THREE.TorusGeometry(0.9),
    material
)
torus.position.set(-3, 0, 0)
torus.scale.set(0.5, 0.5, 0.5)
// scene.add(torus)

const numParticles = 300;
const rangeParticles = params.cameraPos * 2;
const particlesPos = new Float32Array(numParticles * 3)
for(let i = 0; i < numParticles * 3 ; i++) {
    const i3 = i * 3;
    particlesPos[i3 + 0] = (Math.random() - 0.5) * rangeParticles;
    particlesPos[i3 + 1] = (Math.random() - 0.5) * rangeParticles;
    particlesPos[i3 + 2] = (Math.random() - 0.5) * rangeParticles;
}
const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPos, 3));

const particlesMaterial = new THREE.PointsMaterial({
    // color: '#ff0012',
    sizeAttenuation: true,
    size: 0.1,
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
})

const particles = new THREE.Points(
    particlesGeometry,
    particlesMaterial
)
scene.add(particles)


const directionalLight1 = new THREE.DirectionalLight('#ffffff', 2)
directionalLight1.position.set(-3, 0, 4)
const directionalLight2 = new THREE.DirectionalLight('#ffffff', 3)
directionalLight1.position.set(2, 3, 2)
scene.add(directionalLight1, directionalLight2)

const ambientLight = new THREE.AmbientLight('#ffffff', 1)
scene.add(ambientLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(65, sizes.width / sizes.height, 0.1, 100)
camera.position.z = params.cameraPos
scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true
// controls.

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


// scene.add(new THREE.AxesHelper(2))

const cursor = {
    x: 0,
    y: 0
}

const randomZ = (Math.random() - 0.5) * 4

window.addEventListener('mousemove', (event) => {
    // console.log(event.clientX, event.clientY)
    cursor.x = ((event.clientX / sizes.width) * 2 - 1) * rangeParticles * 0.5;
    cursor.y = (((event.clientY / sizes.height) * 2 - 1) * -1) * rangeParticles * 0.5;
    // console.log(cursor.x, cursor.y)

    console.log('move object to cursor..')

    if (fishesList.length > 0) {
        fishesList.map((fish, index) => {
            gsap.to(fish.model.position, {
                x: Math.sin(cursor.x) + cursor.x + 1.45 * index,
                y: cursor.y - 1.2 * index,
                z: randomZ,
                duration: 0.4,
                onComplete: () => {
                    fish.model.lookAt(new THREE.Vector3(cursor.x, cursor.y, camera.position.z - 3))
                }
            })
        })
    }

})

/**
 * Animate
 */
const clock = new THREE.Clock()
let currentTime = 0;

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - currentTime;
    currentTime = elapsedTime;

    // for (let i = 0; i < size ; i++) {
    //     const i3 = i * 3;
    //     const xPos = particlesGeometry.attributes.position.array[i3 + 0];
    //     particlesGeometry.attributes.position.array[i3 + 1] = Math.sin((elapsedTime + xPos)*0.8)
    //     // console.log(Math.sin(elapsedTime))
    // }

    // if (nemoMixer) {
    //     nemoMixer.update(deltaTime)
    // }

    // if (bigFishMixer) {
    //     bigFishMixer.update(deltaTime)
    // }

    if (fishesList.length > 0) {
        fishesList.forEach(fish => {
            fish.mixer.update(deltaTime)
        });
    }

    // Update controls
    // controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()