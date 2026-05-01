import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { cart } = useCart()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`)
    }
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg btn-accent flex items-center justify-center text-white font-bold text-sm">V</div>
          <span className="font-bold text-white text-lg tracking-tight">VulnCart</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-xl px-4 py-2 pl-10 text-sm"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </form>

        {/* Nav links */}
        <div className="flex items-center gap-2 ml-auto">
          {user ? (
            <>
              {/* Cart */}
              <Link to="/cart" className="relative p-2 rounded-xl hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Orders */}
              <Link to="/orders" className="px-3 py-1.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                Orders
              </Link>

              {/* Admin */}
              {user.role === 'admin' && (
                <Link to="/admin" className="px-3 py-1.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                  Admin
                </Link>
              )}

              {/* User */}
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <div className="w-8 h-8 rounded-full bg-indigo-500/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 text-sm font-bold">
                  {user.username[0].toUpperCase()}
                </div>
                <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-red-400 transition-colors"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-1.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                Login
              </Link>
              <Link to="/register" className="px-4 py-1.5 rounded-xl text-sm text-white btn-accent">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
