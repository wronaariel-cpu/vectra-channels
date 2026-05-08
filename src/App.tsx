import { useState, useMemo, useEffect } from 'react'
import { channelsNew } from './data/channels-new'
import { channelsOld } from './data/channels-old'
import { CATEGORIES, getCategoryInfo } from './types'
import type { Category } from './types'

type SortKey = 'lcn' | 'name' | 'frequency' | 'transponder'
type SortDir = 'asc' | 'desc'
type Tab = 'new' | 'old'

export default function App() {
  const [tab, setTab] = useState<Tab>('new')
  const [query, setQuery] = useState('')
  const [tvOnly, setTvOnly] = useState(false)
  const [user, setUser] = useState<{ email: string; role: string } | null>(null)
  const [dark, setDark] = useState(() => localStorage.getItem('vectra-theme') === 'dark')

  useEffect(() => {
    document.body.classList.toggle('dark', dark)
    localStorage.setItem('vectra-theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(d => d && setUser(d))
  }, [])
  const [activeCats, setActiveCats] = useState<Set<Category>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('lcn')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const resetFilters = () => { setTvOnly(false); setActiveCats(new Set()) }

  const toggleCategory = (cat: Category) => {
    setTvOnly(false)
    setActiveCats(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const channels = tab === 'new' ? channelsNew : channelsOld

    return channels
      .filter(ch => {
        const catInfo = getCategoryInfo(ch.lcn)
        if (tvOnly && ch.lcn < 100) return false
        if (activeCats.size > 0 && !activeCats.has(catInfo.key)) return false
        if (!q) return true
        return (
          ch.name.toLowerCase().includes(q) ||
          String(ch.lcn).includes(q) ||
          ch.frequency.toLowerCase().includes(q) ||
          String(ch.transponder).includes(q)
        )
      })
      .sort((a, b) => {
        let cmp = 0
        if (sortKey === 'lcn') cmp = a.lcn - b.lcn
        else if (sortKey === 'name') cmp = a.name.localeCompare(b.name, 'pl')
        else if (sortKey === 'frequency') cmp = parseFloat(a.frequency) - parseFloat(b.frequency)
        else if (sortKey === 'transponder') cmp = a.transponder - b.transponder
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [tab, query, tvOnly, activeCats, sortKey, sortDir])

  const total = tab === 'new' ? channelsNew.length : channelsOld.length

  const arrow = (key: SortKey) => {
    if (sortKey !== key) return <span className="sort-arrow neutral">↕</span>
    return <span className="sort-arrow active">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-title">
            <span className="header-logo">📡</span>
            <div>
              <h1>Vectra – Lista Kanałów</h1>
              <p>Zabrze / Play</p>
            </div>
            <button className="btn-theme" onClick={() => setDark(d => !d)} title="Zmień motyw">
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
          <div className="header-actions">
            {user && (
              <>
                <span className="header-user">{user.email}</span>
                {(user.role === 'admin' || user.role === 'superadmin') && (
                  <a href="/admin" className="header-link">Panel admina</a>
                )}
                <form method="POST" action="/auth/logout" style={{ display: 'inline' }}>
                  <button type="submit" className="btn-logout">Wyloguj</button>
                </form>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab-btn ${tab === 'new' ? 'active' : ''}`}
            onClick={() => { setTab('new'); setQuery(''); resetFilters() }}
          >
            Nowa lista
          </button>
          <button
            className={`tab-btn ${tab === 'old' ? 'active' : ''}`}
            onClick={() => { setTab('old'); setQuery(''); resetFilters() }}
          >
            Stara lista
          </button>
        </div>

        <>
          {tab === 'old' && (
            <div className="old-list-info">
              Te same kanały co nowa lista — częstotliwości wg <strong>Vectra Zabrze (OLD NIT)</strong>.
              Transpondery 121–128, 131, 133, 135 działały na wyższych częstotliwościach.
            </div>
          )}
          <>
            {/* Search */}
            <div className="toolbar">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Szukaj po nazwie, numerze lub częstotliwości…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                {query && (
                  <button className="clear-btn" onClick={() => setQuery('')}>✕</button>
                )}
              </div>
              <span className="result-count">
                {filtered.length} / {total} kanałów
              </span>
            </div>

            {/* Category filters */}
            <div className="cat-filters">
              <button
                className={`cat-btn ${!tvOnly && activeCats.size === 0 ? 'cat-all-active' : 'cat-all'}`}
                onClick={resetFilters}
              >
                Wszystkie
              </button>
              <button
                className={`cat-btn ${tvOnly ? 'cat-tv-active' : 'cat-tv'}`}
                onClick={() => { setTvOnly(true); setActiveCats(new Set()) }}
              >
                TV
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  className={`cat-btn ${cat.key !== 'radio' ? 'cat-detail' : ''} ${activeCats.has(cat.key) ? 'cat-active' : ''}`}
                  style={activeCats.has(cat.key)
                    ? { background: cat.bg, color: cat.color, borderColor: cat.color }
                    : { borderColor: cat.color, color: cat.color }
                  }
                  onClick={() => toggleCategory(cat.key)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="table-wrap">
              <table className="channel-table">
                <thead>
                  <tr>
                    <th className="col-lcn sortable" onClick={() => handleSort('lcn')}>
                      Nr {arrow('lcn')}
                    </th>
                    <th className="col-name sortable" onClick={() => handleSort('name')}>
                      Nazwa kanału {arrow('name')}
                    </th>
                    <th className="col-freq sortable" onClick={() => handleSort('frequency')}>
                      Częstotliwość {arrow('frequency')}
                    </th>
                    <th className="col-tp sortable" onClick={() => handleSort('transponder')}>
                      Transponder {arrow('transponder')}
                    </th>
                    <th className="col-cat">Kategoria</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-row">Brak wyników dla podanych kryteriów.</td>
                    </tr>
                  ) : (
                    filtered.map(ch => {
                      const cat = getCategoryInfo(ch.lcn)
                      return (
                        <tr key={ch.serviceId} style={dark ? {} : { background: cat.bg }}>
                          <td className="col-lcn lcn-num">{ch.lcn}</td>
                          <td className="col-name ch-name">{ch.name}</td>
                          <td className="col-freq">{ch.frequency}</td>
                          <td className="col-tp">{ch.transponder}</td>
                          <td className="col-cat">
                            <span
                              className="cat-badge"
                              style={{ background: cat.bg, color: cat.color, borderColor: cat.color }}
                            >
                              {cat.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        </>
      </main>
    </div>
  )
}
