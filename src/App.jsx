import React, { useState, useEffect, useContext, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import './App.css';

const API_URL = 'http://localhost:3001/api';
const socket = io('http://localhost:3001');

const AuthContext = createContext();

// --- Icons ---
const Icons = {
  Logo: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="32" fill="var(--brand-primary)"><circle cx="12" cy="12" r="10" fill="currentColor"/><path fill="white" d="M12 6a6 6 0 100 12 6 6 0 000-12zm3 8h-2v2a1 1 0 01-2 0v-2H9a1 1 0 010-2h2v-2a1 1 0 012 0v2h2a1 1 0 010 2z"/></svg>,
  Home: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="20" fill="currentColor"><path d="M20 11.205v9.295a1.5 1.5 0 01-1.5 1.5h-4.5v-6h-4v6H5.5A1.5 1.5 0 014 20.5v-9.295L12 3.5l8 7.705z"/></svg>,
  Explore: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-4H8v-2h3v-3h2v3h3v2h-3v4h-2z"/></svg>,
  Upvote: ({ active }) => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color: active ? 'var(--vote-up)' : 'currentColor'}}><polyline points="18 15 12 9 6 15"></polyline></svg>,
  Downvote: ({ active }) => <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color: active ? 'var(--vote-down)' : 'currentColor'}}><polyline points="6 9 12 15 18 9"></polyline></svg>,
  Comment: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="20" fill="currentColor"><path d="M12 2C6.48 2 2 5.58 2 10c0 2.65 1.57 4.95 3.96 6.27L5 21l4.22-2.11C10.09 19.34 11.02 19.5 12 19.5c5.52 0 10-3.58 10-8s-4.48-8-10-8z"/></svg>,
  Share: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="20" fill="currentColor"><path d="M14 3v4.06C8.81 7.55 5 9.87 3 14c2.51-2.91 5.95-4.32 10-4.32V14l6-5.5L14 3z"/></svg>,
  User: () => <svg viewBox="0 0 24 24" aria-hidden="true" width="20" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
  Google: () => <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>,
  Apple: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.368 14.156c-.52.274-1.127.425-1.764.432-1.317.02-2.315-.658-2.923-.658-.6 0-1.782.723-2.905.705-1.206-.022-2.32-.705-2.936-1.783-1.248-2.183-.847-5.5.382-7.29 1.115-1.62 2.91-2.023 4.144-2.023 1.056.002 2.03.65 2.61.65.578 0 1.76-.79 3.056-.755.932.023 2.13.332 2.872 1.34-2.298 1.4-1.895 4.542.457 5.565-.633 1.693-1.884 3.197-2.993 3.817z"/></svg>
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
        <input 
          type="text" 
          placeholder="Search LinkedOut..." 
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target.value) {
              window.location.href = `/search/${encodeURIComponent(e.target.value)}`;
            }
          }}
        />
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
        
        <div className="nav-section-title" style={{ marginTop: '24px' }}>Corporations</div>
        {companies.map(c => (
          <Link key={c} to={`/company/${encodeURIComponent(c)}`} className="nav-item">
            <span style={{ fontWeight: 'bold' }}>corp/</span>{c}
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
            {company ? `Corporate Dossier: corp/${company}` : 'About LinkedOut'}
          </div>
          <div className="about-body">
            {company 
              ? `Welcome to the dossier on corp/${company}. This space is dedicated to anonymous discussions and exposés about working at ${company}.` 
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
      console.error(err);
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
             placeholder="Choose a corporation (e.g. Amazon)" 
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
      console.error(err);
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
      console.error(err);
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
            corp/{post.company.replace(/\s/g, '')}
          </Link>
          <span className="post-author">
            • Posted by @{displayName} {timeAgo(post.created_at)}
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
                      <span className="author">@{cName}</span> • {timeAgo(c.created_at)}
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
const SortTabs = ({ sort, setSort }) => (
  <div className="sort-tabs">
    <button className={`sort-tab ${sort === 'new' ? 'active' : ''}`} onClick={() => setSort('new')}>
      ✨ New
    </button>
    <button className={`sort-tab ${sort === 'top' ? 'active' : ''}`} onClick={() => setSort('top')}>
      🔥 Popular
    </button>
  </div>
);

const Home = ({ posts, sort, setSort }) => {
  return (
    <main className="feed-column animate-fade-in">
      <SubmitForm />
      <SortTabs sort={sort} setSort={setSort} />
      {posts.map(post => <FeedItem key={post.id} post={post} />)}
    </main>
  );
};

const CompanyPage = () => {
  const { companyName } = useParams();
  const [posts, setPosts] = useState([]);
  const [sort, setSort] = useState('new');
  
  useEffect(() => {
    fetch(`${API_URL}/posts/company/${encodeURIComponent(companyName)}?sort=${sort}`)
      .then(res => res.json())
      .then(data => setPosts(data));
  }, [companyName, sort]);

  return (
    <div className="reddit-layout" style={{ paddingTop: '0' }}>
      <main className="feed-column animate-fade-in">
        <div style={{ padding: '24px 0 16px' }}>
          <h1 style={{ color: 'var(--text-title)' }}>corp/{companyName}</h1>
        </div>
        <SubmitForm defaultCompany={companyName} />
        <SortTabs sort={sort} setSort={setSort} />
        {posts.length === 0 ? (
           <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No posts yet for this corporation. Be the first!</div>
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
        <h1 style={{ color: 'var(--text-title)' }}>@{username}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Employee Overview</p>
      </div>
      
      {posts.length === 0 ? (
         <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>This user hasn't posted anything yet.</div>
      ) : (
         posts.map(post => <FeedItem key={post.id} post={post} />)
      )}
    </main>
  );
};

const SearchPage = () => {
  const { query } = useParams();
  const [posts, setPosts] = useState([]);
  const [sort, setSort] = useState('top'); // Default to top for search

  useEffect(() => {
    fetch(`${API_URL}/posts/search?q=${encodeURIComponent(query)}&sort=${sort}`)
      .then(res => res.json())
      .then(data => setPosts(data));
  }, [query, sort]);

  return (
    <div className="reddit-layout" style={{ paddingTop: '0' }}>
      <main className="feed-column animate-fade-in">
        <div style={{ padding: '24px 0 16px' }}>
          <h1 style={{ color: 'var(--text-title)' }}>Search Results</h1>
          <p style={{ color: 'var(--text-muted)' }}>Showing results for "{query}"</p>
        </div>
        <SortTabs sort={sort} setSort={setSort} />
        {posts.length === 0 ? (
           <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No posts found for this search.</div>
        ) : (
           posts.map(post => <FeedItem key={post.id} post={post} />)
        )}
      </main>
      <SidebarRight />
    </div>
  );
};

// --- App Container ---
function AppContent() {
  const [authModal, setAuthModal] = useState(null); // 'login' or 'register'
  const [posts, setPosts] = useState([]);
  const [sort, setSort] = useState('new');

  useEffect(() => {
    fetch(`${API_URL}/posts?sort=${sort}`)
      .then(res => res.json())
      .then(data => setPosts(data));

    socket.on('new_post', (newPost) => {
      setPosts(prev => [newPost, ...prev]);
    });

    return () => socket.off('new_post');
  }, [sort]);

  return (
    <Router>
      <Navbar onShowAuth={setAuthModal} />
      
      <div className="reddit-layout">
        <SidebarLeft posts={posts} />
        
        {authModal && <AuthModal type={authModal} onClose={() => setAuthModal(null)} />}
        
        <Routes>
          <Route path="/" element={<Home posts={posts} sort={sort} setSort={setSort} />} />
          <Route path="/company/:companyName" element={<CompanyPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/search/:query" element={<SearchPage />} />
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
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
           <button type="button" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => window.location.href = 'http://localhost:3001/auth/google'}>
              <Icons.Google /> Continue with Google
           </button>
           <button type="button" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => showToast("Apple OAuth coming soon.", "error")}>
              <Icons.Apple /> Continue with Apple
           </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
           <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
           <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 'bold' }}>OR</span>
           <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
        </div>
        
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
          {isLogin ? "New to LinkedOut? " : "Already an employee? "}
          <span style={{ color: 'var(--brand-primary)', cursor: 'pointer', fontWeight: '700' }} onClick={() => setIsLogin(!isLogin)}>
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
  const [token, setToken] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      window.history.replaceState({}, document.title, window.location.pathname);
      localStorage.setItem('token', urlToken);
      return urlToken;
    }
    return localStorage.getItem('token');
  });
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
