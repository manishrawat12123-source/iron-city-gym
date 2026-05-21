import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WorkoutOnboarding = ({ userEmail, onPlanGenerated }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [prefs, setPrefs] = useState({
    goal: '',
    daysPerWeek: '',
    level: ''
  });
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);

  const goals = ["Weight Loss", "Muscle Gain", "Strength Building", "General Fitness"];
  const days = ["3 Days", "4 Days", "5 Days", "6 Days"];
  const levels = ["Beginner", "Intermediate", "Advanced"];

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, ...prefs })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedPlan(data.workoutPlan);
        setStep(4);
      }
    } catch (err) {
      console.error("Error saving preferences");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="step-content">
            <h3>SELECT YOUR GOAL</h3>
            <div className="options-grid">
              {goals.map(g => (
                <div 
                  key={g} 
                  className={`option-card ${prefs.goal === g ? 'active' : ''}`}
                  onClick={() => setPrefs({...prefs, goal: g})}
                >
                  {g}
                </div>
              ))}
            </div>
            <button className="btn-primary" disabled={!prefs.goal} onClick={handleNext}>Next Step</button>
          </div>
        );
      case 2:
        return (
          <div className="step-content">
            <h3>DAYS PER WEEK</h3>
            <div className="options-grid">
              {days.map(d => (
                <div 
                  key={d} 
                  className={`option-card ${prefs.daysPerWeek === d ? 'active' : ''}`}
                  onClick={() => setPrefs({...prefs, daysPerWeek: d})}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="btn-group">
              <button className="btn-outline" onClick={handleBack}>Back</button>
              <button className="btn-primary" disabled={!prefs.daysPerWeek} onClick={handleNext}>Next Step</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="step-content">
            <h3>EXPERIENCE LEVEL</h3>
            <div className="options-grid">
              {levels.map(l => (
                <div 
                  key={l} 
                  className={`option-card ${prefs.level === l ? 'active' : ''}`}
                  onClick={() => setPrefs({...prefs, level: l})}
                >
                  {l}
                </div>
              ))}
            </div>
            <div className="btn-group">
              <button className="btn-outline" onClick={handleBack}>Back</button>
              <button className="btn-primary" disabled={!prefs.level || loading} onClick={handleSubmit}>
                {loading ? "GENERATING..." : "BUILD MY PLAN"}
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="step-content success-step">
            <h3 style={{ fontSize: '2rem', marginBottom: '30px', color: '#00ff7f' }}>
              Your plan is ready! 💪
            </h3>
            <button 
              className="btn-primary" 
              onClick={() => onPlanGenerated(generatedPlan)}
              style={{ fontSize: '1.2rem', padding: '15px 30px' }}
            >
              GO TO DASHBOARD
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="onboarding-overlay animate-fade">
      <div className="glass onboarding-card">
        <button 
          onClick={() => navigate('/dashboard')}
          className="skip-btn"
        >
          Skip for now →
        </button>
        <header>
          <h1 className="neon-text-blue">LET'S BUILD YOUR PLAN</h1>
          {step < 4 && <p className="step-indicator">STEP {step} OF 3</p>}
        </header>
        {renderStep()}
      </div>

      <style>{`
        .onboarding-overlay {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: #0a0a0a;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 5000;
          padding: 20px;
        }
        .onboarding-card {
          width: 100%;
          max-width: 600px;
          padding: 40px;
          text-align: center;
          position: relative;
        }
        .skip-btn {
          position: absolute;
          top: 20px;
          right: 25px;
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          transition: color 0.3s;
        }
        .skip-btn:hover { color: white; }
        header h1 { font-family: 'Bebas Neue', sans-serif; font-size: 3rem; margin-bottom: 5px; }
        .step-indicator { color: var(--accent-secondary); font-weight: 800; letter-spacing: 2px; margin-bottom: 30px; }
        
        h3 { font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; margin-bottom: 20px; color: white; }
        
        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 30px;
        }
        .option-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--glass-border);
          padding: 25px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
          color: var(--text-muted);
        }
        .option-card:hover { background: rgba(255,255,255,0.1); transform: translateY(-3px); }
        .option-card.active {
          background: rgba(0, 245, 255, 0.1);
          border-color: var(--accent-primary);
          color: var(--accent-primary);
          box-shadow: 0 0 15px rgba(0, 245, 255, 0.2);
        }
        
        .btn-group { display: flex; gap: 15px; justify-content: center; }
        .btn-primary { width: 100%; max-width: 300px; }
        .btn-outline { width: 120px; }

        @media (max-width: 480px) {
          .options-grid { grid-template-columns: 1fr; }
          header h1 { font-size: 2rem; }
        }
      `}</style>
    </div>
  );
};

export default WorkoutOnboarding;
