import React, { useState } from 'react';

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [step, setStep] = useState(1); // For Registration
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: Reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [timer, setTimer] = useState(0);

  const startTimer = () => {
    setTimer(30);
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);
    
    try {
      const response = await fetch('https://iron-city-gym.onrender.com/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (data.success) {
        setStep(2);
        setMessage("Verification code sent to your email!");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Could not connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await fetch('https://iron-city-gym.onrender.com/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, otp })
      });
      const data = await response.json();
      if (data.success) {
        onLogin(data.user, data.token);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('https://iron-city-gym.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (data.success) {
        onLogin(data.user, data.token); 
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Could not connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Handlers
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('https://iron-city-gym.onrender.com/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        setForgotStep(2);
        setMessage("OTP sent to your email");
        startTimer();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Server error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('https://iron-city-gym.onrender.com/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (data.success) {
        setForgotStep(3);
        setError('');
        setMessage('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Server error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError("Passwords do not match");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('https://iron-city-gym.onrender.com/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword: password })
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Password reset successfully! Redirecting...");
        setTimeout(() => {
          setIsForgot(false);
          setIsLogin(true);
          setForgotStep(1);
          setMessage('');
        }, 2000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Server error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleForgot = () => {
    setIsForgot(!isForgot);
    setForgotStep(1);
    setError('');
    setMessage('');
    setOtp('');
  };

  return (
    <div className="auth-container animate-fade">
      <div className="glass auth-card">
        <div className="auth-header">
          <h2 className={isLogin ? "neon-text-blue" : "neon-text-red"}>
            {isForgot ? "Reset Password" : (isLogin ? "Welcome Back" : "Join the Elite")}
          </h2>
          <p>
            {isForgot ? "Follow the steps to recover access" : (isLogin ? "Login to access your training" : "Start your fitness journey today")}
          </p>
          {error && <p className="error-text">{error}</p>}
          {message && <p className="success-text">{message}</p>}
        </div>

        {isForgot ? (
          <div className="forgot-flow">
            {forgotStep === 1 && (
              <form onSubmit={handleForgotSubmit}>
                <div className="input-group">
                  <label>Registered Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
                </div>
                <button type="submit" className="btn-primary w-full mt-10" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send OTP"}
                </button>
                <p className="resend-text" onClick={toggleForgot}>← Back to Login</p>
              </form>
            )}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyResetOtp}>
                <div className="input-group">
                  <label>Enter 6-digit OTP</label>
                  <input type="text" required value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" maxLength="6" />
                </div>
                <button type="submit" className="btn-primary w-full mt-10" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </button>
                <p className="resend-text">
                  {timer > 0 ? `Resend in ${timer}s` : <span onClick={handleForgotSubmit} className="cyan-link">Resend OTP</span>}
                </p>
              </form>
            )}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword}>
                <div className="input-group password-field">
                  <label>New Password</label>
                  <input type={showPass ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" />
                  <span className="toggle-pass" onClick={() => setShowPass(!showPass)}>{showPass ? "Hide" : "Show"}</span>
                </div>
                <div className="input-group password-field">
                  <label>Confirm Password</label>
                  <input type={showPass ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" />
                </div>
                <button type="submit" className="btn-primary w-full mt-10" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}
          </div>
        ) : (
          isLogin ? (
            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label>Email Address</label>
                <input type="email" placeholder="john@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
                <p className="forgot-link" onClick={toggleForgot}>Forgot Password?</p>
              </div>
              <button type="submit" className="btn-primary w-full mt-10" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : (
            step === 1 ? (
              <form onSubmit={handleSendOTP}>
                <div className="input-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="John Doe" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <input type="email" placeholder="john@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Password</label>
                  <input type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button type="submit" className="btn-primary w-full mt-10" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <div className="input-group">
                  <label>Verification Code (OTP)</label>
                  <input type="text" placeholder="123456" required value={otp} onChange={(e) => setOtp(e.target.value)} />
                </div>
                <button type="submit" className="btn-primary w-full mt-10" disabled={isLoading}>
                  {isLoading ? "Registering..." : "Verify & Register"}
                </button>
                <p className="resend-text" onClick={() => setStep(1)}>Back to edit info</p>
              </form>
            )
          )
        )}

        {!isForgot && (
          <div className="auth-footer">
            <p>
              {isLogin ? "Don't have an account?" : "Already a member?"}{' '}
              <span onClick={() => { setIsLogin(!isLogin); setStep(1); setError(''); setMessage(''); }}>
                {isLogin ? "Sign Up" : "Login"}
              </span>
            </p>
          </div>
        )}
      </div>

      <style>{`
        .auth-container { display: flex; justify-content: center; align-items: center; min-height: 80vh; }
        .auth-card { width: 100%; max-width: 450px; padding: 40px; }
        .auth-header { text-align: center; margin-bottom: 30px; }
        .auth-header h2 { font-size: 2.5rem; margin-bottom: 10px; }
        .auth-header p { color: var(--text-muted); }
        .input-group { margin-bottom: 20px; display: flex; flex-direction: column; position: relative; }
        .input-group label { margin-bottom: 8px; font-size: 0.9rem; color: var(--text-muted); }
        .input-group input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          padding: 12px;
          border-radius: 8px;
          color: white;
          outline: none;
          transition: border-color 0.3s;
        }
        .input-group input:focus { border-color: var(--accent-primary); }
        .forgot-link {
          color: var(--accent-primary);
          font-size: 0.8rem;
          cursor: pointer;
          align-self: flex-end;
          margin-top: 5px;
        }
        .forgot-link:hover { text-decoration: underline; }
        .password-field { position: relative; }
        .toggle-pass {
          position: absolute;
          right: 12px;
          top: 38px;
          font-size: 0.75rem;
          color: var(--accent-primary);
          cursor: pointer;
        }
        .cyan-link { color: var(--accent-primary); cursor: pointer; font-weight: 600; }
        .cyan-link:hover { text-decoration: underline; }
        .w-full { width: 100%; }
        .mt-10 { margin-top: 10px; }
        .auth-footer { margin-top: 25px; text-align: center; font-size: 0.9rem; color: var(--text-muted); }
        .auth-footer span { color: var(--accent-primary); cursor: pointer; font-weight: 600; }
        .auth-footer span:hover { text-decoration: underline; }
        .error-text {
          color: var(--accent-secondary);
          font-size: 0.9rem;
          margin-top: 10px;
          background: rgba(255, 0, 85, 0.1);
          padding: 8px;
          border-radius: 6px;
        }
        .success-text {
          color: var(--accent-primary);
          font-size: 0.9rem;
          margin-top: 10px;
          background: rgba(0, 242, 254, 0.1);
          padding: 8px;
          border-radius: 6px;
        }
        .resend-text { text-align: center; margin-top: 15px; font-size: 0.85rem; color: var(--text-muted); cursor: pointer; }
        .resend-text:hover { color: white; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
};

export default Auth;
