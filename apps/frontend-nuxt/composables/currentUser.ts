// Naive login, good enough for the start

import type { UserId } from "@effect-ts-app/types/User"

export function getUserId() {
  return useCookie("user-id")
}

export function login(userId: UserId) {
  return $fetch(`/login/${userId}`)
}
