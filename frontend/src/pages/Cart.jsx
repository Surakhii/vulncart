import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { cart, removeFromCart, updateQty, clearCart, total } = useCart()
  const navigate = useNavigate()
  const [checkout, setCheckout] = useState(false)
  const [form, setForm] = useState({ address: '', card: '' })
  const [placing, setPlacing] = useState(false)

  const placeOrders = async (e) => {
    e.preventDefault()
    setPlacing(true)
    try {
      for (const item of cart) {
        await axios.post('/api/orders/', {
          product_id: item.id,
          quantity: item.quantity,
          address: form.address,
          card_last4: form.card.slice(-4)
        })
      }
      clearCart()
      navigate('/orders')
    } catch (e) {
      alert(e.response?.data?.error || 'Order failed')
    } finally {
      setPlacing(false)
    }
  }

  if (cart.length === 0) return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-center">
      <div className="glass-strong rounded-3xl p-12">
        <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h2 className="text-xl font-bold text-white mb-2">Cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some products to get started</p>
        <a href="/" className="px-6 py-2.5 rounded-xl text-white btn-accent inline-block">Browse Products</a>
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-white mb-8">Your Cart</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-2 flex flex-col gap-3">
          {cart.map(item => (
            <div key={item.id} className="glass rounded-2xl p-4 flex gap-4">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                onError={e => { e.target.src = 'https://via.placeholder.com/80/1a1a2e/6366f1?text=V' }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{item.name}</p>
                <p className="text-indigo-400 font-bold mt-1">${item.price.toFixed(2)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-6 h-6 rounded glass text-white text-sm flex items-center justify-center hover:bg-white/10">−</button>
                  <span className="text-sm text-white w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-6 h-6 rounded glass text-white text-sm flex items-center justify-center hover:bg-white/10">+</button>
                  <button onClick={() => removeFromCart(item.id)} className="ml-auto text-xs text-red-400 hover:text-red-300">Remove</button>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white font-bold">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="glass-strong rounded-2xl p-6 h-fit">
          <h3 className="font-bold text-white mb-4">Order Summary</h3>
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Items ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400 mb-4">
            <span>Shipping</span>
            <span className="text-green-400">Free</span>
          </div>
          <div className="border-t border-white/10 pt-4 mb-6">
            <div className="flex justify-between font-bold text-white text-lg">
              <span>Total</span>
              <span className="gradient-text">${total.toFixed(2)}</span>
            </div>
          </div>

          {!checkout ? (
            <button
              onClick={() => setCheckout(true)}
              className="w-full py-2.5 rounded-xl text-white font-semibold btn-accent"
            >
              Proceed to Checkout
            </button>
          ) : (
            <form onSubmit={placeOrders} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Shipping address"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="w-full rounded-xl px-3 py-2 text-sm"
                required
              />
              <input
                type="text"
                placeholder="Card number (fake)"
                value={form.card}
                onChange={e => setForm(f => ({ ...f, card: e.target.value }))}
                className="w-full rounded-xl px-3 py-2 text-sm"
                required
              />
              <button
                type="submit"
                disabled={placing}
                className="w-full py-2.5 rounded-xl text-white font-semibold btn-accent disabled:opacity-50"
              >
                {placing ? 'Placing...' : 'Place Order'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
