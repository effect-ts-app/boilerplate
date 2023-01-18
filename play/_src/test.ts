import "./_global.js"

console.log("hello3 - abc12346")

Effect.succeed("I am an effect1")
  .flatMap(_ => Effect.succeed(_ + ", I am another effect or 11? hmh"))
  .flatMap(t => Effect.sync(() => console.log(t + " abc123")))
  .unsafeRunSync

console.log("hello122")
