import { BlogPost } from "@effect-app-boilerplate/models/Blog"

export class GetPostsRequest extends Get("/blog/posts")<GetPostsRequest>()(
  {}
) {}

export class GetPostsResponse extends ModelEnc<GetPostsResponse, GetPostsResponse>()({ // TODO MNModel<GetPostsResponse, GetPostsResponse.ConstructorInput, GetPostsResponse.Encoded, GetPostsResponse.Props> ()({
  items: prop(array(BlogPost))
}) {}
/** @ignore @internal @deprecated */
export type GetPostsResponseConstructor = typeof GetPostsResponse

// codegen:start {preset: model}
//
/* eslint-disable */
export interface GetPostsResponse {
  readonly items: readonly BlogPost[]
}
export namespace GetPostsResponse {
  /**
   * @tsplus type GetPostsResponse.Encoded
   */
  export interface Encoded {
    readonly items: readonly BlogPost.Encoded[]
  }
  export const Encoded: EncodedOps = { $: {} }
  /**
   * @tsplus type GetPostsResponse.Encoded/Aspects
   */
  export interface EncodedAspects {}
  /**
   * @tsplus type GetPostsResponse.Encoded/Ops
   */
  export interface EncodedOps { $: EncodedAspects }
  export interface ConstructorInput
    extends ConstructorInputFromApi<typeof GetPostsResponse> {}
  export interface Props extends GetProvidedProps<typeof GetPostsResponse> {}
}
/* eslint-enable */
//
// codegen:end
