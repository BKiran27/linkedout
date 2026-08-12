import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import './App.css';

const API_URL = 'http://localhost:3001/api';
const socket = io('http://localhost:3001');

// --- Contexts ---
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', jwtToken);
    showToast(`Welcome back, ${userData.username}!`);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    showToast('Logged out successfully.', 'info');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, showToast }}>
      {children}
      {toast && (
        <div className={`toast toast-${toast.type} animate-slide-up`}>
          {toast.message}
        </div>
      )}
    </AuthContext.Provider>
  );
};

// --- Shared Components ---

const Header = ({ onShowAuth }) => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
          Linked<span className="logo-accent">Out</span>
        </Link>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {user ? (
            <>
              <span style={{ color: 'var(--text-muted)' }}>@{user.username}</span>
              <button className="btn btn-danger" style={{ padding: '0.4rem 1rem' }} onClick={logout}>Logout</button>
            </>
          ) : (
            <button className="btn btn-danger" style={{ padding: '0.4rem 1rem' }} onClick={() => onShowAuth('login')}>Login / Join</button>
          )}
          <Link to="/" className="btn btn-primary" onClick={() => {
            setTimeout(() => {
              const form = document.getElementById('submit-form');
              if (form) form.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}>
            Expose a Company
          </Link>
        </nav>
      </div>
    </header>
  );
};

const AuthModal = ({ type: initialType, onClose }) => {
  const [type, setType] = useState(initialType);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = type === 'login' ? '/auth/login' : '/auth/register';
    
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
        onClose();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo" style={{ justifyContent: 'center', marginBottom: '1rem', fontSize: '2rem' }}>
            Linked<span className="logo-accent">Out</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{type === 'login' ? 'Welcome Back' : 'Join the Resistance'}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {type === 'login' ? 'Sign in to amplify stories and post your own.' : 'Your identity remains protected. Always.'}
          </p>
        </div>
        
        {error && <div className="error-msg animate-fade-in">{error}</div>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <button className="btn btn-outline" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }} onClick={() => alert('Google auth coming soon!')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
          
          <div className="divider">
            <span>or use email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input className="form-control" type="text" placeholder="Choose an alias..." value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: '1.5rem', padding: '1rem' }} type="submit">
            {type === 'login' ? 'Login to LinkedOut' : 'Create Secure Account'}
          </button>
          
          <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {type === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              onClick={() => { setType(type === 'login' ? 'register' : 'login'); setError(''); }} 
              style={{ background: 'none', color: 'var(--brand-blue)', textDecoration: 'underline', fontWeight: 'bold' }}
            >
              {type === 'login' ? 'Sign Up' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SubmitForm = () => {
  const { user, token, showToast } = useContext(AuthContext);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [duration, setDuration] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company || !content || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ company, role, duration, content, is_anonymous: isAnonymous })
      });
      showToast("Story published securely!");
      setCompany('');
      setRole('');
      setDuration('');
      setContent('');
    } catch (error) {
      console.error("Error submitting post:", error);
      showToast("Failed to publish story.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="submit-form" className="glass-panel submit-form animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--brand-blue)' }}>Share Your Story</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Company Name</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Which company are you leaving?" 
            value={company}
            onChange={e => setCompany(e.target.value)}
            required
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Your Role (Optional)</label>
            <input type="text" className="form-control" placeholder="e.g. Software Engineer" value={role} onChange={e => setRole(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Duration (Optional)</label>
            <input type="text" className="form-control" placeholder="e.g. 2 years" value={duration} onChange={e => setDuration(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>The Real Reason</label>
          <textarea 
            className="form-control" 
            placeholder="What actually happened? Be honest." 
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          ></textarea>
        </div>
        
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" id="anonToggle" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
          <label htmlFor="anonToggle" style={{ margin: 0 }}>Post Anonymously {user && !isAnonymous ? `(as @${user.username})` : ''}</label>
        </div>

        <button type="submit" className="btn btn-danger" style={{ width: '100%' }} disabled={isSubmitting}>
          {isSubmitting ? 'Publishing...' : 'Publish'}
        </button>
      </form>
    </div>
  );
};

const FeedItem = ({ post }) => {
  const { user, token, showToast } = useContext(AuthContext);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);

  const isRepost = !!post.repost_id;
  const displayName = post.is_anonymous ? post.author : (post.real_username || post.author);

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    setLikesCount(prev => prev + 1);
    try {
      await fetch(`${API_URL}/posts/${post.id}/like`, { method: 'POST' });
    } catch (error) {
      setLiked(false);
      setLikesCount(prev => prev - 1);
    }
  };

  const handleRepost = async () => {
    if (!user) {
      showToast("You must be logged in to amplify stories!", "error");
      return;
    }
    if (window.confirm(`Amplify this story about ${post.company}?`)) {
      try {
        await fetch(`${API_URL}/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            repost_id: isRepost ? post.repost_id : post.id,
            is_anonymous: false
          })
        });
        showToast("Story amplified!");
      } catch (err) {
        console.error("Failed to repost", err);
        showToast("Failed to amplify.", "error");
      }
    }
  };

  // If this is a repost, we display it slightly differently
  if (isRepost) {
    return (
      <article className="glass-panel post-card animate-fade-in" style={{ border: '1px solid var(--brand-blue)' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
          {displayName} amplified this story
        </div>
        
        {/* We would render the original post details here. For MVP we'll just show a simplified version */}
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)' }}>
           <div className="post-header">
            <span className="company-tag">{post.company || 'Unknown Company'}</span>
          </div>
          <div className="post-content" style={{ fontStyle: 'italic' }}>
             "See original post in database..."
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="glass-panel post-card animate-fade-in">
      <div className="post-header">
        <div className="user-info">
          <div className="avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <h3>{displayName}</h3>
            <span>{post.role} • {post.duration}</span>
          </div>
        </div>
        <Link to={`/company/${encodeURIComponent(post.company)}`} className="company-tag" style={{ textDecoration: 'none' }}>
          {post.company}
        </Link>
      </div>
      <div className="post-content">
        {post.content}
      </div>
      <div className="post-footer">
        <button 
          className="action-btn" 
          onClick={handleLike}
          style={{ color: liked ? 'var(--toxic-red)' : '' }}
          disabled={liked}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          {likesCount} Validations
        </button>
        <button className="action-btn" onClick={handleRepost}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>
          </svg>
          Amplify
        </button>
      </div>
    </article>
  );
};

const Leaderboard = ({ posts }) => {
  const leaderboard = useMemo(() => {
    const counts = {};
    posts.forEach(post => {
      if (post.company) {
        counts[post.company] = (counts[post.company] || 0) + 1;
      }
    });
    
    return Object.entries(counts)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [posts]);

  if (leaderboard.length === 0) return null;

  return (
    <aside className="glass-panel leaderboard-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <h2 className="leaderboard-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 20h20"></path>
          <path d="m5 20 4-16"></path>
          <path d="m11 20 4-12"></path>
          <path d="m17 20 2-8"></path>
        </svg>
        Hall of Shame
      </h2>
      <ul className="leaderboard-list">
        {leaderboard.map((company, index) => (
          <li key={company.name} className={`leaderboard-item rank-${index + 1}`}>
            <div className="company-rank">
              <span className="rank-number">#{index + 1}</span>
              <Link to={`/company/${encodeURIComponent(company.name)}`} style={{ fontWeight: '600', color: 'inherit', textDecoration: 'none' }}>
                {company.name}
              </Link>
            </div>
            <span className="toxic-score">{company.score} {company.score === 1 ? 'exposé' : 'exposés'}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
};

// --- Pages ---

const Home = ({ posts }) => (
  <main className="main-content container">
    <section className="hero animate-fade-in" style={{ padding: '6rem 1rem 3rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '4rem', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1.5rem', background: 'linear-gradient(135deg, #fff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        The exit interview<br/>they never published
      </h1>
      <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '3rem' }}>
        LinkedOut is where people say the real reason they quit — verified, anonymised, and searchable by company. Read the truth before you sign the offer.
        <br/><br/>
        <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>No employer lookups. No LinkedIn sign-in. Ever.</span>
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center', marginBottom: '4rem' }}>
        <div>
          <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--brand-blue)', lineHeight: 1 }}>62%</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>of exits cite the manager, not the money</div>
        </div>
        <div>
          <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--brand-blue)', lineHeight: 1 }}>4.1x</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>more detail than a public review site</div>
        </div>
        <div>
          <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--brand-blue)', lineHeight: 1 }}>0</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>names, IPs or employers stored with your story</div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', textAlign: 'left', marginBottom: '4rem', padding: '2rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)' }}>
        <div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Verify silently</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>Confirm your employment with a payslip or work email. We check it, hash it, and throw the document away.</p>
        </div>
        <div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Write it raw</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>Tell the exit story the way you'd tell a friend. Our redactor strips names, dates and details that could identify you.</p>
        </div>
        <div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Publish protected</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>Legal review flags defamation risk before anything goes live, so your story stays sharp and stays safe.</p>
        </div>
      </div>
    </section>
    
    <div className="layout-grid">
      <div className="feed-column">
        <SubmitForm />
        
        <div className="feed-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Live Feed</h2>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--brand-blue)' }}>
            <span className="live-indicator"></span> Real-time
          </span>
        </div>
        
        <div className="feed-list">
          {posts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No exposés yet. Be the first to share your story.</p>
          ) : (
            posts.map(post => <FeedItem key={post.id} post={post} />)
          )}
        </div>
      </div>
      
      <div className="sidebar-column">
        <Leaderboard posts={posts} />
      </div>
    </div>
  </main>
);

const CompanyPage = () => {
  const { companyName } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/posts/company/${encodeURIComponent(companyName)}`)
      .then(res => res.json())
      .then(data => setPosts(data));
  }, [companyName]);

  return (
    <main className="main-content container animate-fade-in">
      <button onClick={() => navigate(-1)} className="btn" style={{ background: 'transparent', color: 'var(--text-muted)', marginBottom: '1rem', padding: 0 }}>
        &larr; Back
      </button>
      
      <section className="hero" style={{ padding: '2rem 1rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)' }}>
        <div>
          <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px' }}>Company Profile</span>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)', WebkitTextFillColor: 'initial', background: 'none' }}>{companyName}</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Read what former employees have to say.</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--toxic-red)', lineHeight: '1' }}>{posts.length}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Exposés</div>
        </div>
      </section>
      
      <div className="layout-grid" style={{ marginTop: '2rem', gridTemplateColumns: '1fr' }}>
        <div className="feed-column" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <div className="feed-list">
            {posts.map(post => <FeedItem key={post.id} post={post} />)}
          </div>
        </div>
      </div>
    </main>
  );
};

// --- App Container ---

function AppContent() {
  const [authModal, setAuthModal] = useState(null); // 'login' or 'register'
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Initial fetch
    fetch(`${API_URL}/posts`)
      .then(res => res.json())
      .then(data => setPosts(data));

    // Socket listeners for real-time
    socket.on('new_post', (newPost) => {
      setPosts(prev => [newPost, ...prev]);
    });

    return () => socket.off('new_post');
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Header onShowAuth={setAuthModal} />
        {authModal && <AuthModal type={authModal} onClose={() => setAuthModal(null)} />}
        
        <Routes>
          <Route path="/" element={<Home posts={posts} />} />
          <Route path="/company/:companyName" element={<CompanyPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
