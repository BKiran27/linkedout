import React, { useState, useEffect, useContext, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import './App.css';

const API_URL = 'http://localhost:3001/api';
const socket = io('http://localhost:3001');

const AuthContext = createContext();

// --- Icons ---
const Icons = {
  Logo: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="32" fill="var(--brand-orange)"><circle cx="12" cy="12" r="10" fill="currentColor"/><path fill="white" d="M12 6a6 6 0 100 12 6 6 0 000-12zm3 8h-2v2a1 1 0 01-2 0v-2H9a1 1 0 010-2h2v-2a1 1 0 012 0v2h2a1 1 0 010 2z"/></svg>,
  Home: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="20" fill="currentColor"><path d="M20 11.205v9.295a1.5 1.5 0 01-1.5 1.5h-4.5v-6h-4v6H5.5A1.5 1.5 0 014 20.5v-9.295L12 3.5l8 7.705z"/></svg>,
  Explore: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-4H8v-2h3v-3h2v3h3v2h-3v4h-2z"/></svg>,
  Upvote: ({ active }) => <svg viewBox="0 0 24 24" aria-hidden="true" width="24" fill={active ? 'var(--vote-up)' : 'currentColor'}><path d="M12 4 3 15h6v5h6v-5h6z"/></svg>,
  Downvote: ({ active }) => <svg viewBox="0 0 24 24" aria-hidden="true" width="24" fill={active ? 'var(--vote-down)' : 'currentColor'}><path d="M12 20 3 9h6V4h6v5h6z"/></svg>,
  Comment: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="20" fill="currentColor"><path d="M12 2C6.48 2 2 5.58 2 10c0 2.65 1.57 4.95 3.96 6.27L5 21l4.22-2.11C10.09 19.34 11.02 19.5 12 19.5c5.52 0 10-3.58 10-8s-4.48-8-10-8z"/></svg>,
  Share: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="20" fill="currentColor"><path d="M14 3v4.06C8.81 7.55 5 9.87 3 14c2.51-2.91 5.95-4.32 10-4.32V14l6-5.5L14 3z"/></svg>,
  User: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="20" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
};

// --- Navbar ---
const Navbar = ({ onShowAuth }) => {
  const { user, logout } = useContext(AuthContext);
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="logo-icon"><Icons.Logo /></div>
        LinkedOut
      </Link>
      <div className="search-bar">
        <input type="text" placeholder="Search LinkedOut..." />
      </div>
      <div className="navbar-auth">
        {user ? (
          <>
            <Link to={`/profile/${user.username}`} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.User /> {user.username}
            </Link>
            <button className="btn btn-outline" onClick={logout}>Log Out</button>
          </>
        ) : (
          <>
            <button className="btn btn-outline" onClick={() => onShowAuth('login')}>Log In</button>
            <button className="btn btn-primary" onClick={() => onShowAuth('register')}>Sign Up</button>
          </>
        )}
      </div>
    </nav>
  );
};

// --- Left Sidebar ---
const SidebarLeft = ({ posts }) => {
  // Extract unique companies for communities list
  const companies = [...new Set(posts.map(p => p.company))].slice(0, 10);
  
  return (
    <aside className="sidebar-left">
      <div className="sidebar-left-inner">
        <div className="nav-section-title">Feeds</div>
        <Link to="/" className="nav-item">
          <Icons.Home /> Home
        </Link>
        <Link to="/" className="nav-item">
          <Icons.Explore /> Popular
        </Link>
        
        <div className="nav-section-title" style={{ marginTop: '24px' }}>Communities</div>
        {companies.map(c => (
          <Link key={c} to={`/company/${encodeURIComponent(c)}`} className="nav-item">
            <span style={{ fontWeight: 'bold' }}>c/</span>{c}
          </Link>
        ))}
      </div>
    </aside>
  );
};

// --- Right Sidebar ---
const SidebarRight = ({ company }) => {
  return (
    <aside className="sidebar-right">
      <div className="sidebar-right-inner">
        <div className="about-card">
          <div className="about-header">
            {company ? `About c/${company}` : 'About LinkedOut'}
          </div>
          <div className="about-body">
            {company 
              ? `Welcome to c/${company}. This community is dedicated to anonymous discussions and exposés about working at ${company}.` 
              : 'LinkedOut is the front page of corporate accountability. Expose toxic work environments anonymously.'}
            
            <div className="about-stat">
              <span className="stat-num">1.2m</span>
              <span className="stat-label">Whistleblowers</span>
            </div>
            
            <Link to="/" className="btn btn-primary" style={{ display: 'block', marginTop: '16px', width: '100%' }}>
              Create Post
            </Link>
          </div>
        </div>

        {!company && (
          <div className="about-card">
            <div className="about-header" style={{ backgroundColor: '#272729' }}>
              Rules
            </div>
            <div className="about-body">
              <ol style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Protect your identity.</li>
                <li>No doxxing coworkers.</li>
                <li>Focus on leadership and company policies.</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

// --- Submit Form ---
const SubmitForm = ({ defaultCompany = '' }) => {
  const { user, token, showToast } = useContext(AuthContext);
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState(defaultCompany);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return showToast("You must be logged in to post.", "error");
    setIsSubmitting(true);
    
    try {
      await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, company, content, is_anonymous: isAnonymous })
      });
      setTitle('');
      setContent('');
      setExpanded(false);
      showToast("Post submitted successfully!");
    } catch (err) {
      showToast("Failed to submit post.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!expanded) {
    return (
      <div className="submit-box">
        <div className="submit-box-header">
          <div className="avatar">{user && user.username ? user.username.charAt(0).toUpperCase() : '?'}</div>
          <input 
            type="text" 
            className="submit-input-fake" 
            placeholder="Create Post" 
            onClick={() => setExpanded(true)}
            readOnly
          />
        </div>
      </div>
    );
  }

  return (
    <div className="submit-box">
      <div style={{ fontWeight: '600', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        Create a post
      </div>
      <form className="submit-form" onSubmit={handleSubmit}>
        {!defaultCompany && (
           <input 
             type="text" 
             className="submit-input" 
             placeholder="Choose a community (e.g. Amazon)" 
             value={company} 
             onChange={e => setCompany(e.target.value)} 
             required
           />
        )}
        <input 
          type="text" 
          className="submit-input" 
          placeholder="Title" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          maxLength="300"
          required
        />
        <textarea 
          className="submit-textarea" 
          placeholder="Text (optional)" 
          value={content} 
          onChange={e => setContent(e.target.value)} 
        />
        
        <div className="submit-footer">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
            Post Anonymously
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setExpanded(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !title || !company}>
              Post
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// --- Post Card (FeedItem) ---
const FeedItem = ({ post }) => {
  const { user, token, showToast } = useContext(AuthContext);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [voteStatus, setVoteStatus] = useState(0); // 1 = up, -1 = down, 0 = none
  
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isAnonymousComment, setIsAnonymousComment] = useState(true);

  const displayName = post.is_anonymous ? "AnonymousCoworker" : (post.real_username || post.author);
  
  // Calculate relative time
  const timeAgo = (dateStr) => {
    const diff = new Date() - new Date(dateStr);
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours} hr. ago`;
    return `${Math.floor(hours/24)} days ago`;
  };

  useEffect(() => {
    const handleNewComment = (comment) => {
      if (comment.post_id === post.id) {
        setComments(prev => [...prev, comment]);
      }
    };
    socket.on('new_comment', handleNewComment);
    return () => socket.off('new_comment', handleNewComment);
  }, [post.id]);

  const handleVote = async (direction, e) => {
    e.stopPropagation();
    if (voteStatus === direction) return; // Already voted this way
    
    let scoreChange = 0;
    if (direction === 1) {
      scoreChange = voteStatus === -1 ? 2 : 1;
    } else if (direction === -1) {
      scoreChange = voteStatus === 1 ? -2 : -1;
    }

    setVoteStatus(direction);
    setLikesCount(prev => prev + scoreChange);
    
    try {
      await fetch(`${API_URL}/posts/${post.id}/vote`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scoreChange })
      });
    } catch (error) {
      // Ignore errors for UI responsiveness in MVP
      console.error(error);
    }
  };

  const fetchComments = async (e) => {
    e.stopPropagation();
    if (showComments) {
      setShowComments(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/posts/${post.id}/comments`);
      const data = await res.json();
      setComments(data);
      setShowComments(true);
    } catch (err) {
      showToast("Failed to load comments", "error");
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!user) return showToast("Log in to comment", "error");
    if (!newComment.trim()) return;

    try {
      await fetch(`${API_URL}/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: newComment, is_anonymous: isAnonymousComment })
      });
      setNewComment('');
      showToast("Comment posted!");
    } catch (err) {
      showToast("Failed to post comment", "error");
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const link = `${window.location.origin}/company/${encodeURIComponent(post.company)}`;
    navigator.clipboard.writeText(link);
    showToast("Link copied to clipboard!");
  };

  return (
    <article className="post-card animate-fade-in">
      {/* Vote Column */}
      <div className="vote-column">
        <button className={`vote-btn ${voteStatus === 1 ? 'upvoted' : ''}`} onClick={(e) => handleVote(1, e)}>
          <Icons.Upvote active={voteStatus === 1} />
        </button>
        <span className="vote-score" style={{ color: voteStatus === 1 ? 'var(--vote-up)' : voteStatus === -1 ? 'var(--vote-down)' : 'var(--text-title)' }}>
          {likesCount}
        </span>
        <button className={`vote-btn ${voteStatus === -1 ? 'downvoted' : ''}`} onClick={(e) => handleVote(-1, e)}>
          <Icons.Downvote active={voteStatus === -1} />
        </button>
      </div>

      {/* Content */}
      <div className="post-content">
        <div className="post-header">
          <Link to={`/company/${encodeURIComponent(post.company)}`} className="community-name">
            c/{post.company.replace(/\s/g, '')}
          </Link>
          <span className="post-author">
            • Posted by u/{displayName} {timeAgo(post.created_at)}
          </span>
        </div>
        
        {post.title && <h3 className="post-title">{post.title}</h3>}
        
        {post.content && (
          <div className="post-body">
            {post.content}
          </div>
        )}
        
        <div className="post-actions">
          <button className="action-btn" onClick={fetchComments}>
            <Icons.Comment />
            {post.comments || 0} Comments
          </button>
          <button className="action-btn" onClick={handleShare}>
            <Icons.Share />
            Share
          </button>
        </div>

        {/* Comment Thread UI */}
        {showComments && (
          <div className="comments-section">
            <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'flex-start' }}>
               <textarea 
                 placeholder="What are your thoughts?" 
                 className="submit-textarea" 
                 style={{ flex: 1, minHeight: '60px', padding: '8px' }}
                 value={newComment} 
                 onChange={e => setNewComment(e.target.value)} 
                 required
               />
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 1rem' }}>Comment</button>
                 <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                   <input type="checkbox" checked={isAnonymousComment} onChange={e => setIsAnonymousComment(e.target.checked)} />
                   Anon
                 </label>
               </div>
            </form>
            
            {comments.map(c => {
              const cName = c.is_anonymous ? 'AnonymousCoworker' : c.real_username;
              return (
                <div key={c.id} className="comment-item">
                  <div className="comment-avatar">
                    {cName.charAt(0).toUpperCase()}
                  </div>
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="author">u/{cName}</span> • {timeAgo(c.created_at)}
                    </div>
                    <div className="comment-body">{c.content}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </article>
  );
};

// --- Pages ---
const Home = ({ posts }) => {
  return (
    <main className="feed-column animate-fade-in">
      <SubmitForm />
      {posts.map(post => <FeedItem key={post.id} post={post} />)}
    </main>
  );
};

const CompanyPage = () => {
  const { companyName } = useParams();
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    fetch(`${API_URL}/posts/company/${encodeURIComponent(companyName)}`)
      .then(res => res.json())
      .then(data => setPosts(data));
  }, [companyName]);

  return (
    <div className="reddit-layout" style={{ paddingTop: '0' }}>
      <main className="feed-column animate-fade-in">
        <div style={{ padding: '24px 0 16px' }}>
          <h1 style={{ color: 'var(--text-title)' }}>c/{companyName}</h1>
        </div>
        <SubmitForm defaultCompany={companyName} />
        {posts.length === 0 ? (
           <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No posts yet for this community. Be the first!</div>
        ) : (
           posts.map(post => <FeedItem key={post.id} post={post} />)
        )}
      </main>
      <SidebarRight company={companyName} />
    </div>
  );
};

const ProfilePage = () => {
  const { username } = useParams();
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    fetch(`${API_URL}/posts/user/${encodeURIComponent(username)}`)
      .then(res => res.json())
      .then(data => setPosts(data));
  }, [username]);

  return (
    <main className="feed-column animate-fade-in">
      <div style={{ padding: '24px 0 16px' }}>
        <h1 style={{ color: 'var(--text-title)' }}>u/{username}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Overview</p>
      </div>
      
      {posts.length === 0 ? (
         <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>This user hasn't posted anything yet.</div>
      ) : (
         posts.map(post => <FeedItem key={post.id} post={post} />)
      )}
    </main>
  );
};

// --- App Container ---
function AppContent() {
  const [authModal, setAuthModal] = useState(null); // 'login' or 'register'
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/posts`)
      .then(res => res.json())
      .then(data => setPosts(data));

    socket.on('new_post', (newPost) => {
      setPosts(prev => [newPost, ...prev]);
    });

    return () => socket.off('new_post');
  }, []);

  return (
    <Router>
      <Navbar onShowAuth={setAuthModal} />
      
      <div className="reddit-layout">
        <SidebarLeft posts={posts} />
        
        {authModal && <AuthModal type={authModal} onClose={() => setAuthModal(null)} />}
        
        <Routes>
          <Route path="/" element={<Home posts={posts} />} />
          <Route path="/company/:companyName" element={<CompanyPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
        </Routes>

        <Routes>
           <Route path="/" element={<SidebarRight />} />
           <Route path="/profile/:username" element={<SidebarRight />} />
        </Routes>
      </div>
    </Router>
  );
}

// --- Auth Modal (Unchanged structurally, adapted CSS classes) ---
const AuthModal = ({ type, onClose }) => {
  const { login, register, showToast } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(type === 'login');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(username, password);
        showToast("Logged in successfully!");
      } else {
        await register(username, password);
        showToast("Account created successfully!");
      }
      onClose();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px', color: 'var(--text-title)' }}>
          {isLogin ? 'Log In' : 'Sign Up'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input type="text" placeholder="Username" className="form-control" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <input type="password" placeholder="Password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>
        
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem' }}>
          {isLogin ? "New to LinkedOut? " : "Already a redditor? "}
          <span style={{ color: 'var(--brand-blue)', cursor: 'pointer', fontWeight: '700' }} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'SIGN UP' : 'LOG IN'}
          </span>
        </div>
      </div>
    </div>
  );
};

// --- Auth Provider ---
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => { if (res.ok) return res.json(); throw new Error('Invalid token'); })
        .then(data => setUser(data))
        .catch(() => { setToken(null); localStorage.removeItem('token'); });
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setToken(data.token);
    localStorage.setItem('token', data.token);
  };

  const register = async (username, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setToken(data.token);
    localStorage.setItem('token', data.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    showToast("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, showToast }}>
      {children}
      {toast && <div className={`toast ${toast.type === 'error' ? 'toast-error' : ''} animate-slide-up`}>{toast.message}</div>}
    </AuthContext.Provider>
  );
};

function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}

export default App;
