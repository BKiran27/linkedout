require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const http = require('http');
const { Server } = require('socket.io');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
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
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-linkedout-key';

// --- Passport Configuration ---
app.use(passport.initialize());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
    callbackURL: "/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      // Find or create user
      const existingUser = await execute("SELECT * FROM users WHERE google_id = $1", [profile.id]);
      if (existingUser.rows && existingUser.rows.length > 0) {
        return cb(null, existingUser.rows[0]);
      }
      
      // If user doesn't exist, create them
      // Use their display name or email prefix as username, append random to avoid collision
      const baseName = profile.displayName.replace(/\s+/g, '') || 'googleUser';
      const newUsername = `${baseName}${Math.floor(Math.random() * 1000)}`;
      
      // Password can be null or dummy since they use OAuth
      const result = await execute(
        "INSERT INTO users (username, password, google_id) VALUES ($1, $2, $3) RETURNING id",
        [newUsername, 'oauth_user', profile.id]
      );
      
      const newUser = { id: result.insertId, username: newUsername, google_id: profile.id };
      return cb(null, newUser);
    } catch (err) {
      return cb(err, null);
    }
  }
));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  function(req, res) {
    // Generate JWT and redirect
    const token = jwt.sign({ id: req.user.id, username: req.user.username }, JWT_SECRET, { expiresIn: '24h' });
    // Redirect back to frontend with the token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?token=${token}`);
  }
);

const port = process.env.PORT || 3001;

const usePg = !!process.env.DATABASE_URL;
let pool;
let db;

if (usePg) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
} else {
  db = new sqlite3.Database('./linkedout.db', (err) => {
    if (err) console.error("Error connecting to SQLite:", err);
  });
}

// A simple DB wrapper to abstract pg vs sqlite3
const execute = async (sql, params = []) => {
  if (usePg) {
    const result = await pool.query(sql, params);
    return { rows: result.rows, insertId: result.rows[0]?.id };
  } else {
    // Convert Postgres $1, $2 syntax to SQLite ?, ? syntax
    let sqliteSql = sql;
    let i = 1;
    while(sqliteSql.includes(`$${i}`)) {
      sqliteSql = sqliteSql.replace(`$${i}`, '?');
      i++;
    }
    // Remove RETURNING id, which is postgres specific for inserts
    sqliteSql = sqliteSql.replace(/RETURNING .+/i, '');

    return new Promise((resolve, reject) => {
      if (sqliteSql.trim().toUpperCase().startsWith("SELECT")) {
        db.all(sqliteSql, params, (err, rows) => {
          if (err) reject(err);
          else resolve({ rows });
        });
      } else {
        db.run(sqliteSql, params, function(err) {
          if (err) reject(err);
          else resolve({ rows: [], insertId: this.lastID });
        });
      }
    });
  }
};

async function initDB() {
  try {
    const serialType = usePg ? 'SERIAL' : 'INTEGER';
    await execute(`
      CREATE TABLE IF NOT EXISTS users (
        id ${serialType} PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS posts (
        id ${serialType} PRIMARY KEY,
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

    await execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id ${serialType} PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id),
        user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        is_anonymous INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add title column if it doesn't exist (for Reddit pivot)
    try {
      await execute("ALTER TABLE posts ADD COLUMN title VARCHAR(255)");
    } catch (e) {
      if (e.message.indexOf('duplicate column name') === -1) {
         console.error('Migration error (title):', e.message);
      }
    }

    // Add google_id column for OAuth
    try {
      await execute("ALTER TABLE users ADD COLUMN google_id VARCHAR(255)");
    } catch (e) {
      if (e.message.indexOf('duplicate column name') === -1) {
         console.error('Migration error (google_id):', e.message);
      }
    }

    console.log(`Connected to ${usePg ? 'PostgreSQL' : 'SQLite'} database and verified tables.`);
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
    const result = await execute(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id", 
      [username, hash]
    );
    const id = result.insertId;
    const token = jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id, username } });
  } catch (err) {
    if (err.code === '23505' || err.message.includes('UNIQUE')) { 
      res.status(400).json({ error: "Username already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await execute("SELECT * FROM users WHERE username = $1", [username]);
    const user = result.rows[0];
    
    if (!user) return res.status(400).json({ error: "Account not found. Please sign up first." });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: "Incorrect password." });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Posts
const getPostWithDetails = async (postId) => {
  const res = await execute(`
    SELECT p.*, u.username as real_username 
    FROM posts p 
    LEFT JOIN users u ON p.user_id = u.id 
    WHERE p.id = $1`, [postId]);
  
  let row = res.rows[0];
  if (row && row.repost_id) {
    const origRes = await execute(`SELECT p.*, u.username as real_username FROM posts p LEFT JOIN users u ON p.user_id = u.id WHERE p.id = $1`, [row.repost_id]);
    row.original_post = origRes.rows[0];
  }
  return row;
};

app.get('/api/posts', async (req, res) => {
  try {
    const result = await execute(`
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
    const result = await execute(`
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

app.get('/api/posts/user/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const result = await execute(`
      SELECT p.*, u.username as real_username 
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      WHERE u.username = $1 
      ORDER BY p.id DESC
    `, [username]);
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

    const result = await execute(sql, params);
    const fullPost = await getPostWithDetails(result.insertId);
    
    io.emit('new_post', fullPost); // Broadcast real-time
    res.json(fullPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/vote', async (req, res) => {
  try {
    const id = req.params.id;
    const { scoreChange } = req.body;
    
    // ensure scoreChange is a number and between -2 and 2
    const change = parseInt(scoreChange);
    if (isNaN(change) || change < -2 || change > 2) {
      return res.status(400).json({ error: "Invalid scoreChange" });
    }

    await execute("UPDATE posts SET likes = likes + $1 WHERE id = $2", [change, id]);
    res.json({ message: "Vote recorded" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comments
app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await execute(`
      SELECT c.*, u.username as real_username 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.post_id = $1 
      ORDER BY c.created_at ASC
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/comments', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const { content, is_anonymous } = req.body;
    if (!content) return res.status(400).json({ error: "Content required" });

    const sql = `
      INSERT INTO comments (post_id, user_id, content, is_anonymous) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id
    `;
    const params = [postId, req.user.id, content, is_anonymous ? 1 : 0];
    
    const result = await execute(sql, params);
    await execute("UPDATE posts SET comments = comments + 1 WHERE id = $1", [postId]);
    
    const getRes = await execute(`
      SELECT c.*, u.username as real_username 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.id = $1
    `, [result.insertId]);
    
    const newComment = getRes.rows[0];
    io.emit('new_comment', newComment);
    res.json(newComment);
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
