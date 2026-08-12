require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

// Update CORS to allow all for dev, or specify Vercel domains for prod
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
app.use(cors({ origin: "*" }));
app.use(express.json());

const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-linkedout-key';

if (!process.env.DATABASE_URL) {
  console.error("FATAL ERROR: DATABASE_URL environment variable is not set.");
  console.error("Please create a .env file and add your PostgreSQL connection string.");
  process.exit(1);
}

// Initialize PostgreSQL Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for most cloud DBs like Neon/Supabase
});

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        author VARCHAR(255),
        role VARCHAR(255),
        duration VARCHAR(255),
        company VARCHAR(255),
        content TEXT,
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        user_id INTEGER REFERENCES users(id),
        is_anonymous INTEGER DEFAULT 1,
        repost_id INTEGER REFERENCES posts(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Connected to PostgreSQL database and verified tables.');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}
initDB();

// Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) req.user = user;
      next();
    });
  } else {
    next();
  }
};

// --- API Endpoints ---

// Auth
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username", 
      [username, hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    if (err.code === '23505') { // Postgres unique violation
      res.status(400).json({ error: "Username already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = result.rows[0];
    
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Posts
const getPostWithDetails = async (postId) => {
  const res = await pool.query(`
    SELECT p.*, u.username as real_username 
    FROM posts p 
    LEFT JOIN users u ON p.user_id = u.id 
    WHERE p.id = $1`, [postId]);
  
  let row = res.rows[0];
  if (row && row.repost_id) {
    const origRes = await pool.query(`SELECT p.*, u.username as real_username FROM posts p LEFT JOIN users u ON p.user_id = u.id WHERE p.id = $1`, [row.repost_id]);
    row.original_post = origRes.rows[0];
  }
  return row;
};

app.get('/api/posts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.username as real_username 
      FROM posts p 
      LEFT JOIN users u ON p.user_id = u.id 
      ORDER BY p.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/posts/company/:companyName', async (req, res) => {
  try {
    const companyName = req.params.companyName;
    const result = await pool.query(`
      SELECT p.*, u.username as real_username 
      FROM posts p 
      LEFT JOIN users u ON p.user_id = u.id 
      WHERE p.company = $1 
      ORDER BY p.id DESC
    `, [companyName]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts', optionalAuth, async (req, res) => {
  const { author, role, duration, company, content, is_anonymous, repost_id } = req.body;
  const user_id = req.user ? req.user.id : null;
  const anonymousFlag = is_anonymous === undefined ? 1 : (is_anonymous ? 1 : 0);
  
  if (!company && !repost_id) {
    return res.status(400).json({ error: "Company is required for new posts" });
  }

  try {
    const sql = `
      INSERT INTO posts (author, role, duration, company, content, likes, comments, user_id, is_anonymous, repost_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING id
    `;
    const params = [
      author || `Anonymous${Math.floor(Math.random() * 1000)}`,
      role || "Employee",
      duration || "Unknown",
      company || "Unknown",
      content || "",
      0, 0,
      user_id,
      anonymousFlag,
      repost_id || null
    ];

    const result = await pool.query(sql, params);
    const fullPost = await getPostWithDetails(result.rows[0].id);
    
    io.emit('new_post', fullPost); // Broadcast real-time
    res.json(fullPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query("UPDATE posts SET likes = likes + 1 WHERE id = $1", [id]);
    res.json({ message: "Post liked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.io
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(port, () => {
  console.log(`LinkedOut production backend running on port ${port}`);
});
