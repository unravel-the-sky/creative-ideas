import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui';
import gsap from 'gsap'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger';

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
 * Physicssss
 */
const world = new CANNON.World();
world.broadphase = new CANNON.SAPBroadphase(world)
world.allowSleep = true;
world.gravity.set(0, 0, 0)

const defaultMaterial = new CANNON.Material('concrete');
defaultMaterial.friction = 10;
defaultMaterial.restitution = 0.9;

/**
 * Base
 */
const params = {
    mainColor: '#1e665a',
    background: '#5199db',
    cameraPos: 20,
    cubeX: 0,
    fishGroupX: 0,
    zPosition: -10,
    addRandomFish: () => {
        const url = fishUrlList[Math.floor(Math.random() * fishUrlList.length)];
        addFish(url)
    },
    randomPos: () => {
        randomPos()
    }
};



const material = new THREE.MeshStandardMaterial(
    {
        color: params.mainColor,
        transparent: true,
        opacity: 0.5
    }
)

// Debug
const gui = new GUI()
// gui.addColor(params, 'mainColor').onChange((color) => { 
//     console.log(color)
//     material.color.set(color)
// })
gui.addColor(params, 'background').onChange((color) => { 
    console.log(color)
    scene.background.set(color)
})
gui.add(params, 'cameraPos').min(0).max(200).step(0.01).onChange((val) => {
    camera.position.z = val;
})
gui.add(params, 'zPosition').min(-50).max(0).step(0.01).onChange((val) => {
    params.zPosition = val;
})
gui.add(params, 'addRandomFish').onFinishChange(() => {
    console.log('clicked here')
})
gui.add(params, 'randomPos').onFinishChange(() => {
    console.log('clicked here')
})
gui.add(params, 'fishGroupX').min(-30).max(30).step(0.1).onChange(() => {
    fishesGroup.position.x = params.fishGroupX
})
// gui.add(params, 'cubeX').min(-30).max(30).step(0.1).onChange(() => {
//     // cube.position.x = params.cubeX
//     test.position.x = params.cubeX
// })

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
const fishesGroup = new THREE.Group();

let boundingBox = null;

const addFish = (url) => {
    gltfLoader.load(url, 
        (glb) => {
            const fish = {
                model: glb.scene,
                mixer: new THREE.AnimationMixer(glb.scene),
                boundingBox: null,
                body: null
            }
            console.log('calculating fish sin bounding box')
            fish.model.updateMatrixWorld(true)


            console.log('measures: ', cube.geometry.width, cube.geometry.height)

            fishesList.push(fish)
            fishesGroup.add(fish.model)

            fishesGroup.updateWorldMatrix();
            
            const action = fish.mixer.clipAction(glb.animations[5] ?? glb.animations[0])
            action.play();
    
            fish.model.scale.setScalar(0.6 * Math.random() + 0.2)

            const posX = Math.sin((Math.random() - 0.5) * 100) * fishesGroup.children.length;
            const posY = Math.sin((Math.random() - 0.5) * 2) * 5;
            fish.model.position.set(posX, posY, -10)

            const box = new THREE.Box3().setFromObject(fish.model);
            const size = box.getSize(new THREE.Vector3()).length();
            const dims = box.getSize(new THREE.Vector3())
            const center = box.getCenter(new THREE.Vector3());
            console.log(size, center)
            // cube.scale.setScalar(size);

            const bbCube = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                material
            )
            bbCube.position.set(0, 0, -10)
            bbCube.scale.set(size, size, size)
            bbCube.position.set(center.x, center.y, -10);
            bbCube.visible = false

            fish.boundingBox = bbCube;

            fish.model.position.set(posX, posY, -200)
            scene.add(fishesGroup)

            // create physics rigid body here
            const body = new CANNON.Body({
                mass: 1,
                position: new CANNON.Vec3(bbCube.position.x, bbCube.position.y, bbCube.position.z),
                shape: new CANNON.Box(new CANNON.Vec3(size*0.5, size*0.5, size*0.5)),
                material: defaultMaterial
            })
            fish.body = body;
            world.addBody(body);
            scene.add(bbCube)
        }
    )
}
addFish(fishUrlList[0])

/**
 * Test cube
 */
const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    material
)
cube.position.set(0, 0, -10)
// cube.geometry.computeBoundingBox()

const cube2 = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    material
)
cube2.position.set(-2, 4, -3)
// cube.visible = false;
const test = new THREE.Group()
test.add(cube, cube2)
// scene.add(test)
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
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
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
const gridHelper = new THREE.GridHelper(40, 10);
// scene.add(gridHelper)

const cursor = {
    x: 0,
    y: 0
}

const randomZ = Math.random() * -20

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 36, 2, 2),
    new THREE.MeshStandardMaterial({
        color: 'red', 
        opacity: 0.5, 
        transparent: true
    })
)
plane.position.z = 0;
// plane.rotation.x = Math.PI * -0.5;
plane.visible = false
scene.add(plane)

const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(0, -10, 0)
})
floorBody.addShape(floorShape);
floorBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(-1, 0, 0),
    Math.PI * 0.5
)
// world.addBody(floorBody)

const raycaster = new THREE.Raycaster();

let intersectionPoint = null;

window.addEventListener('mousemove', (event) => {
    // console.log(event.clientX, event.clientY)
    cursor.x = ((event.clientX / sizes.width) * 2 - 1);
    cursor.y = (((event.clientY / sizes.height) * 2 - 1) * -1) 
    // console.log(cursor.x, cursor.y)

    raycaster.setFromCamera(cursor, camera)

    const intersects = raycaster.intersectObject(plane)

    if (fishesList.length > 0 && intersects.length > 0 && plane) {
        fishesList.map((fish) => {
            fish.model.lookAt(new THREE.Vector3(intersects[0].point.x, intersects[0].point.y, plane.position.z))
        })
    }
})

const forceIntensity = 50;
const maxVel = 1;
const moveBodyToTarget = (body, targetPos) => {
    // Compute direction to target
    // var direction = new CANNON.Vec3();
    const direction = targetPos.vsub(body.position);
    // direction.z = 0;
    const distance = direction.length();

    // console.log(distance)

    if (distance > 0.1) {
        direction.normalize();
        // const force = direction.(forceIntensity,body.velocity);
        body.velocity.set(Math.min(maxVel, body.velocity.x),Math.min(maxVel, body.velocity.y),Math.min(maxVel, body.velocity.z))
        body.angularVelocity.set(Math.min(maxVel, body.velocity.x),Math.min(maxVel, body.velocity.y),Math.min(maxVel, body.velocity.z))
        const force = direction.scale(forceIntensity);
        body.applyForce(force, body.position)
    } else {
        body.velocity.set(0, 0, 0)
        body.angularVelocity.set(0, 0, 0)
    }
}

canvas.addEventListener('click', (event) => {
    cursor.x = ((event.clientX / sizes.width) * 2 - 1);
    cursor.y = (((event.clientY / sizes.height) * 2 - 1) * -1) 

    console.log(cursor)
    // console.log(fishesGroup)


    raycaster.setFromCamera(cursor, camera)

    const intersects = raycaster.intersectObject(plane)
    if (intersects) {
        console.log('i hit the plane: ', intersects[0].point)
        intersectionPoint = intersects[0].point
    }
    

    if (fishesList.length > 0) {
        // console.log('applying impulse towards: ', new CANNON.Vec3(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z), ' origin: ', new CANNON.Vec3(fish.model.position))
        // fishesList.forEach(fish => {
        //     // moveBodyToTarget(fish.body, new CANNON.Vec3(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z))
        //     // fish.body.applyImpulse(-new CANNON.Vec43(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z), new CANNON.Vec3(fish.model.position))
        //     // console.log('moved body: ', fish.body.position)

        //     // gsap.to(fish.model.position, {
        //     //     x: intersectionPoint.x,
        //     //     y: intersectionPoint.y,
        //     //     ease: 'sine.inOut',
        //     //     duration: 1.2,
        //     //     onComplete: () => {
        //     //         randomPos()
        //     //     }
        //     // })
        // });
    }
})



const randomPos = () => {
    if (fishesList.length > 0) {
        fishesList.map((fish, index) => {
            gsap.to(fish.model.position, {
                x: fish.model.position.x + Math.sin((Math.random() - 0.5)) * fishesList.length,
                y: fish.model.position.y + Math.sin((Math.random() - 0.5)) * fishesList.length,
                z: -10,
                duration: 0.4,
                onComplete: () => {
                    // console.log(fish.model.position)
                    // fish.model.lookAt(new THREE.Vector3(cursor.x, cursor.y, camera.position.z - 3))
                }
            })
        })
    }
}

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


    // world.step(1/60, deltaTime, 3);
    world.fixedStep()

    if (fishesList.length > 0) {
        fishesList.forEach(fish => {
            fish.mixer.update(deltaTime)
        });
    }

    if (intersectionPoint && fishesList.length > 0) {
        fishesList.forEach(fish => {
            moveBodyToTarget(fish.body, new CANNON.Vec3(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z))
        });
    }

    if (fishesList.length > 0) {
        fishesList.forEach(fish => {
            fish.model.position.copy(fish.body.position)
            // console.log('moved body: ', fish.body.position)
            // fish.model.quaternion.copy(fish.body.quaternion)
        });
    }

    if (fishesList.length > 0) {
        fishesList.map((fish, index) => {
            gsap.to(fish.model.position, {
                z: params.zPosition,
                delay: 1,
                duration: 0.4,
                onComplete: () => {
                    // fish.model.lookAt(new THREE.Vector3(cursor.x, cursor.y, camera.position.z - 3))
                }
            })
            fish.boundingBox.position.set(fish.model.position.x, fish.model.position.y, params.zPosition)
        })
    }
    // }

    // Update controls
    // controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

const cannonDebugger = new CannonDebugger(scene, world, { color: 0xff0000})