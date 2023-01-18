import "./_global.js"

console.log("hello1")

Effect.succeed("I am an effect")
  .zipRight(Effect.succeed("I am another effect"))
  .flatMap(t => Effect.sync(() => console.log(t)))
  .unsafeRunSync

console.log("hello2")
