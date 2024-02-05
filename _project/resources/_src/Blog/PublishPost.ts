import { BlogPostId } from "@effect-app-boilerplate/models/Blog"
import { S } from "@effect-app-boilerplate/resources/lib"
import { OperationId } from "../Views.js"

export class PublishPostRequest extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<PublishPostRequest>()({
  id: BlogPostId
}) {}

export const PublishPostResponse = OperationId
