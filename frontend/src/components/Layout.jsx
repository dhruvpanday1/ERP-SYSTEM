import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Search,
  Image,
  Package,
  ChevronLeft,
  ChevronRight,
  Bell,
  Settings,
  Boxes,
  User,
  LogOut,
  X,
  Mail,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', color: '#6366f1' },
  { to: '/nl-query', icon: MessageSquare, label: 'NL Query', color: '#f43f5e' },
  { to: '/product-search', icon: Search, label: 'Product Search', color: '#0ea5e9' },
  { to: '/image-search', icon: Image, label: 'Image Search', color: '#10b981' },
  { to: '/finished-goods', icon: Package, label: 'Finished Goods', color: '#f59e0b' },
];

const pageTitles = {
  '/': 'Dashboard',
  '/nl-query': 'Natural Language Query',
  '/product-search': 'Product Search',
  '/image-search': 'Image Search',
  '/finished-goods': 'Finished Goods Explorer',
};

/* ── WFX Logo SVG ─────────────────────────────────── */
function WFXLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id="shineGrad" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="white" stopOpacity="0.18" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="accentGrad" x1="0" y1="0" x2="48" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#c4b5fd" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background rounded square */}
      <rect width="48" height="48" rx="13" fill="url(#bgGrad)" />

      {/* Inner subtle border ring */}
      <rect x="1" y="1" width="46" height="46" rx="12.5" fill="none" stroke="white" strokeOpacity="0.12" strokeWidth="1" />

      {/* Shine overlay top half */}
      <rect x="1" y="1" width="46" height="23" rx="12.5" fill="url(#shineGrad)" />

      {/* WFX text - clean, bold, modern */}
      {/* W */}
      <polyline
        points="6,15 9,29 12,21.5 15,29 18,15"
        stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"
        filter="url(#glow)"
      />

      {/* F */}
      <line x1="21" y1="15" x2="21" y2="29" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="21" y1="15" x2="28" y2="15" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="21" y1="22" x2="27" y2="22" stroke="white" strokeWidth="2.2" strokeLinecap="round" />

      {/* X */}
      <line x1="32" y1="15" x2="42" y2="29" stroke="url(#accentGrad)" strokeWidth="2.4" strokeLinecap="round" filter="url(#glow)" />
      <line x1="42" y1="15" x2="32" y2="29" stroke="url(#accentGrad)" strokeWidth="2.4" strokeLinecap="round" filter="url(#glow)" />

      {/* Accent dot bottom right */}
      <circle cx="44" cy="44" r="2.5" fill="#a78bfa" opacity="0.7" />
    </svg>
  );
}


export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    fetch(`${API_BASE}/api/stats`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data.activityFeed) {
          setNotifications(data.activityFeed);
        }
      })
      .catch(() => {});
  }, []);
  
  const location = useLocation();
  const currentTitle = pageTitles[location.pathname] || 'WFX ERP System';
  const { user, logout, updateUser } = useAuth();
  
  // Modal state
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPassword, setEditPassword] = useState(user?.password || '');
  
  // Update local state if user changes
  import('react').then(({ useEffect }) => {
    useEffect(() => {
      if (user) {
        setEditName(user.name || '');
        setEditEmail(user.email || '');
        setEditPassword(user.password || '');
      }
    }, [user]);
  });
  
  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateUser({ name: editName, email: editEmail, password: editPassword });
    setModalOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f0f2f8' }}>
      {/* Subtle Background */}
      <div className="page-blob page-blob-1" />
      <div className="page-blob page-blob-2" />

      {/* ── Sidebar ────────────────────────────── */}
      <aside
        className={`sidebar flex flex-col transition-all duration-300 ease-in-out relative z-10 ${
          collapsed ? 'w-[72px]' : 'w-[256px]'
        }`}
        style={{
          background: 'linear-gradient(180deg, #1e1b4b 0%, #1a1740 40%, #16133a 100%)',
          borderRight: 'none',
          boxShadow: '4px 0 32px rgba(0,0,0,0.18)',
        }}
      >
        {/* ── Logo Area ── */}
        <div className="flex items-center gap-3 px-4 h-[72px]">
          <div className="shrink-0">
            <WFXLogo size={collapsed ? 36 : 38} />
          </div>
          {!collapsed && (
            <div className="animate-fade-in overflow-hidden">
              <h1
                style={{
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}
              >
                WFX <span style={{
                  background: 'linear-gradient(90deg, #818cf8, #a5b4fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>ERP</span>
              </h1>
              <p style={{ fontSize: '9px', color: 'rgba(165,180,252,0.6)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '1px' }}>
                System
              </p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 16px' }} />

        {/* ── Navigation ── */}
        <nav className="flex-1 px-2.5 py-5 space-y-0.5">
          {!collapsed && (
            <p style={{ padding: '0 12px', marginBottom: '10px', fontSize: '9px', fontWeight: 700, color: 'rgba(165,180,252,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Main Menu
            </p>
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? 0 : 12,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '10px 0' : '10px 12px',
                borderRadius: '10px',
                fontSize: '13.5px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#ffffff' : 'rgba(165,180,252,0.6)',
                background: isActive ? 'rgba(99,102,241,0.25)' : 'transparent',
                border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                textDecoration: 'none',
                position: 'relative',
              })}
            >
              {({ isActive }) => (
                <>
                  {/* Active left accent */}
                  {isActive && (
                    <span style={{
                      position: 'absolute',
                      left: 0,
                      top: '20%',
                      bottom: '20%',
                      width: '3px',
                      borderRadius: '0 3px 3px 0',
                      background: item.color,
                    }} />
                  )}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: isActive ? `${item.color}22` : 'transparent',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}>
                    <item.icon
                      style={{
                        width: 16,
                        height: 16,
                        color: isActive ? item.color : 'rgba(165,180,252,0.5)',
                        transition: 'color 0.2s ease',
                      }}
                    />
                  </div>
                  {!collapsed && (
                    <span className="animate-fade-in">{item.label}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Bottom: Version + Collapse ── */}
        <div style={{ padding: '12px 10px 16px' }}>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 6px 12px' }} />

          {!collapsed && (
            <div style={{
              margin: '0 6px 10px',
              padding: '10px 12px',
              borderRadius: 10,
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Boxes style={{ width: 14, height: 14, color: '#818cf8' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(165,180,252,0.9)' }}>WFX ERP System</span>
              </div>
              <p style={{ fontSize: 10, color: 'rgba(165,180,252,0.4)', marginTop: 3, paddingLeft: 22 }}>v2.1.0 • Supabase</p>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: collapsed ? 0 : 8,
              width: '100%',
              padding: '9px 12px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(165,180,252,0.5)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {collapsed
              ? <ChevronRight style={{ width: 15, height: 15 }} />
              : <><ChevronLeft style={{ width: 15, height: 15 }} /><span>Collapse</span></>
            }
          </button>
        </div>
      </aside>

      {/* ── Main Area ──────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">

        {/* ── Top Bar ── */}
        <header className="relative z-50 flex items-center justify-between px-4 sm:px-6 md:px-8 h-[64px] sm:h-[72px] bg-white/85 backdrop-blur-[20px] border-b border-black/5 shadow-sm">
          <div>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              color: '#1e1b4b',
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
            }}>
              {currentTitle}
            </h2>
            <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, marginTop: 1 }}>
              WFX ERP System — Apparel Industry Platform
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {/* Notification */}
            <div className="relative">
              <button
                id="notifications-btn"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 sm:p-[9px] rounded-lg sm:rounded-[10px] border border-black/5 bg-white text-gray-500 hover:bg-gray-50 transition-all cursor-pointer"
              >
                <Bell style={{ width: 17, height: 17 }} />
                {notifications.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#f43f5e',
                    border: '1.5px solid white',
                  }} />
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden animate-fade-in">
                    <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                      <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 5).map((n, i) => (
                          <div key={i} className="p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                            <p className="text-xs font-semibold text-gray-800">{n.action}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{n.detail}</p>
                            <p className="text-[9px] text-gray-400 mt-1 font-medium">{n.time}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-gray-500">No new notifications</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Settings */}
            <div className="relative">
              <button
                id="settings-btn"
                onClick={() => setModalOpen(true)}
                className="p-2 sm:p-[9px] rounded-lg sm:rounded-[10px] border border-black/5 bg-white text-gray-500 hover:bg-gray-50 transition-all cursor-pointer"
              >
                <Settings style={{ width: 17, height: 17 }} />
              </button>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-7 bg-gray-200 mx-1" />

            {/* User */}
            <div className="relative">
              <button
                id="user-menu-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 sm:gap-2.5 p-1 sm:pr-3.5 sm:pl-1.5 rounded-lg sm:rounded-xl border border-black/5 bg-white hover:bg-gray-50 transition-all cursor-pointer"
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 13,
                  color: 'white',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  letterSpacing: '-0.02em',
                }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1e1b4b', letterSpacing: '-0.01em' }}>{user?.name || 'User'}</p>
                  <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>{user?.role || 'Administrator'}</p>
                </div>
              </button>
              
              {/* Dropdown Menu */}
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden animate-fade-in py-1">
                    <button 
                      onClick={() => { setModalOpen(true); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      <User className="w-4 h-4" /> My Profile
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                    <button 
                      onClick={() => { logout(); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Settings / Profile Modal ── */}
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 animate-fade-in border border-gray-100">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900">Profile Settings</h3>
                <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none text-gray-500"
                      readOnly // email usually shouldn't be edited so easily, but left editable if they want
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text" // Type text just so user can see it for this college project
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Password is visible for demo purposes.</p>
                </div>
                
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
