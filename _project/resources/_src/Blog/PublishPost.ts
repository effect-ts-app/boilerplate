import { BlogPostId } from "@effect-app-boilerplate/models/Blog"
import { Req } from "../lib.js"
import { OperationId } from "../Views.js"

export class PublishPostRequest extends Req({ allowAnonymous: true, allowRoles: ["user"] })<PublishPostRequest>()({
  id: BlogPostId
}) {}

export const PublishPostResponse = OperationId
