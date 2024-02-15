import { BlogPostId } from "@effect-app-boilerplate/api/models/Blog"
import { S } from "@effect-app-boilerplate/api/resources/lib"
import { OperationId } from "effect-app/Operations"

export class PublishPostRequest extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<PublishPostRequest>()({
  id: BlogPostId
}) {}

export const PublishPostResponse = OperationId
