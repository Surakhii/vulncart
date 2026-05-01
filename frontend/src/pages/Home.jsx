import { useState, useEffect } from 'react'
import axios from 'axios'
import ProductCard from '../components/ProductCard'

const CATEGORIES = ['All', 'Audio', 'Phones', 'Laptops', 'XR', 'Cameras', 'Wearables', 'Tablets', 'Monitors', 'Drones', 'Storage', 'Smart Home', 'Accessories']

export default function Home() {
  const [products, setProducts] = useState([])
  const [featured, setFeatured] = useState(null)
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [category])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = category !== 'All' ? { category } : {}
      const res = await axios.get('/api/products/', { params })
      setProducts(res.data)
      if (!featured && res.data.length > 0) setFeatured(res.data[2])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Hero */}
      {featured && (
        <div className="glass-strong rounded-3xl overflow-hidden mb-10 grid md:grid-cols-2 gap-0 min-h-[320px]">
          <div className="p-10 flex flex-col justify-center gap-6">
            <div>
              <span className="badge bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-4 inline-block">
                Featured
              </span>
              <h1 className="text-4xl font-bold text-white leading-tight">
                {featured.name}
              </h1>
              <p className="text-gray-400 mt-3 text-lg">{featured.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold gradient-text">${featured.price.toFixed(2)}</span>
              <a
                href={`/product/${featured.id}`}
                className="px-6 py-2.5 rounded-xl text-white font-semibold btn-accent"
              >
                View Product →
              </a>
            </div>
          </div>
          <div className="relative overflow-hidden bg-black/20">
            <img
              src={featured.image_url}
              alt={featured.name}
              className="w-full h-full object-cover"
              onError={e => { e.target.src = 'https://via.placeholder.com/600x320/1a1a2e/6366f1?text=VulnCart' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#09090f]/60 via-transparent to-transparent" />
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-8">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
              category === cat
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                : 'glass text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">
          {category === 'All' ? 'All Products' : category}
          <span className="text-gray-500 font-normal text-base ml-2">({products.length} items)</span>
        </h2>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
