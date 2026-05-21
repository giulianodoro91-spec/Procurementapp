import { useEffect, useState } from 'react'
import './App.css'

const API = '/api'

function ImportTable({ rows }) {
  if (!rows?.length) return null
  const allKeys = rows.reduce((set, row) => {
    Object.keys(row).forEach(key => set.add(key))
    return set
  }, new Set())
  const headers = Array.from(allKeys)
  return (
    <table className="data-table">
      <thead>
        <tr>{headers.map(key => <th key={key}>{key}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {headers.map(key => <td key={key}>{row[key] ?? ''}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ImportPage() {
  const [status, setStatus] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setStatus('Uploading...')
    setError('')
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API}/bom/upload`, { method: 'POST', body: fd })
      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch (parseErr) {
        throw new Error(`Invalid JSON response: ${text}`)
      }
      if (!res.ok) throw new Error(data?.error || `${res.status} ${res.statusText}`)
      setResult(data)
      setStatus(`Imported ${data.imported?.length ?? 0} row(s). Skipped ${data.skipped?.length ?? 0}.`)
    } catch (err) {
      setError(err.message)
      setStatus('Upload failed')
    }
  }

  return (
    <section className="page-card">
      <div className="page-header">
        <div>
          <h2>Import BOM</h2>
          <p className="page-description">Upload an Excel BOM file and load it into the database.</p>
        </div>
      </div>
      <div className="page-actions">
        <label className="file-input">
          <span>Select Excel file</span>
          <input type="file" accept=".xls,.xlsx" onChange={handleFile} />
        </label>
        <div className="status-text">{status}</div>
      </div>
      {error && <div className="error-card">{error}</div>}
      {result && (
        <div>
          <p>Parsed rows: {result.parsed}</p>
          <p>Imported: {result.imported?.length ?? 0}</p>
          <p>Skipped: {result.skipped?.length ?? 0}</p>
          {result.imported?.length > 0 && (
            <div>
              <h3>Imported rows</h3>
              <ImportTable rows={result.imported} />
            </div>
          )}
          {result.skipped?.length > 0 && (
            <div>
              <h3>Skipped rows</h3>
              <ImportTable rows={result.skipped} />
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function ForecastPage({ rows, setRows }) {
  const [products, setProducts] = useState([])
  const [activeSuggestion, setActiveSuggestion] = useState({ row: null, index: -1 })

  useEffect(() => { fetch(`${API}/products`).then(r => r.json()).then(setProducts) }, [])

  const updateRow = (i, key, val) => {
    const copy = [...rows]
    copy[i] = { ...copy[i], [key]: val }
    if (key === 'productName') {
      copy[i].productId = ''
      setActiveSuggestion({ row: i, index: 0 })
    }
    setRows(copy)
  }

  const chooseProduct = (i, product) => {
    const copy = [...rows]
    copy[i] = { ...copy[i], productId: String(product.id), productName: product.name }
    setRows(copy)
    setActiveSuggestion({ row: null, index: -1 })
  }

  const visibleProducts = (search) => {
    if (!search?.trim()) return []
    const term = search.trim().toLowerCase()
    return products.filter(p => p.name.toLowerCase().includes(term)).slice(0, 8)
  }

  const handleKeyDown = (event, i, suggestions) => {
    if (!suggestions.length) return
    const { key } = event
    if (key === 'ArrowDown') {
      event.preventDefault()
      const next = activeSuggestion.row === i ? Math.min(activeSuggestion.index + 1, suggestions.length - 1) : 0
      setActiveSuggestion({ row: i, index: next })
    } else if (key === 'ArrowUp') {
      event.preventDefault()
      if (activeSuggestion.row !== i) return
      const prev = Math.max(activeSuggestion.index - 1, 0)
      setActiveSuggestion({ row: i, index: prev })
    } else if (key === 'Enter') {
      if (activeSuggestion.row === i && activeSuggestion.index >= 0) {
        event.preventDefault()
        chooseProduct(i, suggestions[activeSuggestion.index])
      }
    } else if (key === 'Escape') {
      setActiveSuggestion({ row: null, index: -1 })
    }
  }

  const addRow = () => setRows(r => [...r, { productId: '', productName: '', quantity: '' }])
  const clearForecast = () => setRows([{ productId: '', productName: '', quantity: '' }])
  const save = async () => {
    const payload = rows.map(r => ({ productId: Number(r.productId), quantity: Number(r.quantity) }))
    const res = await fetch(`${API}/forecast`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) {
      const error = await res.text()
      alert(`Error saving forecast: ${error}`)
      return
    }
    alert('Saved')
  }

  return (
    <section className="page-card">
      <div className="page-header">
        <div>
          <h2>Production Forecast</h2>
          <p className="page-description">Select products and estimated quantities to generate purchase requirements.</p>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Product</th><th>Quantity</th></tr></thead>
          <tbody>
          {rows.map((r, i) => {
            const suggestions = visibleProducts(r.productName)
            return (
              <tr key={i}>
                <td>
                  <div className="product-search">
                    <input
                      value={r.productName}
                      onChange={e => updateRow(i, 'productName', e.target.value)}
                      onKeyDown={e => handleKeyDown(e, i, suggestions)}
                      placeholder="Type product name"
                      autoComplete="off"
                    />
                    {suggestions.length > 0 && r.productName && !r.productId && (
                      <ul className="suggestions">
                        {suggestions.map((product, index) => (
                          <li
                            key={product.id}
                            onClick={() => chooseProduct(i, product)}
                            className={activeSuggestion.row === i && activeSuggestion.index === index ? 'active' : ''}
                          >
                            {product.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </td>
                <td><input value={r.quantity} onChange={e=>updateRow(i,'quantity',e.target.value)} type="number"/></td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="page-actions">
        <button onClick={addRow}>Add row</button>
        <button onClick={save}>Save forecast</button>
        <button className="secondary" onClick={clearForecast}>Clear forecast</button>
      </div>
    </div>
    </section>
  )
}

function RequirementsPage() {
  const [reqs, setReqs] = useState([])

  useEffect(()=>{ 
    fetch(`${API}/requirements`)
      .then(r=>r.json())
      .then(setReqs)
  }, [])

const rawMaterials = reqs.filter(r =>
  String(r.ingredientCode ?? '').toUpperCase().startsWith('S')
)

const packagingItems = reqs.filter(r =>
  !String(r.ingredientCode ?? '').toUpperCase().startsWith('S')
)

  const copyToClipboard = async () => {
    if (!reqs.length) {
      alert('No requirements to copy')
      return
    }

    const header = ['Ingredient', 'Quantity', 'Unit']
    const rows = reqs.map(r => [r.name, r.quantity, r.unit])

    const text = [header, ...rows]
      .map(row => row.join('\t'))
      .join('\n')

    await navigator.clipboard.writeText(text)

    alert('Purchase requirements copied to clipboard')
  }

  const exportToExcel = () => {
    if (!reqs.length) {
      alert('No requirements to export')
      return
    }

    const header = ['Ingredient', 'Quantity', 'Unit']
    const rows = reqs.map(r => [r.name, r.quantity, r.unit])

    const csv = [header, ...rows]
      .map(row =>
        row.map(value =>
          `"${String(value ?? '').replaceAll('"', '""')}"`
        ).join(',')
      )
      .join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;'
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = url
    link.download = 'purchase_requirements.csv'

    link.click()

    URL.revokeObjectURL(url)
  }
  return (
    <section className="page-card">
<div className="page-header">
  <div>
    <h2>Purchase Requirements</h2>
    <p className="page-description">
      See the ingredient quantities you need to order based on forecasted production.
    </p>
  </div>

  <div className="page-actions">
    <button onClick={copyToClipboard}>
      Copy to Clipboard
    </button>

    <button onClick={exportToExcel}>
      Export to Excel
    </button>
  </div>
</div>
      <div className="table-wrap">
<h3>Raw Materials</h3>
<table className="data-table requirements-table">
  <thead>
    <tr>
<th>Code</th>
<th>Ingredient</th>
<th>Quantity</th>
<th>Unit</th>
    </tr>
  </thead>
  <tbody>
    {rawMaterials.map(r => (
      <tr key={r.ingredientId}>
<td>{r.ingredientCode}</td>
<td>{r.name}</td>
<td>{r.quantity}</td>
<td>{r.unit}</td>
      </tr>
    ))}
  </tbody>
</table>

<h3>Packaging</h3>
<table className="data-table requirements-table">
  <thead>
    <tr>
<th>Code</th>
<th>Item</th>
<th>Quantity</th>
<th>Unit</th>
    </tr>
  </thead>
  <tbody>
    {packagingItems.map(r => (
      <tr key={r.ingredientId}>
<td>{r.ingredientCode}</td>
<td>{r.name}</td>
<td>{r.quantity}</td>
<td>{r.unit}</td>
      </tr>
    ))}
  </tbody>
</table>
      </div>
    </section>
  )
}

function App() {
  const [page, setPage] = useState('import')
  const [forecastRows, setForecastRows] = useState(() => {
    try {
      const saved = window.localStorage.getItem('forecastRows')
      if (!saved) return [{ productId: '', productName: '', quantity: '' }]
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) && parsed.length ? parsed : [{ productId: '', productName: '', quantity: '' }]
    } catch {
      return [{ productId: '', productName: '', quantity: '' }]
    }
  })

  useEffect(() => {
    window.localStorage.setItem('forecastRows', JSON.stringify(forecastRows))
  }, [forecastRows])

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="brand">
  <img className="brand-logo" src="/VZK_logo.jpg" alt="VZK logo" />
</div>
        <nav className="nav-buttons">
          <button className={page==='import' ? 'active' : ''} onClick={()=>setPage('import')}>Import BOM</button>
          <button className={page==='forecast' ? 'active' : ''} onClick={()=>setPage('forecast')}>Forecast</button>
          <button className={page==='requirements' ? 'active' : ''} onClick={()=>setPage('requirements')}>Requirements</button>
          <button className={page==='bom' ? 'active' : ''} onClick={()=>setPage('bom')}>BOM</button>
        </nav>
      </header>
      <main className="app-main">
        <div className="main-title">
  <h1>Procurement & Forecast App</h1>
  <p>Planning and requirements in one place</p>
</div>
        {page==='import' && <ImportPage />}
        {page==='forecast' && <ForecastPage rows={forecastRows} setRows={setForecastRows} />}
        {page==='bom' && <BOMPage />}
        {page==='requirements' && <RequirementsPage />}
      </main>
    </div>
  )
}

function BOMPage() {
  const [rows, setRows] = useState(null)
  const [loading, setLoading] = useState(false)
  const fetchBom = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/bom`)
      const data = await res.json()
      setRows(data)
    } catch (err) {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBom() }, [])

  return (
    <section className="page-card">
      <div className="page-header">
        <div>
          <h2>BOM Database</h2>
          <p className="page-description">Preview the current BOM rows stored in the database.</p>
        </div>
      </div>
      <div className="page-actions">
        <button onClick={fetchBom}>Refresh</button>
        <button className="secondary" onClick={async () => {
          if (!window.confirm('Clear BOM rows? This cannot be undone.')) return
          try {
            const res = await fetch(`${API}/bom/clear`, { method: 'POST' })
            if (!res.ok) throw new Error(await res.text())
            await fetchBom()
          } catch (err) {
            alert('Error clearing BOM: ' + err.message)
          }
        }}>Clear BOM</button>
        <button className="danger" onClick={async () => {
          if (!window.confirm('Clear entire DB (products, ingredients, forecast, BOM)? This is destructive.')) return
          try {
            const res = await fetch(`${API}/bom/clear?full=true`, { method: 'POST' })
            if (!res.ok) throw new Error(await res.text())
            await fetchBom()
          } catch (err) {
            alert('Error clearing DB: ' + err.message)
          }
        }}>Clear All Data</button>
      </div>
      {loading && <div>Loading...</div>}
      {!loading && rows && (
        rows.length ? (
          <table className="data-table">
            <thead>
              <tr>
              <th>productCode</th>
              <th>productName</th>
              <th>ingredientCode</th>
              <th>ingredientName</th>
              <th>quantity</th>
              <th>unit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td>{row.productCode}</td>
                  <td>{row.productName}</td>
                  <td>{row.ingredientCode}</td>
                  <td>{row.ingredientName}</td>
                  <td>{row.quantity}</td>
                  <td>{row.ingredientUnit ?? row.unit ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div>No BOM rows found</div>
      )}
    </section>
  )
}

export default App
