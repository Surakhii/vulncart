import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import ProductCard from '../components/ProductCard'

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q) return
    setLoading(true)
    setError(null)
    axios.get('/api/products/search', { params: { q } })
      .then(res => setResults(res.data))
      .catch(err => {
        const data = err.response?.data
        // VULN #4: Error message reflects raw q (from backend), rendered here
        // In a real app this might be rendered as HTML — here it's just text but the
        // backend returns the raw q in the error which is the vuln evidence
        setError(data?.error || 'Search failed')
      })
      .finally(() => setLoading(false))
  }, [q])

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Search results for <span className="gradient-text">"{q}"</span>
        </h1>
        <p className="text-gray-500 mt-1">{results.length} products found</p>
      </div>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="glass rounded-2xl h-64 animate-pulse" />)}
        </div>
      )}

      {error && (
        <div className="glass rounded-2xl p-6 border border-red-500/20 text-red-400">
          <p className="font-semibold">Search Error</p>
          {/* VULN #4: error string from backend contains raw q value */}
          <p className="text-sm mt-1 font-mono text-red-300">{error}</p>
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center text-gray-500">
          <p className="text-lg">No products found for "{q}"</p>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
