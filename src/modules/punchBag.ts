export class PunchBag extends Entity {
  public body: CANNON.Body
  public world: CANNON.World

  constructor(transform: Transform, cannonMaterial: CANNON.Material, cannonWorld: CANNON.World) {
    super()
    engine.addEntity(this)
    this.addComponent(new GLTFShape("models/coconut.glb"))
    this.addComponent(transform)
    this.world = cannonWorld

    // Create physics body for coconut
    this.body = new CANNON.Body({
      mass: 1, // kg
      position: new CANNON.Vec3(transform.position.x, transform.position.y, transform.position.z), // m
      shape: new CANNON.Sphere(0.15), // Create sphere shaped body with a diameter of 0.3m
    })

    // Add dampening to stop the locator rotating and moving continuously
    this.body.sleep()
    this.body.material = cannonMaterial
    this.body.linearDamping = 0.4 // Round will keep translating even with friction so you need linearDamping
    this.body.angularDamping = 1.0 // Round bodies will keep rotating even with friction so you need angularDamping
    this.world.addBody(this.body) // Add body to the world   
  }
}