import type { Selectors } from "./selectors"

// function untag<T>(a: T & UnionBrand) :T
// const POTab = untag(null as Id<PurchaseOrderTabKey>)
// const PJTab = untag(null as Id<ProjectTabKey>)

// type Id<T extends string> = UnionBrand & T

export type EnhancedSelectors = Selectors // TODO | custom ones

export type TestSelector = EnhancedSelectors | `${EnhancedSelectors}${` ` | `:`}${string}`
