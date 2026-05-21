import React from 'react';
import { useNavigate } from 'react-router-dom';

const Upgrade = () => {
  const navigate = useNavigate();

  return (
    <div className="upgrade-container animate-fade">
      <div className="upgrade-card glass">
        <div className="lock-icon">🔒</div>
        <h1 className="neon-text-gold">PREMIUM FEATURE</h1>
        <p className="subtext">Progress Tracking is exclusive to Premium members</p>
        
        <div className="features-list">
          <div className="feature-item">
            <span className="check">✓</span>
            <p>Weekly progress updates by your trainer</p>
          </div>
          <div className="feature-item">
            <span className="check">✓</span>
            <p>Weight & body fat percentage tracking</p>
          </div>
          <div className="feature-item">
            <span className="check">✓</span>
            <p>Advanced progress charts & graphs</p>
          </div>
          <div className="feature-item">
            <span className="check">✓</span>
            <p>Personalized trainer notes & feedback</p>
          </div>
        </div>

        <button className="btn-gold" onClick={() => navigate('/payment')}>
          UPGRADE TO PREMIUM →
        </button>
      </div>

      <style>{`
        .upgrade-container { 
          min-height: 80vh; 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          padding: 20px; 
        }
        
        .upgrade-card { 
          max-width: 500px; 
          width: 100%; 
          padding: 50px 30px; 
          text-align: center; 
          border: 1px solid rgba(255, 215, 0, 0.2); 
          border-radius: 20px;
          background: rgba(0,0,0,0.6);
        }

        .lock-icon { 
          font-size: 5rem; 
          margin-bottom: 20px; 
          text-shadow: 0 0 20px rgba(255, 215, 0, 0.5); 
        }

        .neon-text-gold { 
          font-family: 'Bebas Neue', sans-serif; 
          font-size: 3rem; 
          color: #ffd700; 
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.5); 
          margin-bottom: 10px; 
          letter-spacing: 2px;
        }

        .subtext { 
          color: var(--text-muted); 
          font-size: 1.1rem; 
          margin-bottom: 40px; 
        }

        .features-list { 
          text-align: left; 
          background: rgba(255, 255, 255, 0.05); 
          padding: 25px; 
          border-radius: 12px; 
          margin-bottom: 40px; 
        }

        .feature-item { 
          display: flex; 
          align-items: center; 
          gap: 15px; 
          margin-bottom: 15px; 
        }

        .feature-item:last-child { 
          margin-bottom: 0; 
        }

        .check { 
          color: #ffd700; 
          font-weight: 800; 
          font-size: 1.2rem; 
        }

        .feature-item p { 
          color: white; 
          font-size: 0.95rem; 
          margin: 0; 
        }

        .btn-gold { 
          background: #ffd700; 
          color: black; 
          border: none; 
          padding: 16px 32px; 
          font-family: 'Bebas Neue', sans-serif; 
          font-size: 1.5rem; 
          border-radius: 8px; 
          cursor: pointer; 
          width: 100%; 
          letter-spacing: 2px; 
          transition: all 0.3s; 
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
        }

        .btn-gold:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 0 30px rgba(255, 215, 0, 0.5); 
        }
      `}</style>
    </div>
  );
};

export default Upgrade;
