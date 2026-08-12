const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
const port = 3001;
const JWT_SECRET = 'super-secret-linkedout-key'; // For MVP purposes

app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const db = new sqlite3.Database('./linkedout.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create posts table if not exists (from previous phases)
    db.run(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT,
      role TEXT,
      duration TEXT,
      company TEXT,
      content TEXT,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, () => {
      // Lazy migrations for phase 4
      db.run("ALTER TABLE posts ADD COLUMN user_id INTEGER", () => {});
      db.run("ALTER TABLE posts ADD COLUMN repost_id INTEGER", () => {});
      db.run("ALTER TABLE posts ADD COLUMN is_anonymous INTEGER DEFAULT 1", () => {});
    });
  }
});

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

// Optional auth middleware (doesn't fail if no token)
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
    db.run("INSERT INTO users (username, password_hash) VALUES (?, ?)", [username, hash], function(err) {
      if (err) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: this.lastID, username } });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username } });
  });
});

// Posts
const getPostWithDetails = (postId, callback) => {
  db.get(`
    SELECT p.*, u.username as real_username 
    FROM posts p 
    LEFT JOIN users u ON p.user_id = u.id 
    WHERE p.id = ?`, [postId], (err, row) => {
      if (err) return callback(err);
      
      // If it's a repost, fetch the original post too
      if (row && row.repost_id) {
        db.get(`SELECT p.*, u.username as real_username FROM posts p LEFT JOIN users u ON p.user_id = u.id WHERE p.id = ?`, [row.repost_id], (err, originalPost) => {
          row.original_post = originalPost;
          callback(null, row);
        });
      } else {
        callback(null, row);
      }
  });
}

app.get('/api/posts', (req, res) => {
  db.all(`
    SELECT p.*, u.username as real_username 
    FROM posts p 
    LEFT JOIN users u ON p.user_id = u.id 
    ORDER BY p.id DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // For MVP simplicity, we won't deeply resolve all reposts in the list query 
    // to avoid complex JOINs, but we will for individual posts.
    res.json(rows);
  });
});

app.get('/api/posts/company/:companyName', (req, res) => {
  const companyName = req.params.companyName;
  db.all("SELECT p.*, u.username as real_username FROM posts p LEFT JOIN users u ON p.user_id = u.id WHERE p.company = ? ORDER BY p.id DESC", [companyName], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/posts', optionalAuth, (req, res) => {
  const { author, role, duration, company, content, is_anonymous, repost_id } = req.body;
  const user_id = req.user ? req.user.id : null;
  const anonymousFlag = is_anonymous === undefined ? 1 : (is_anonymous ? 1 : 0);
  
  if (!company && !repost_id) {
    return res.status(400).json({ error: "Company is required for new posts" });
  }

  const sql = `INSERT INTO posts (author, role, duration, company, content, likes, comments, user_id, is_anonymous, repost_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
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

  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    getPostWithDetails(this.lastID, (err, fullPost) => {
      if (!err && fullPost) {
        io.emit('new_post', fullPost); // Broadcast real-time
        res.json(fullPost);
      } else {
        res.status(500).json({ error: "Failed to retrieve saved post" });
      }
    });
  });
});

app.post('/api/posts/:id/like', (req, res) => {
  const id = req.params.id;
  db.run("UPDATE posts SET likes = likes + 1 WHERE id = ?", id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Post liked", changes: this.changes });
  });
});

// Socket.io
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(port, () => {
  console.log(`LinkedOut backend running at http://localhost:${port}`);
});
