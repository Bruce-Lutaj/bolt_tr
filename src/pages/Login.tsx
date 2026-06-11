import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, Mail, Lock, User, ArrowRight, Shield } from 'lucide-react'
import { useAuth } from '../features/auth'
import { ROUTES } from '../shared/routes'

type AuthMethod = 'smartuser' | 'supabase'

export default function Login() {
  const { login, signup, loginWithSmartUser, signupWithSmartUser, enterGuest } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [authMethod, setAuthMethod] = useState<AuthMethod>('smartuser')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleGuest() {
    enterGuest()
    navigate(ROUTES.home, { replace: true })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfoMessage(null)
    setSubmitting(true)

    if (authMethod === 'smartuser') {
      if (mode === 'login') {
        const err = await loginWithSmartUser(email, password)
        setSubmitting(false)
        if (err) {
          setError(err)
        } else {
          navigate(ROUTES.home, { replace: true })
        }
      } else {
        const err = await signupWithSmartUser(email, password)
        setSubmitting(false)
        if (err) {
          setError(err)
        } else {
          navigate(ROUTES.home, { replace: true })
        }
      }
    } else {
      if (mode === 'login') {
        const err = await login(email, password)
        setSubmitting(false)
        if (err) {
          setError(err)
        } else {
          navigate(ROUTES.home, { replace: true })
        }
      } else {
        const result = await signup(email, password, displayName.trim() || undefined)
        setSubmitting(false)
        if (result.error) {
          setError(result.error)
        } else if (result.needsConfirmation) {
          setInfoMessage('Check your email to confirm your account.')
        } else {
          navigate(ROUTES.home, { replace: true })
        }
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-green-600/20 rounded-2xl flex items-center justify-center mb-4">
            <Dumbbell size={32} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">GymTrack</h1>
          <p className="text-slate-500 text-sm mt-1">Track workouts. See progress.</p>
        </div>

        {/* Auth method tabs */}
        <div className="flex gap-1 p-1 bg-slate-900 rounded-lg mb-5 border border-slate-800">
          <button
            type="button"
            onClick={() => { setAuthMethod('smartuser'); setError(null); setInfoMessage(null) }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-xs font-medium transition-colors ${
              authMethod === 'smartuser'
                ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Shield size={13} />
            SmartUser
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod('supabase'); setError(null); setInfoMessage(null) }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-xs font-medium transition-colors ${
              authMethod === 'supabase'
                ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Mail size={13} />
            Email
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && authMethod === 'supabase' && (
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name (optional)"
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-colors text-sm"
              />
            </div>
          )}

          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-colors text-sm"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-colors text-sm"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          {infoMessage && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-xs">{infoMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 w-full h-12 bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm active:scale-[0.98]"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'login'
                  ? (authMethod === 'smartuser' ? 'Continue with SmartUser' : 'Sign In')
                  : (authMethod === 'smartuser' ? 'Sign Up with SmartUser' : 'Create Account')
                }
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError(null)
              setInfoMessage(null)
            }}
            className="text-sm text-slate-400 hover:text-green-400 transition-colors"
          >
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-xs text-slate-500">or</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        <button
          onClick={handleGuest}
          className="flex items-center justify-center gap-2 w-full h-11 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors text-sm border border-slate-700"
        >
          Continue as Guest
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
