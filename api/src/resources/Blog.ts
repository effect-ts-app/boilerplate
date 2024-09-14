// codegen:start {preset: barrel, import: star, include: ./Blog/*.ts, nodir: false, modulegen: true }
import * as createPost from "./Blog/CreatePost.js"
import * as findPost from "./Blog/FindPost.js"
import * as getPosts from "./Blog/GetPosts.js"
import * as publishPost from "./Blog/PublishPost.js"

type Id<T> = T
/* eslint-disable @typescript-eslint/no-empty-object-type */

export interface CreatePost extends Id<typeof createPost> {}
export const CreatePost: CreatePost = createPost
export interface FindPost extends Id<typeof findPost> {}
export const FindPost: FindPost = findPost
export interface GetPosts extends Id<typeof getPosts> {}
export const GetPosts: GetPosts = getPosts
export interface PublishPost extends Id<typeof publishPost> {}
export const PublishPost: PublishPost = publishPost
// codegen:end

// codegen:start {preset: meta, sourcePrefix: src/resources/}
export const meta = { moduleName: "Blog" }
// codegen:end
