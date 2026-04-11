const TOKEN_KEY = 'shred-token'
const REFRESH_KEY = 'shred-refresh'
const USER_KEY = 'shred-user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
}

export function setTokens(access, refresh, user) {
  localStorage.setItem(TOKEN_KEY, access)
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
  // Clean up old single-password keys
  localStorage.removeItem('shred-auth')
  localStorage.removeItem('shred-auth-ts')
  sessionStorage.removeItem('shred-auth')
}

export function isLoggedIn() {
  return !!getToken()
}
