require('dotenv').config()
const express = require('express')
const { Pool } = require('pg')
const session = require('express-session')
const pgSession = require('connect-pg-simple')(session)
const bcrypt = require('bcryptjs')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000
const LOGIN_MAX_ATTEMPTS = 5
const LOGIN_BLOCK_MINUTES = 15

const dbUrl = process.env.DATABASE_URL || ''
const pool = new Pool({
  connectionString: dbUrl,
  ssl: (process.env.NODE_ENV === 'production' && !dbUrl.includes('.railway.internal'))
    ? { rejectUnauthorized: false }
    : false,
})

// ─── Inicjalizacja bazy ───────────────────────────────────────────────────────

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      active BOOLEAN NOT NULL DEFAULT true,
      pending BOOLEAN NOT NULL DEFAULT false,
      force_password_reset BOOLEAN NOT NULL DEFAULT false,
      created_at TEXT NOT NULL DEFAULT to_char(NOW() AT TIME ZONE 'Europe/Warsaw', 'DD.MM.YYYY, HH24:MI:SS')
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS session (
      sid VARCHAR NOT NULL COLLATE "default",
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL,
      CONSTRAINT session_pkey PRIMARY KEY (sid)
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      ip TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT to_char(NOW() AT TIME ZONE 'Europe/Warsaw', 'DD.MM.YYYY, HH24:MI:SS')
    )
  `)

  const { rows } = await pool.query('SELECT COUNT(*) FROM users')
  if (parseInt(rows[0].count) === 0) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10)
    await pool.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin')`,
      [process.env.ADMIN_EMAIL || 'admin@vectra.pl', hash]
    )
    console.log('Utworzono domyślne konto admina: ' + (process.env.ADMIN_EMAIL || 'admin@vectra.pl'))
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(session({
  store: new pgSession({ pool, tableName: 'session' }),
  secret: process.env.SESSION_SECRET || 'vectra-secret-zmien-mnie',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
}))

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/login')
  next()
}

function requireAdmin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Nie zalogowano' })
  if (req.session.role !== 'admin' && req.session.role !== 'superadmin')
    return res.status(403).json({ error: 'Brak uprawnień' })
  next()
}

// ─── Pliki statyczne ──────────────────────────────────────────────────────────

// Zasoby React (JS/CSS) — publiczne
app.use('/assets', express.static(path.join(__dirname, 'dist', 'assets')))

// PWA — service worker i manifest muszą być dostępne bez logowania
const distDir = path.join(__dirname, 'dist')
app.get('/sw.js',                (_, res) => res.sendFile(path.join(distDir, 'sw.js')))
app.get('/manifest.webmanifest', (_, res) => res.sendFile(path.join(distDir, 'manifest.webmanifest')))
app.get('/registerSW.js',        (_, res) => res.sendFile(path.join(distDir, 'registerSW.js')))
app.get('/icon.svg',             (_, res) => res.sendFile(path.join(__dirname, 'public', 'icon.svg')))
app.get('/avatar.jpg',           (_, res) => res.sendFile(path.join(__dirname, 'public', 'avatar.jpg')))
app.get('/workbox-:hash.js',     (req, res, next) => {
  const file = path.join(distDir, 'workbox-' + req.params.hash + '.js')
  res.sendFile(file, err => err && next())
})

// ─── Trasy publiczne (auth) ───────────────────────────────────────────────────

app.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/')
  res.sendFile(path.join(__dirname, 'public', 'login.html'))
})

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown'

  const blockCheck = await pool.query(
    `SELECT COUNT(*) FROM login_attempts WHERE email = $1 AND created_at > NOW() - INTERVAL '${LOGIN_BLOCK_MINUTES} minutes'`,
    [email]
  )
  if (parseInt(blockCheck.rows[0].count) >= LOGIN_MAX_ATTEMPTS) {
    return res.redirect('/login?error=blocked')
  }

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
  const user = result.rows[0]

  if (!user || !user.active || user.pending) {
    await pool.query('INSERT INTO login_attempts (email, ip) VALUES ($1, $2)', [email, ip])
    return res.redirect('/login?error=1')
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    await pool.query('INSERT INTO login_attempts (email, ip) VALUES ($1, $2)', [email, ip])
    const attempts = await pool.query(
      `SELECT COUNT(*) FROM login_attempts WHERE email = $1 AND created_at > NOW() - INTERVAL '${LOGIN_BLOCK_MINUTES} minutes'`,
      [email]
    )
    if (parseInt(attempts.rows[0].count) >= LOGIN_MAX_ATTEMPTS) {
      await pool.query(
        `INSERT INTO activity_log (user_email, action, details) VALUES ($1, 'login_blocked', $2)`,
        [email, `Konto zablokowane z IP: ${ip} po ${LOGIN_MAX_ATTEMPTS} nieudanych próbach`]
      )
    }
    return res.redirect('/login?error=1')
  }

  await pool.query('DELETE FROM login_attempts WHERE email = $1', [email])
  await pool.query(
    `INSERT INTO activity_log (user_email, action, details) VALUES ($1, 'login', $2)`,
    [email, `Logowanie z IP: ${ip}`]
  )

  req.session.userId = user.id
  req.session.email = user.email
  req.session.role = user.role
  res.redirect('/')
})

app.post('/auth/register', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.redirect('/login?reg=error')
  if (password.length < 6) return res.redirect('/login?reg=short')

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.rows.length > 0) return res.redirect('/login?reg=exists')

  const hash = await bcrypt.hash(password, 10)
  await pool.query(
    `INSERT INTO users (email, password_hash, role, active, pending) VALUES ($1, $2, 'user', false, true)`,
    [email, hash]
  )
  res.redirect('/login?reg=ok')
})

app.post('/auth/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'))
})

// ─── API: bieżący użytkownik ──────────────────────────────────────────────────

app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nie zalogowano' })
  res.json({ email: req.session.email, role: req.session.role })
})

// ─── API: Admin — użytkownicy ─────────────────────────────────────────────────

app.get('/api/users', requireAdmin, async (req, res) => {
  const result = await pool.query(
    'SELECT id, email, role, active, pending, created_at FROM users ORDER BY id'
  )
  res.json(result.rows)
})

app.post('/api/users', requireAdmin, async (req, res) => {
  const { email, password, role } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email i hasło są wymagane' })

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.rows.length > 0) return res.status(400).json({ error: 'Email już istnieje' })

  const hash = await bcrypt.hash(password, 10)
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, active, pending, created_at`,
    [email, hash, role || 'user']
  )
  res.status(201).json(result.rows[0])
})

app.post('/api/users/:id/approve', requireAdmin, async (req, res) => {
  await pool.query('UPDATE users SET pending=false, active=true WHERE id=$1', [req.params.id])
  const user = await pool.query('SELECT email FROM users WHERE id=$1', [req.params.id])
  await pool.query(
    `INSERT INTO activity_log (user_email, action, details) VALUES ($1, 'user_approved', $2)`,
    [req.session.email, `Zatwierdzono konto: ${user.rows[0]?.email}`]
  )
  res.json({ success: true })
})

app.post('/api/users/:id/unblock', requireAdmin, async (req, res) => {
  const user = await pool.query('SELECT email FROM users WHERE id=$1', [req.params.id])
  if (!user.rows[0]) return res.status(404).json({ error: 'Nie znaleziono użytkownika' })
  await pool.query('DELETE FROM login_attempts WHERE email=$1', [user.rows[0].email])
  await pool.query(
    `INSERT INTO activity_log (user_email, action, details) VALUES ($1, 'user_unblocked', $2)`,
    [req.session.email, `Odblokowano: ${user.rows[0].email}`]
  )
  res.json({ success: true })
})

app.patch('/api/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params
  const { role, active, password } = req.body

  if (parseInt(id) === req.session.userId && active === false)
    return res.status(400).json({ error: 'Nie możesz dezaktywować własnego konta' })

  const fields = []
  const params = []

  if (role !== undefined)   { params.push(role);  fields.push(`role=$${params.length}`) }
  if (active !== undefined) { params.push(active); fields.push(`active=$${params.length}`) }
  if (password) {
    const hash = await bcrypt.hash(password, 10)
    params.push(hash)
    fields.push(`password_hash=$${params.length}`)
  }

  if (fields.length === 0) return res.status(400).json({ error: 'Brak danych' })

  params.push(id)
  const result = await pool.query(
    `UPDATE users SET ${fields.join(',')} WHERE id=$${params.length} RETURNING id, email, role, active, pending, created_at`,
    params
  )
  res.json(result.rows[0])
})

app.delete('/api/users/:id', requireAdmin, async (req, res) => {
  if (parseInt(req.params.id) === req.session.userId)
    return res.status(400).json({ error: 'Nie możesz usunąć własnego konta' })
  await pool.query('DELETE FROM users WHERE id=$1', [req.params.id])
  res.json({ success: true })
})

// ─── API: Admin — logi aktywności ────────────────────────────────────────────

app.get('/api/activity', requireAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = 50
  const offset = (page - 1) * limit

  const result = await pool.query(
    `SELECT * FROM activity_log ORDER BY id DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  const total = await pool.query('SELECT COUNT(*) FROM activity_log')
  res.json({ rows: result.rows, total: parseInt(total.rows[0].count), page, limit })
})

// ─── Admin panel ──────────────────────────────────────────────────────────────

app.get('/admin', requireAuth, (req, res) => {
  if (req.session.role !== 'admin' && req.session.role !== 'superadmin')
    return res.redirect('/')
  res.sendFile(path.join(__dirname, 'public', 'admin.html'))
})

// ─── Chroniona aplikacja React ────────────────────────────────────────────────

app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.get('*', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// ─── Start ────────────────────────────────────────────────────────────────────

initDb()
  .then(() => app.listen(PORT, () => console.log(`Vectra Channels działa na porcie ${PORT}`)))
  .catch(err => { console.error('Błąd inicjalizacji bazy:', err); process.exit(1) })
