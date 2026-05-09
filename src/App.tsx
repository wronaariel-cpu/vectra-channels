import { useState, useMemo, useEffect } from 'react'
import { channelsNew } from './data/channels-new'
import { channelsOld } from './data/channels-old'
import { analogChannelsOld, analogChannelsNew } from './data/channels-analog'
import { CATEGORIES, getCategoryInfo } from './types'
import type { Category } from './types'


type SortKey = 'lcn' | 'name' | 'frequency' | 'transponder'
type SortDir = 'asc' | 'desc'
type Tab = 'new' | 'old' | 'analog-new' | 'analog-old'

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
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(d => {
      if (!d) return
      setUser(d)
    })
  }, [])
  const [activeCats, setActiveCats] = useState<Set<Category>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('lcn')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const radioCat = CATEGORIES.find(c => c.key === 'radio')!
  const detailCats = CATEGORIES.filter(c => c.key !== 'radio')
  const dropdownValue = [...activeCats].find(k => detailCats.some(c => c.key === k)) ?? ''

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
                <div className="header-btns">
                  {(user.role === 'admin' || user.role === 'superadmin') && (
                    <a href="/admin" className="header-link">Panel admina</a>
                  )}
                  <form method="POST" action="/auth/logout" style={{ display: 'inline' }}>
                    <button type="submit" className="btn-logout">Wyloguj</button>
                  </form>
                </div>
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
          <button
            className={`tab-btn ${tab === 'analog-new' ? 'active' : ''}`}
            onClick={() => { setTab('analog-new'); setQuery(''); resetFilters() }}
          >
            Analog – Nowa
          </button>
          <button
            className={`tab-btn ${tab === 'analog-old' ? 'active' : ''}`}
            onClick={() => { setTab('analog-old'); setQuery(''); resetFilters() }}
          >
            Analog – Stara
          </button>
        </div>

        {(tab === 'new' || tab === 'old') && <>
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
              <button
                className="cat-btn"
                style={activeCats.has('radio')
                  ? { background: radioCat.bg, color: radioCat.color, borderColor: radioCat.color }
                  : { borderColor: radioCat.color, color: radioCat.color }
                }
                onClick={() => toggleCategory('radio')}
              >
                Radio
              </button>
              <select
                className="cat-select"
                value={dropdownValue}
                onChange={e => {
                  setTvOnly(false)
                  setActiveCats(e.target.value ? new Set([e.target.value as Category]) : new Set())
                }}
              >
                <option value="">Więcej kategorii…</option>
                {detailCats.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
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
                      Częst. {arrow('frequency')}
                    </th>
                    <th className="col-tp sortable" onClick={() => handleSort('transponder')}>
                      TP {arrow('transponder')}
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
        </>}

        {/* Analog tabs */}
        {(tab === 'analog-new' || tab === 'analog-old') && (
          <>
            <div className="old-list-info">
              {tab === 'analog-old'
                ? <><strong>Układ aktualny (stary):</strong> pasmo analogowe 111–223 MHz — programy nadawane analogowo w sieci Vectra Zabrze.</>
                : <><strong>Nowy układ:</strong> programy analogowe przeniesione na wyższe częstotliwości (703–799 MHz). TV PULS pozostaje na 111 MHz.</>
              }
            </div>
            <div className="table-wrap">
              <table className="channel-table">
                <thead>
                  <tr>
                    <th className="col-lcn">Kanał</th>
                    <th className="col-freq">Częst. (MHz)</th>
                    <th>Program</th>
                    <th className="col-tp">Typ</th>
                  </tr>
                </thead>
                <tbody>
                  {(tab === 'analog-old' ? analogChannelsOld : analogChannelsNew).map(ch => {
                    const isWolny = ch.program.toLowerCase().includes('wolny')
                    const isLokalny = ch.program.toLowerCase().includes('lokalny')
                    const statusColor = isWolny   ? { bg: '#fff8e1', color: '#8a6000', border: '#f0c040' }
                                     : isLokalny  ? { bg: '#e8f0ff', color: '#1a3a8f', border: '#4a6abf' }
                                     :              { bg: '#e8f5e2', color: '#2d5a1b', border: '#5a9a3a' }
                    const statusLabel = isWolny ? 'Wolny' : isLokalny ? 'Lokalny' : 'TV'
                    return (
                      <tr key={ch.id}>
                        <td className="col-lcn lcn-num">{ch.id}</td>
                        <td className="col-freq">{ch.frequency.toFixed(2)}</td>
                        <td className="ch-name">{ch.program}</td>
                        <td className="col-tp">
                          <span className="cat-badge" style={{ background: statusColor.bg, color: statusColor.color, borderColor: statusColor.border }}>
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      <footer className="app-footer">
        <img src="/avatar.jpg" alt="Ariel Wrona" className="footer-avatar" />
        <div className="footer-text">
          <span>© 2026 Ariel Wrona</span>
          <a href="mailto:wrona.ariel@gmail.com" className="footer-email">wrona.ariel@gmail.com</a>
        </div>
      </footer>
    </div>
  )
}
