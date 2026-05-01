import { useState, useEffect } from 'react'
import axios from 'axios'

const adminHeaders = { 'X-Admin': 'true' }

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        active ? 'bg-indigo-500 text-white' : 'glass text-gray-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

export default function Admin() {
  const [tab, setTab] = useState('stats')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const [importUrl, setImportUrl] = useState('')
  const [importResult, setImportResult] = useState(null)
  const [coupon, setCoupon] = useState('')
  const [couponResult, setCouponResult] = useState(null)
  const [logFile, setLogFile] = useState('')
  const [logResult, setLogResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    axios.get('/api/admin/stats', { headers: adminHeaders })
      .then(r => setStats(r.data))
      .catch(console.error)
  }, [])

  const loadUsers = async () => {
    const res = await axios.get('/api/admin/users', { headers: adminHeaders })
    setUsers(res.data)
  }

  const loadOrders = async () => {
    const res = await axios.get('/api/admin/orders', { headers: adminHeaders })
    setOrders(res.data)
  }

  useEffect(() => {
    if (tab === 'users') loadUsers()
    if (tab === 'orders') loadOrders()
  }, [tab])

  const doImport = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post('/api/admin/import-image', { url: importUrl }, { headers: adminHeaders })
      setImportResult(res.data)
    } catch (e) {
      setImportResult(e.response?.data || { error: 'Failed' })
    } finally {
      setLoading(false)
    }
  }

  const doCoupon = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post('/api/admin/coupon', { code: coupon }, { headers: adminHeaders })
      setCouponResult(res.data)
    } catch (e) {
      setCouponResult(e.response?.data || { error: 'Failed' })
    } finally {
      setLoading(false)
    }
  }

  const doReadLog = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.get('/api/admin/logs', { params: { file: logFile }, headers: adminHeaders })
      setLogResult(res.data)
    } catch (e) {
      setLogResult(e.response?.data || { error: 'Failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">VulnCart management console</p>
        </div>
        <span className="badge bg-red-500/20 text-red-300 border border-red-500/30">ADMIN ACCESS</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {['stats', 'users', 'orders', 'import', 'coupon', 'logs'].map(t => (
          <Tab key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={tab === t} onClick={() => setTab(t)} />
        ))}
      </div>

      {/* Stats */}
      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Users', value: stats.users, color: 'text-blue-400' },
            { label: 'Products', value: stats.products, color: 'text-purple-400' },
            { label: 'Orders', value: stats.orders, color: 'text-cyan-400' },
            { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}`, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="glass-strong rounded-2xl p-6 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-500">
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Username</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Password (MD5)</th>
                <th className="text-left p-4">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 text-gray-500">#{u.id}</td>
                  <td className="p-4 text-white font-medium">{u.username}</td>
                  <td className="p-4 text-gray-400">{u.email}</td>
                  <td className="p-4 font-mono text-xs text-yellow-500 truncate max-w-[200px]">{u.password}</td>
                  <td className="p-4">
                    <span className={`badge ${u.role === 'admin' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/20'} border`}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders */}
      {tab === 'orders' && (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-500">
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">User</th>
                <th className="text-left p-4">Product</th>
                <th className="text-left p-4">Total</th>
                <th className="text-left p-4">Address</th>
                <th className="text-left p-4">Card</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 text-gray-500">#{o.id}</td>
                  <td className="p-4 text-white">{o.username}</td>
                  <td className="p-4 text-gray-400">{o.product_name}</td>
                  <td className="p-4 text-green-400 font-bold">${o.total.toFixed(2)}</td>
                  <td className="p-4 text-gray-500 max-w-[200px] truncate">{o.address}</td>
                  <td className="p-4 font-mono text-xs text-gray-500">••••{o.card_last4}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Import Image — SSRF */}
      {tab === 'import' && (
        <div className="max-w-lg">
          <div className="glass-strong rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-1">Import Product Image</h3>
            <p className="text-xs text-gray-500 mb-4">Enter a URL to fetch and store a product image</p>
            <form onSubmit={doImport} className="flex flex-col gap-3">
              <input
                type="text"
                value={importUrl}
                onChange={e => setImportUrl(e.target.value)}
                placeholder="https://example.com/product.jpg"
                className="rounded-xl px-4 py-2.5 text-sm"
                required
              />
              <button type="submit" disabled={loading} className="px-4 py-2.5 rounded-xl text-white text-sm btn-accent disabled:opacity-50">
                {loading ? 'Fetching...' : 'Import Image'}
              </button>
            </form>
            {importResult && (
              <pre className="mt-4 glass rounded-xl p-3 text-xs text-gray-300 overflow-auto max-h-64">
                {JSON.stringify(importResult, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Coupon — Command Injection */}
      {tab === 'coupon' && (
        <div className="max-w-lg">
          <div className="glass-strong rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-1">Apply Coupon Code</h3>
            <p className="text-xs text-gray-500 mb-4">Validate a discount coupon against the system</p>
            <form onSubmit={doCoupon} className="flex flex-col gap-3">
              <input
                type="text"
                value={coupon}
                onChange={e => setCoupon(e.target.value)}
                placeholder="SAVE20"
                className="rounded-xl px-4 py-2.5 text-sm font-mono"
                required
              />
              <button type="submit" disabled={loading} className="px-4 py-2.5 rounded-xl text-white text-sm btn-accent disabled:opacity-50">
                {loading ? 'Validating...' : 'Validate Coupon'}
              </button>
            </form>
            {couponResult && (
              <pre className="mt-4 glass rounded-xl p-3 text-xs text-gray-300 overflow-auto max-h-48">
                {JSON.stringify(couponResult, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Logs — LFI */}
      {tab === 'logs' && (
        <div className="max-w-lg">
          <div className="glass-strong rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-1">View System Logs</h3>
            <p className="text-xs text-gray-500 mb-4">Read log files from the server</p>
            <form onSubmit={doReadLog} className="flex flex-col gap-3">
              <input
                type="text"
                value={logFile}
                onChange={e => setLogFile(e.target.value)}
                placeholder="app.log"
                className="rounded-xl px-4 py-2.5 text-sm font-mono"
                required
              />
              <button type="submit" disabled={loading} className="px-4 py-2.5 rounded-xl text-white text-sm btn-accent disabled:opacity-50">
                {loading ? 'Reading...' : 'Read Log'}
              </button>
            </form>
            {logResult && (
              <pre className="mt-4 glass rounded-xl p-3 text-xs text-gray-300 overflow-auto max-h-64">
                {JSON.stringify(logResult, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
