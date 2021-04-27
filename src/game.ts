import { Sound } from "./sound"

// Base
const base = new Entity()
base.addComponent(new GLTFShape("models/baseDarkWithCollider.glb"))
engine.addEntity(base)

// Sound
const punchSound = new Sound(new AudioClip("sounds/punch.mp3"))

// Punchbag
const punchBag = new Entity()
punchBag.addComponent(new GLTFShape("models/dogePunchBag.glb"))
punchBag.addComponent(new Transform({ position: new Vector3(8, 0, 8) }))
punchBag.getComponent(Transform).scale.setAll(0.5)
engine.addEntity(punchBag)

// User variables
let forwardVector: Vector3 = Vector3.Forward().rotate(Camera.instance.rotation) // Camera's forward vector
let vectorScale: number = 20

// Allow the user to interact with the punchbag
punchBag.addComponent(
  new OnPointerDown(
    (e) => {
      // Apply impulse based on camera's direction
      targetAnchorBody.applyImpulse(
        new CANNON.Vec3(forwardVector.x * vectorScale, forwardVector.y * vectorScale, forwardVector.z * vectorScale),
        new CANNON.Vec3(targetAnchorBody.position.x, targetAnchorBody.position.y, targetAnchorBody.position.z)
      )
      punchSound.getComponent(AudioSource).playOnce()
    },
    {
      button: ActionButton.ANY,
      showFeedback: true,
      hoverText: "punch",
      distance: 4,
    }
  )
)

// Setup our world
const world: CANNON.World = new CANNON.World()
world.gravity.set(0, 10, 0) // m/s²
world.broadphase = new CANNON.NaiveBroadphase()

// Create a ground plane and apply physics material
const groundBody: CANNON.Body = new CANNON.Body({
  mass: 0, // Setting the mass == 0 makes the body static
})
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2) // Reorient ground plane to be in the y-axis

const physicsMaterial = new CANNON.Material("physicsMaterial")
const physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, { friction: 0, restitution: 0.1 })
world.addContactMaterial(physicsContactMaterial)

const groundShape: CANNON.Plane = new CANNON.Plane()
groundBody.addShape(groundShape)
groundBody.material = physicsMaterial
world.addBody(groundBody)

// Create a static body
let fixedAnchorBody = new CANNON.Body({ mass: 0 })
fixedAnchorBody.position.set(8, 0, 8)
world.addBody(fixedAnchorBody)

// Create target body
let sphereShape = new CANNON.Sphere(0.2)
let targetAnchorBody = new CANNON.Body({ mass: 5 })
targetAnchorBody.addShape(sphereShape)
targetAnchorBody.position.set(8, 3, 8)
world.addBody(targetAnchorBody)

targetAnchorBody.linearDamping = 0.4 // Round bodies will keep translating even with friction so you need linearDamping
targetAnchorBody.angularDamping = 1.0 // Round bodies will keep rotating even with friction so you need angularDamping

var spring = new CANNON.Spring(targetAnchorBody, fixedAnchorBody, {
  localAnchorA: new CANNON.Vec3(0, 0, 0),
  localAnchorB: new CANNON.Vec3(0, 0, 0),
  restLength: 0.0,
  stiffness: 50,
  damping: 8,
})

// Compute the force after each step
world.addEventListener("postStep", function () {
  spring.applyForce()
})

const fixedTimeStep: number = 1.0 / 60.0 // Seconds
const maxSubSteps: number = 10

class UpdateSystem implements ISystem {
  update(dt: number): void {
    world.step(fixedTimeStep, dt, maxSubSteps)

    // https://answers.unity.com/questions/24805/preventing-lookat-from-flipping.html
    let transform = punchBag.getComponent(Transform)
    let relativePos = targetAnchorBody.position.vsub(new CANNON.Vec3(transform.position.x, transform.position.y, transform.position.z))
    transform.rotation = Quaternion.LookRotation(new Vector3(relativePos.x, relativePos.y, relativePos.z), Vector3.Forward())

    // Update forward vector
    forwardVector = Vector3.Forward().rotate(Camera.instance.rotation)
  }
}

engine.addSystem(new UpdateSystem())
