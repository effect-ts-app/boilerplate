import { BlogPostId } from "models/Blog.js"
import { S } from "resources/lib.js"
import { OperationId } from "effect-app/Operations"

export class PublishPostRequest extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<PublishPostRequest>()({
  id: BlogPostId
}) {}

export const PublishPostResponse = OperationId
