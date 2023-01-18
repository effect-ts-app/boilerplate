import { prefixedStringId } from "@effect-app/prelude/schema"

export const BlogPostId = prefixedStringId<BlogPostId>()("post", "BlogPostId")
export interface BlogPostIdBrand {
  readonly BlogPostId: unique symbol
}
export type BlogPostId = StringId & BlogPostIdBrand & `post-${string}`

export class BlogPost extends MNModel<BlogPost, BlogPost.ConstructorInput, BlogPost.Encoded, BlogPost.Props>()({
  id: defaultProp(BlogPostId, () => BlogPostId.create()),
  title: prop(ReasonableString),
  body: prop(LongString),
  createdAt: defaultProp(date)
}) {}
/** @ignore @internal @deprecated */
export type BlogPostConstructor = typeof BlogPost

// codegen:start {preset: model}
//
/* eslint-disable */
export interface BlogPost {
  readonly body: LongString
  readonly createdAt: Date
  readonly id: BlogPostId
  readonly title: ReasonableString
}
export namespace BlogPost {
  /**
   * @tsplus type BlogPost.Encoded
   */
  export interface Encoded {
    readonly body: string
    readonly createdAt: string
    readonly id: string
    readonly title: string
  }
  export const Encoded: EncodedOps = { $: {} }
  /**
   * @tsplus type BlogPost.Encoded/Aspects
   */
  export interface EncodedAspects {}
  /**
   * @tsplus type BlogPost.Encoded/Ops
   */
  export interface EncodedOps { $: EncodedAspects }
  export interface ConstructorInput
    extends ConstructorInputFromApi<typeof BlogPost> {}
  export interface Props extends GetProvidedProps<typeof BlogPost> {}
}
/* eslint-enable */
//
// codegen:end
//
/* eslint-disable */