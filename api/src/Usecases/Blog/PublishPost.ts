import { OperationId } from "effect-app/Operations"
import { BlogPostId } from "models/Blog.js"
import { S } from "resources/lib.js"

export class PublishPostRequest extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<PublishPostRequest>()({
  id: BlogPostId
}) {}

export const PublishPostResponse = OperationId
