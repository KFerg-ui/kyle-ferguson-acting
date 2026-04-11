import { useState, useEffect } from 'react'
import { isLoggedIn, getUser, clearAuth } from './lib/auth'
import { getMe, fetchSettings, updateSettings, saveTrainingState } from './lib/api'
import { DEFAULTS } from './lib/settings'
import LoginPage from './components/auth/LoginPage'
import SignupPage from './components/auth/SignupPage'
import OnboardingWizard from './components/onboarding/OnboardingWizard'
import BottomNav from './components/nav/BottomNav'
import CoachFAB from './components/nav/CoachFAB'
import TrainView from './components/train/TrainView'
import EatView from './components/eat/EatView'
import StatsView from './components/stats/StatsView'
import AdminView from './components/admin/AdminView'
import CoachSheet from './components/coach/CoachSheet'
import SettingsSheet from './components/shared/SettingsSheet'

export default function App() {
  const [user, setUser] = useState(getUser)
  const [authPage, setAuthPage] = useState('login') // 'login' or 'signup'
  const [tab, setTab] = useState('eat')
  const [coachOpen, setCoachOpen] = useState(false)
  const [coachCtx, setCoachCtx] = useState({})
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState(DEFAULTS)
  const [loadingUser, setLoadingUser] = useState(true)

  // On mount, verify token and fetch user + settings
  useEffect(() => {
    if (!isLoggedIn()) {
      setLoadingUser(false)
      return
    }
    async function init() {
      try {
        const [me, s] = await Promise.all([getMe(), fetchSettings()])
        setUser(me)
        setSettings({ ...DEFAULTS, ...s })

        // Migrate localStorage training state if exists
        migrateLocalStorage()
      } catch {
        // Token expired or invalid
        clearAuth()
        setUser(null)
      } finally {
        setLoadingUser(false)
      }
    }
    init()
  }, [])

  // One-time migration of localStorage data to server
  async function migrateLocalStorage() {
    const stateKey = 'gymshred-state-v1'
    const settingsKey = 'gymshred-settings-v1'
    try {
      const raw = localStorage.getItem(stateKey)
      if (raw) {
        await saveTrainingState(JSON.parse(raw))
        localStorage.removeItem(stateKey)
      }
    } catch {}
    try {
      const raw = localStorage.getItem(settingsKey)
      if (raw) {
        await updateSettings(JSON.parse(raw))
        localStorage.removeItem(settingsKey)
      }
    } catch {}
  }

  function handleAuth(userData) {
    setUser(userData)
    // Fetch settings for the new user
    fetchSettings().then(s => setSettings({ ...DEFAULTS, ...s })).catch(() => {})
  }

  function handleLogout() {
    clearAuth()
    setUser(null)
    setSettingsOpen(false)
  }

  function openCoach(ctx = {}) {
    setCoachCtx(ctx)
    setCoachOpen(true)
  }

  async function handleSettingsSave(next) {
    setSettings(next)
    setSettingsOpen(false)
    try { await updateSettings(next) } catch {}
  }

  function handleOnboardingComplete() {
    // Refresh user data (onboarding_complete should now be 1)
    getMe().then(me => setUser(me)).catch(() => {})
    fetchSettings().then(s => setSettings({ ...DEFAULTS, ...s })).catch(() => {})
  }

  // Loading state
  if (loadingUser) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Loading...</p>
      </div>
    )
  }

  // Not logged in — show login or signup
  if (!user) {
    if (authPage === 'signup') {
      return <SignupPage onAuth={handleAuth} onGoLogin={() => setAuthPage('login')} />
    }
    return <LoginPage onAuth={handleAuth} onGoSignup={() => setAuthPage('signup')} />
  }

  // Logged in but onboarding not complete
  if (!user.onboarding_complete) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />
  }

  // Main app
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      {tab === 'train' && (
        <TrainView openCoach={openCoach} onOpenSettings={() => setSettingsOpen(true)} settings={settings} />
      )}
      {tab === 'eat' && (
        <EatView openCoach={openCoach} onOpenSettings={() => setSettingsOpen(true)} settings={settings} />
      )}
      {tab === 'stats' && (
        <StatsView onOpenSettings={() => setSettingsOpen(true)} settings={settings} />
      )}
      {tab === 'admin' && user.role === 'admin' && (
        <AdminView />
      )}
      <CoachFAB onClick={() => setCoachOpen(true)} />
      <BottomNav tab={tab} setTab={setTab} isAdmin={user.role === 'admin'} />
      <CoachSheet open={coachOpen} onClose={() => setCoachOpen(false)} ctx={coachCtx} />
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={handleSettingsSave}
        onLogout={handleLogout}
        user={user}
      />
    </div>
  )
}
