import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`w-4 h-4 ${i <= rating ? 'star' : 'star-empty'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function ReviewBox({ review }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-500/30 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300">
            {review.username[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium text-white">{review.username}</span>
        </div>
        <Stars rating={review.rating} />
      </div>
      {/* VULN #2: dangerouslySetInnerHTML renders stored XSS payloads */}
      <p
        className="text-sm text-gray-400"
        dangerouslySetInnerHTML={{ __html: review.content }}
      />
    </div>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewText, setReviewText] = useState('')
  const [rating, setRating] = useState(5)
  const [submitting, setSubmitting] = useState(false)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    axios.get(`/api/products/${id}`).then(r => setProduct(r.data)).catch(console.error)
    loadReviews()
  }, [id])

  const loadReviews = () => {
    axios.get(`/api/reviews/${id}`).then(r => setReviews(r.data)).catch(console.error)
  }

  const submitReview = async (e) => {
    e.preventDefault()
    if (!reviewText.trim()) return
    setSubmitting(true)
    try {
      await axios.post(`/api/reviews/${id}`, { content: reviewText, rating })
      setReviewText('')
      loadReviews()
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to post review')
    } finally {
      setSubmitting(false)
    }
  }

  if (!product) return (
    <div className="max-w-7xl mx-auto px-6 py-20 text-center text-gray-500">Loading...</div>
  )

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="grid md:grid-cols-2 gap-10 mb-12">
        {/* Image */}
        <div className="glass-strong rounded-3xl overflow-hidden h-80 md:h-auto">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={e => { e.target.src = 'https://via.placeholder.com/600x400/1a1a2e/6366f1?text=VulnCart' }}
          />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-6">
          <div>
            <span className="badge bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3 inline-block">
              {product.category}
            </span>
            <h1 className="text-3xl font-bold text-white">{product.name}</h1>
            <p className="text-gray-400 mt-3">{product.description}</p>
          </div>

          <div className="text-4xl font-bold gradient-text">${product.price.toFixed(2)}</div>

          <div className="glass-strong rounded-2xl p-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg glass flex items-center justify-center text-white hover:bg-white/10">−</button>
              <span className="text-white font-medium w-6 text-center">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="w-8 h-8 rounded-lg glass flex items-center justify-center text-white hover:bg-white/10">+</button>
            </div>
            <button
              onClick={() => addToCart(product, qty)}
              className="flex-1 py-2.5 rounded-xl text-white font-semibold btn-accent text-center"
            >
              Add {qty} to Cart
            </button>
          </div>

          <div className="glass rounded-2xl p-4 text-sm text-gray-400">
            <div className="flex justify-between mb-1">
              <span>In Stock</span>
              <span className="text-green-400 font-medium">{product.stock} units</span>
            </div>
            <div className="flex justify-between">
              <span>Product ID</span>
              <span className="text-gray-500 font-mono">#{product.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">Customer Reviews ({reviews.length})</h2>

        {/* Review form */}
        {user && (
          <form onSubmit={submitReview} className="glass-strong rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-white mb-4">Write a Review</h3>
            <div className="flex gap-1 mb-3">
              {[1,2,3,4,5].map(s => (
                <button key={s} type="button" onClick={() => setRating(s)}>
                  <svg className={`w-6 h-6 ${s <= rating ? 'star' : 'star-empty'} hover:star`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              rows={3}
              placeholder="Share your experience..."
              className="w-full rounded-xl px-4 py-3 text-sm resize-none mb-3"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-xl text-white text-sm btn-accent disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post Review'}
            </button>
          </form>
        )}

        {/* Review list */}
        <div className="grid gap-3">
          {reviews.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-gray-500">
              No reviews yet — be the first!
            </div>
          ) : (
            reviews.map(r => <ReviewBox key={r.id} review={r} />)
          )}
        </div>
      </div>
    </div>
  )
}
