import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Reviews from './components/Reviews';
import Help from './components/Help';
import Payment from './components/Payment';
import WorkoutOnboarding from './components/WorkoutOnboarding';
import Admin from './components/Admin';
import Progress from './components/Progress';
import Upgrade from './components/Upgrade';

// Auth check function
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const PremiumRoute = ({ children, user }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  const isAdmin = user?.email === 'manishwamu321@gmail.com';
  const plan = user?.plan?.toLowerCase();
  if (!isAdmin && plan !== 'premium') return <Navigate to="/upgrade" />;
  return children;
};

function AppContent() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gym_user');
    return saved ? JSON.parse(saved) : null;
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem('gym_user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      // Do NOT auto redirect anywhere from here
    }
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('gym_user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    
    if (!userData.workoutPlan) {
      navigate('/onboarding');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gym_user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handlePlanGenerated = (plan) => {
    const updatedUser = { ...user, workoutPlan: plan };
    setUser(updatedUser);
    localStorage.setItem('gym_user', JSON.stringify(updatedUser));
    navigate('/dashboard');
  };

  const isAdmin = user?.email === 'manishwamu321@gmail.com';
  const hideNav = location.pathname === '/login' || location.pathname === '/onboarding';

  return (
    <div className="app-main">
      {!hideNav && (
        <nav className="glass portal-nav">
          <div className="container nav-content">
            <Link to="/dashboard" className="logo neon-text-blue">IRON<span>CITY</span></Link>
            <div className="nav-links">
              <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
              {user?.plan === 'Premium' || isAdmin ? (
                <Link to="/progress" className={location.pathname === '/progress' ? 'active' : ''}>Progress</Link>
              ) : (
                <Link to="/upgrade" className={location.pathname === '/upgrade' ? 'active' : ''} style={{ color: '#ffd700' }}>
                  Progress 🔒
                </Link>
              )}
              <Link to="/payment" className={location.pathname === '/payment' ? 'active' : ''}>Plans</Link>
              <Link to="/reviews" className={location.pathname === '/reviews' ? 'active' : ''}>Reviews</Link>
              <Link to="/support" className={location.pathname === '/support' ? 'active' : ''}>Support</Link>
              {isAdmin && <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>Admin</Link>}
            </div>
            <div className="user-info">
              <span>{user?.name}</span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </nav>
      )}

      <main className={hideNav ? "" : "portal-content container"}>
        <Routes>
          <Route path="/login" element={
            <div className="app-landing">
              <header className="glass navbar container">
                <div className="logo neon-text-blue">IRON<span>CITY</span></div>
              </header>
              <main className="container">
                <Auth onLogin={handleLogin} />
              </main>
            </div>
          } />
          
          <Route path="/" element={
            <PrivateRoute>
              <Navigate to="/dashboard" />
            </PrivateRoute>
          } />
          
          <Route path="/onboarding" element={
            <PrivateRoute>
              <WorkoutOnboarding userEmail={user?.email} onPlanGenerated={handlePlanGenerated} />
            </PrivateRoute>
          } />

          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard user={user} onUpgrade={() => navigate('/payment')} />
            </PrivateRoute>
          } />

          <Route path="/progress" element={
            <PremiumRoute user={user}>
              <Progress user={user} />
            </PremiumRoute>
          } />

          <Route path="/upgrade" element={
            <PrivateRoute>
              <Upgrade />
            </PrivateRoute>
          } />

          <Route path="/payment" element={
            <PrivateRoute>
              <Payment onPaymentSuccess={() => navigate('/dashboard')} />
            </PrivateRoute>
          } />

          <Route path="/reviews" element={
            <PrivateRoute>
              <Reviews />
            </PrivateRoute>
          } />

          <Route path="/support" element={
            <PrivateRoute>
              <Help />
            </PrivateRoute>
          } />

          <Route path="/admin" element={
            <PrivateRoute>
              {isAdmin ? <Admin user={user} /> : <Navigate to="/dashboard" />}
            </PrivateRoute>
          } />

          {/* Koi bhi unknown route → login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </main>

      <style jsx>{`
        .app-main { min-height: 100vh; background: #050505; }
        .portal-nav { position: sticky; top: 0; z-index: 1000; background: rgba(10, 10, 10, 0.8); }
        .nav-content { display: flex; justify-content: space-between; align-items: center; height: 80px; }
        .nav-links { display: flex; gap: 30px; }
        .nav-links a { 
          text-decoration: none; color: var(--text-muted); 
          font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; 
          transition: all 0.3s; letter-spacing: 1px; 
        }
        .nav-links a.active { color: var(--accent-primary); text-shadow: var(--neon-blue); }
        .user-info { display: flex; align-items: center; gap: 15px; }
        .logout-btn { background: rgba(255, 45, 107, 0.1); border: 1px solid var(--accent-secondary); color: var(--accent-secondary); padding: 6px 15px; border-radius: 6px; cursor: pointer; }
        .portal-content { padding: 40px 0; }
        .app-landing { min-height: 100vh; background: radial-gradient(circle at 50% 50%, #111 0%, #050505 100%); }
        .navbar { margin-top: 20px; padding: 15px 30px; display: flex; justify-content: center; }
        .logo { font-size: 1.8rem; font-weight: 800; letter-spacing: 2px; text-decoration: none; }
        .logo span { color: var(--text-main); text-shadow: none; }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
