import { OperationId } from "effect-app/Operations"
import { BlogPostId } from "models/Blog"
import { S } from "resources/lib"

export class PublishPostRequest extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<PublishPostRequest>()({
  id: BlogPostId
}) {}

export const PublishPostResponse = OperationId
