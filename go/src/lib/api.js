import { getToken, getRefreshToken, setTokens, clearAuth } from './auth'

const API_BASE =
  typeof location !== 'undefined' &&
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3001'
    : '/shred/api'

let refreshPromise = null

async function refreshAccessToken() {
  const refresh = getRefreshToken()
  if (!refresh) throw new Error('no refresh token')
  const res = await fetch(API_BASE + '/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  })
  if (!res.ok) throw new Error('refresh failed')
  const data = await res.json()
  setTokens(data.access_token, data.refresh_token)
  return data.access_token
}

async function request(method, path, body) {
  let token = getToken()

  const doFetch = (t) => {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    }
    if (t) opts.headers['Authorization'] = `Bearer ${t}`
    if (body !== undefined) opts.body = JSON.stringify(body)
    return fetch(API_BASE + path, opts)
  }

  let res = await doFetch(token)

  // If 401, try refresh once
  if (res.status === 401 && getRefreshToken()) {
    try {
      // Deduplicate concurrent refresh calls
      if (!refreshPromise) refreshPromise = refreshAccessToken()
      token = await refreshPromise
      refreshPromise = null
      res = await doFetch(token)
    } catch {
      refreshPromise = null
      clearAuth()
      window.location.reload()
      throw new Error('session expired')
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Auth ──

export async function login(username, password) {
  const res = await fetch(API_BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'login failed')
  }
  const data = await res.json()
  setTokens(data.access_token, data.refresh_token, data.user)
  return data.user
}

export async function signup(username, display_name, password, invite_code) {
  const res = await fetch(API_BASE + '/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, display_name, password, invite_code }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'signup failed')
  }
  const data = await res.json()
  setTokens(data.access_token, data.refresh_token, data.user)
  return data.user
}

export function getMe() {
  return request('GET', '/auth/me')
}

// ── Settings ──

export function fetchSettings() {
  return request('GET', '/settings')
}

export function updateSettings(settings) {
  return request('PUT', '/settings', settings)
}

// ── Nutrition entries ──

export function getEntries(date) {
  return request('GET', `/entries?date=${date}`)
}

export function addEntry(entry) {
  return request('POST', '/entries', entry)
}

export function updateEntry(id, entry) {
  return request('PUT', `/entries/${id}`, entry)
}

export function deleteEntry(id) {
  return request('DELETE', `/entries/${id}`)
}

// ── Saved meals ──

export function getSavedMeals() {
  return request('GET', '/saved-meals')
}

export function addSavedMeal(meal) {
  return request('POST', '/saved-meals', meal)
}

export function updateSavedMeal(id, meal) {
  return request('PUT', `/saved-meals/${id}`, meal)
}

export function deleteSavedMeal(id) {
  return request('DELETE', `/saved-meals/${id}`)
}

// ── Weight ──

export function getWeight(days = 30) {
  return request('GET', `/weight?days=${days}`)
}

export function logWeight(weight_lbs) {
  return request('POST', '/weight', { weight_lbs })
}

// ── History ──

export function getHistory() {
  return request('GET', '/history')
}

export function getWeeklyHistory() {
  return request('GET', '/history/weekly')
}

// ── Training ──

export function fetchPlan() {
  return request('GET', '/training/plan')
}

export function savePlan(plan_json, muscles_json, generated_from) {
  return request('POST', '/training/plan', { plan_json, muscles_json, generated_from })
}

export function fetchTrainingState() {
  return request('GET', '/training/state')
}

export function saveTrainingState(state) {
  return request('PUT', '/training/state', { state })
}

// ── Onboarding ──

export function submitOnboarding(data) {
  return request('POST', '/onboarding', data)
}

export function getOnboarding() {
  return request('GET', '/onboarding')
}

export function generatePlan() {
  return request('POST', '/training/generate')
}

// ── AI ──

export async function analyzePhoto(base64, mediaType = 'image/jpeg') {
  return request('POST', '/ai/photo', { image: base64, mediaType })
}

export function estimateText(text) {
  return request('POST', '/ai/estimate', { text })
}

export async function askCoach(messages, context = {}) {
  let system = "You are an expert coach for RP (Renaissance Periodization) training and nutrition. Keep answers concise and practical — the user is typically at the gym or in the kitchen."
  if (context.day) system += ` Today's session: ${context.day}, Week ${context.week}.`
  if (context.context === 'nutrition' && context.totals) {
    system += ` Today's nutrition so far: ${context.totals.calories} cal, ${context.totals.protein}g protein.`
  }

  const payload = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system,
    messages: messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content })),
  }

  const data = await request('POST', '/coach', payload)
  const text = data?.content?.[0]?.text
  if (!text) throw new Error(data?.error?.message || 'No response')
  return text
}

// ── Admin ──

export function adminGetUsers() {
  return request('GET', '/admin/users')
}

export function adminGetUser(id) {
  return request('GET', `/admin/users/${id}`)
}

export function adminDeleteUser(id) {
  return request('DELETE', `/admin/users/${id}`)
}

export function adminCreateInviteCodes(count = 1) {
  return request('POST', '/admin/invite-codes', { count })
}

export function adminGetInviteCodes() {
  return request('GET', '/admin/invite-codes')
}
