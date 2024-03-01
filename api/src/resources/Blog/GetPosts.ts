import { BatchingAnnotationId } from "@effect/schema/AST"
import { S } from "resources/lib.js"
import { BlogPostView } from "../Views.js"

export class GetPostsRequest extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<GetPostsRequest>()({}) {}

export class GetPostsResponse extends S.Class<GetPostsResponse>()({
  items: S.array(BlogPostView).pipe(
    S.annotations({ [BatchingAnnotationId]: true })
  )
}) {}
