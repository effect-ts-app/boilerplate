// codegen:start {preset: barrel, include: ./Blog/*.ts, export: { as: 'PascalCase' }, nodir: false }
export * as CreatePost from "./Blog/CreatePost.js"
export * as GetPosts from "./Blog/GetPosts.js"
// codegen:end
// codegen:start {preset: meta}
export const meta = { moduleName: "Blog" }
// codegen:end