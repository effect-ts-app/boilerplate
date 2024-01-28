// import "./_global.js"

console.log("hello3 w21- abc12346")

Effect
  .succeed("I am an effect233")
  .flatMap((_) => Effect.succeed(_ + ", I am another cc effect or 11? hmh"))
  .flatMap((t) => Effect.sync(() => (console.log(t + "b Cabz11c123"))))
  .runSync

console.log("hello122")
