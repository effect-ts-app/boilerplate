// Poor man's RBAC

import type { Role } from "./User"

/**
 * Allow role access
 */
export function allowRoles(role: Role, ...roles: readonly Role[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (cls: any) => {
    Object.assign(cls, { allowedRoles: [role, ...roles] })
    return cls
  }
}
