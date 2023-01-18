import { BlogPostId } from "@effect-app-boilerplate/models/Blog"
import { allowRoles } from "@effect-app-boilerplate/models/roles"
import { OperationId } from "../Views.js"

@allowRoles("user")
export class PublishPostRequest extends Req(cfg({ allowAnonymous: true }))<PublishPostRequest>()({
  id: BlogPostId
}) {}

export const PublishPostResponse = OperationId
