// codegen:start {preset: barrel, include: ./Blog/*.ts, export: { as: 'PascalCase' }, nodir: false }
export * as CreatePost from "./Blog/CreatePost"
export * as FindPost from "./Blog/FindPost"
export * as GetPosts from "./Blog/GetPosts"
export * as PublishPost from "./Blog/PublishPost"
// codegen:end
// codegen:start {preset: meta, sourcePrefix: src/resources/}
export const meta = { moduleName: "Blog" }
// codegen:end
