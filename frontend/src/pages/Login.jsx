import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.username, form.password)
      navigate(user.role === 'admin' ? '/admin' : '/')
    } catch (e) {
      setError(e.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="glass-strong rounded-3xl p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl btn-accent flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">V</div>
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-gray-500 mt-1 text-sm">Sign in to your VulnCart account</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wider block mb-1.5">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="alice"
                className="w-full rounded-xl px-4 py-2.5 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wider block mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-2.5 text-sm"
                required
              />
            </div>

            {error && (
              <div className="glass rounded-xl p-3 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-white font-semibold btn-accent disabled:opacity-50 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300">Sign up</Link>
            </p>
          </div>

          {/* Test creds hint */}
          <div className="mt-4 glass rounded-xl p-3 text-xs text-gray-600">
            <p className="font-mono">alice / password123</p>
            <p className="font-mono">admin / admin</p>
          </div>
        </div>
      </div>
    </div>
  )
}
