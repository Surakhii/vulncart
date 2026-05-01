import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form.username, form.email, form.password)
      await login(form.username, form.password)
      navigate('/')
    } catch (e) {
      setError(e.response?.data?.error || 'Registration failed')
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
            <h1 className="text-2xl font-bold text-white">Create account</h1>
            <p className="text-gray-500 mt-1 text-sm">Join VulnCart today</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {['username', 'email', 'password'].map(field => (
              <div key={field}>
                <label className="text-xs text-gray-500 font-medium uppercase tracking-wider block mb-1.5">
                  {field}
                </label>
                <input
                  type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={field === 'email' ? 'you@example.com' : field === 'username' ? 'johndoe' : '••••••••'}
                  className="w-full rounded-xl px-4 py-2.5 text-sm"
                  required
                />
              </div>
            ))}

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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
