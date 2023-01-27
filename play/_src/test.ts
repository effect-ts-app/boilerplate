// import "./_global.js"

console.log("hello3 w21- abc12346")

Effect("I am an effect233")
  .flatMap(_ => Effect(_ + ", I am another cc effect or 11? hmh"))
  .flatMap(t => Effect(console.log(t + "b Cabz11c123")))
  .runSync

console.log("hello122")
