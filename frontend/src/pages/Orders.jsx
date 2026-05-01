import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [selected, setSelected] = useState(null)
  const [idor, setIdor] = useState('')
  const [idorResult, setIdorResult] = useState(null)

  useEffect(() => {
    axios.get('/api/orders/').then(r => setOrders(r.data)).catch(console.error)
  }, [])

  const fetchOrderById = async () => {
    if (!idor) return
    try {
      const res = await axios.get(`/api/orders/${idor}`)
      setIdorResult(res.data)
    } catch (e) {
      setIdorResult({ error: e.response?.data?.error || 'Not found' })
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-white mb-8">Order History</h1>

      {/* IDOR test box — looks like a "track order" feature */}
      <div className="glass rounded-2xl p-5 mb-8 border border-indigo-500/20">
        <h3 className="font-semibold text-white mb-1">Track Any Order</h3>
        <p className="text-xs text-gray-500 mb-3">Enter an order ID to track its status</p>
        <div className="flex gap-2">
          <input
            type="number"
            value={idor}
            onChange={e => setIdor(e.target.value)}
            placeholder="Order ID"
            className="rounded-xl px-3 py-2 text-sm w-32"
          />
          <button
            onClick={fetchOrderById}
            className="px-4 py-2 rounded-xl text-white text-sm btn-accent"
          >
            Track
          </button>
        </div>
        {idorResult && (
          <pre className="mt-3 glass rounded-xl p-3 text-xs text-gray-300 overflow-auto max-h-48">
            {JSON.stringify(idorResult, null, 2)}
          </pre>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="glass-strong rounded-3xl p-12 text-center text-gray-500">
          <p>No orders yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map(order => (
            <div key={order.id} className="glass rounded-2xl p-5 flex gap-4">
              <img
                src={order.image_url}
                alt={order.product_name}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                onError={e => { e.target.src = 'https://via.placeholder.com/64/1a1a2e/6366f1?text=V' }}
              />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-white">{order.product_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Order #{order.id} · Qty {order.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold gradient-text">${order.total.toFixed(2)}</p>
                    <p className="text-xs text-gray-600 mt-0.5">••••{order.card_last4}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">{order.address} · {new Date(order.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
