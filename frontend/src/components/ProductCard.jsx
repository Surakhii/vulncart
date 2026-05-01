import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function ProductCard({ product }) {
  const { addToCart } = useCart()

  return (
    <div className="glass product-card rounded-2xl overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-black/20">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          onError={e => { e.target.src = 'https://via.placeholder.com/400x300/1a1a2e/6366f1?text=VulnCart' }}
        />
        <div className="absolute top-3 left-3">
          <span className="badge bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {product.category}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <Link
            to={`/product/${product.id}`}
            className="font-semibold text-white hover:text-indigo-400 transition-colors line-clamp-1"
          >
            {product.name}
          </Link>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <span className="text-xl font-bold gradient-text">${product.price.toFixed(2)}</span>
          <button
            onClick={() => addToCart(product)}
            className="px-3 py-1.5 rounded-xl text-sm text-white btn-accent"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}
