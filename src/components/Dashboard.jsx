import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';

const Dashboard = ({ user, onUpgrade }) => {
  const navigate = useNavigate();
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workoutData, setWorkoutData] = useState({ plan: null, day: 1, streak: 0 });
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [dietData, setDietData] = useState({ isCustom: false, protein: 180, carbs: 300, fat: 70 });
  const [progressData, setProgressData] = useState([]);

  useEffect(() => {
    fetch('https://iron-city-gym.onrender.com/api/dashboard')
      .then(res => res.json())
      .then(data => setMemberData(data))
      .catch(err => console.error(err));

    if (user?.email) {
      fetch(`https://iron-city-gym.onrender.com/api/user/diet-plan?email=${user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.plan) {
            setDietData({ ...data.plan, isCustom: true });
          }
        })
        .catch(err => console.error(err));

      fetch(`https://iron-city-gym.onrender.com/api/user/progress?email=${user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            // Get last 7 days
            const recent = data.progress.slice(-7);
            setProgressData(recent);
          }
        })
        .catch(err => console.error(err));

      fetch(`https://iron-city-gym.onrender.com/api/user/workout-plan?email=${user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setWorkoutData({ plan: data.workoutPlan, day: data.currentDay, streak: data.streak });
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleComplete = async (exerciseId) => {
    try {
      const res = await fetch('https://iron-city-gym.onrender.com/api/user/workout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, day: workoutData.day, exerciseId })
      });
      const data = await res.json();
      if (data.success) {
        const updatedPlan = [...workoutData.plan];
        const dayPlan = updatedPlan.find(d => d.day === workoutData.day);
        const ex = dayPlan.exercises.find(e => e.id === exerciseId);
        ex.done = !ex.done;
        setWorkoutData({ ...workoutData, plan: updatedPlan, streak: data.streak, day: data.currentDay });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading-screen">Loading your training portal...</div>;
  if (!memberData) return <div>Error loading dashboard.</div>;

  const todayPlan = Array.isArray(workoutData.plan) 
  ? workoutData.plan.find(d => d.day === workoutData.day) 
  : null;
  const progressPercent = (workoutData.day / 30) * 100;

  const totalCals = (dietData.protein * 4) + (dietData.carbs * 4) + (dietData.fat * 9);
  
  const MacroRing = ({ label, value, color, totalMacros }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const percent = Math.round((value / totalMacros) * 100);
    const strokeDashoffset = circumference - (percent / 100) * circumference;
    
    return (
      <div className="macro-ring-container">
        <svg className="macro-ring" width="80" height="80" viewBox="0 0 80 80">
          <circle className="ring-bg" cx="40" cy="40" r={radius} />
          <circle 
            className="ring-progress" 
            cx="40" cy="40" r={radius} 
            style={{ 
              stroke: color, 
              strokeDasharray: circumference, 
              '--offset': strokeDashoffset 
            }} 
          />
        </svg>
        <div className="ring-content">
          <span className="ring-value">{value}g</span>
          <span className="ring-percent" style={{ color }}>{percent}%</span>
        </div>
        <div className="ring-label">{label}</div>
      </div>
    );
  };

  const totalMacroGrams = dietData.protein + dietData.carbs + dietData.fat;
  const isAdmin = user?.email === 'manishwamu321@gmail.com';
  const showLockedWidget = user?.plan !== 'Premium' && !isAdmin;

  const generateBasicDietPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setTextColor(0, 245, 255);
    doc.setFontSize(24);
    doc.text("IRON CITY GYM", 105, 30, { align: "center" });
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("BASIC DIET PLAN", 105, 45, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Member: ${user?.name || user?.email || 'Valued Member'}`, 20, 60);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 70);
    
    doc.setTextColor(0, 245, 255);
    doc.text("Daily Targets:", 20, 90);
    doc.setTextColor(255, 255, 255);
    doc.text("- Calories: 1900 kcal", 30, 100);
    doc.text("- Protein: 120g", 30, 110);
    doc.text("- Carbs: 250g", 30, 120);
    doc.text("- Fats: 50g", 30, 130);
    
    doc.setTextColor(0, 245, 255);
    doc.text("Meal Plan:", 20, 150);
    doc.setTextColor(255, 255, 255);
    doc.text("Breakfast (7:00 AM):\n- 4 egg whites + 1 whole egg scrambled\n- 2 whole wheat toast\n- 1 banana\n- Green tea", 30, 160);
    doc.text("Mid Morning (10:00 AM):\n- 1 cup greek yogurt\n- handful of almonds (20g)", 30, 190);
    doc.text("Lunch (1:00 PM):\n- 150g grilled chicken breast\n- 1 cup brown rice\n- Mixed salad with olive oil dressing", 30, 210);
    doc.text("Evening Snack (4:00 PM):\n- 1 scoop whey protein in water\n- 1 apple", 30, 235);
    doc.text("Dinner (7:00 PM):\n- 150g fish or paneer\n- 2 chapati\n- 1 cup dal\n- Vegetables", 30, 255);
    
    doc.addPage();
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(0, 245, 255);
    doc.text("Notes:", 20, 30);
    doc.setTextColor(255, 255, 255);
    doc.text("- Drink 3-4 liters water daily\n- Avoid sugar and processed foods\n- Eat every 3-4 hours", 30, 40);
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text("IRON CITY GYM — ironcity.com", 105, 280, { align: "center" });
    
    doc.save("IronCity_Basic_Diet_Plan.pdf");
  };

  const generateCustomDietPDF = () => {
    if (!dietData || !dietData.isCustom) return;
    const doc = new jsPDF();
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, 210, 297, 'F');
    
    const titleColor = user.plan === 'Premium' ? [255, 215, 0] : [255, 45, 107];
    doc.setTextColor(...titleColor);
    doc.setFontSize(24);
    doc.text("IRON CITY GYM", 105, 30, { align: "center" });
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(dietData.title || "CUSTOM DIET PLAN", 105, 45, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Member: ${user?.name || user?.email || 'Valued Member'}`, 20, 60);
    doc.text(`Plan: ${user.plan}`, 20, 70);
    
    doc.setTextColor(...titleColor);
    doc.text("Daily Targets:", 20, 90);
    doc.setTextColor(255, 255, 255);
    doc.text(`- Calories: ${dietData.calories} kcal`, 30, 100);
    doc.text(`- Protein: ${dietData.protein}g`, 30, 110);
    doc.text(`- Carbs: ${dietData.carbs}g`, 30, 120);
    doc.text(`- Fats: ${dietData.fat}g`, 30, 130);
    
    doc.setTextColor(...titleColor);
    doc.text("Meal Plan:", 20, 150);
    doc.setTextColor(255, 255, 255);
    
    const splitMealPlan = doc.splitTextToSize(dietData.mealPlan, 170);
    doc.text(splitMealPlan, 30, 160);
    
    if (dietData.notes) {
      doc.addPage();
      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, 210, 297, 'F');
      doc.setTextColor(...titleColor);
      doc.text("Special Notes:", 20, 30);
      doc.setTextColor(255, 255, 255);
      const splitNotes = doc.splitTextToSize(dietData.notes, 170);
      doc.text(splitNotes, 30, 40);
    }
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text("IRON CITY GYM — ironcity.com", 105, 280, { align: "center" });
    
    doc.save(`IronCity_${user.plan}_Diet_Plan.pdf`);
  };

  return (
    <div className="dashboard-container animate-fade">
      <div className="dashboard-grid">
        <div className="glass dashboard-card main-stats">
          <div className="card-header">
            <h3 className="neon-text-blue">MEMBERSHIP STATUS</h3>
          </div>
          <div className="stat-content">
            <div className="stat-item"><label>Current Plan</label><p className="plan-name">{memberData.plan}</p></div>
            <div className="stat-item"><label>Expires On</label><p>{memberData.expiry}</p></div>
            <div className="stat-item highlight"><label>Days Remaining</label><p className="days-left">{memberData.daysLeft}</p></div>
            <div className="stat-item action"><button className="btn-primary" onClick={onUpgrade}>Upgrade Plan</button></div>
          </div>
        </div>

        <div className="plans-grid">
          <div className="glass dashboard-card workout-card">
            <div className="card-header">
              <h3 className="neon-text-red">TODAY'S WORKOUT</h3>
              <span className="day-counter">Day {workoutData.day} of 30</span>
            </div>
            
            {todayPlan ? (
              <>
                <p className="workout-label">{todayPlan.label}</p>
                <div className="progress-bar-container">
                  <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
                </div>
                
                <div className="exercise-list">
                  {todayPlan.exercises.map(ex => (
                    <div key={ex.id} className={`exercise-item ${ex.done ? 'done' : ''}`}>
                      <input type="checkbox" checked={ex.done} onChange={() => handleComplete(ex.id)} />
                      <div className="ex-info"><span className="ex-name">{ex.name}</span><span className="ex-reps">{ex.reps}</span></div>
                      <span className={`difficulty ${ex.difficulty.toLowerCase()}`}>{ex.difficulty}</span>
                    </div>
                  ))}
                </div>
                
                <div className="workout-footer">
                  <span className="cals">🔥 ~{todayPlan.totalCals} kcal burn</span>
                  <button className="btn-outline btn-sm" onClick={() => setShowFullPlan(true)}>Full Plan</button>
                </div>
              </>
            ) : (
              <button 
                onClick={() => navigate('/onboarding')}
                style={{
                  background: '#00f5ff',
                  color: '#000',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '8px',
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '18px',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  marginTop: '12px'
                }}
              >
                SET UP MY WORKOUT PLAN →
              </button>
            )}
          </div>
          
          {(() => {
            const userPlanStr = (user?.plan || 'basic').toLowerCase();

            if (userPlanStr.includes('basic')) {
              return (
                <div className="glass dashboard-card diet-card basic-diet">
                  <h3 className="neon-text-blue">BASIC DIET PLAN</h3>
                  <p className="plan-desc">Standard nutrition guide for gym beginners</p>
                  
                  <div className="macros-visual">
                    <MacroRing label="Protein" value={120} color="#00f5ff" totalMacros={420} />
                    <MacroRing label="Carbs" value={250} color="#00f5ff" totalMacros={420} />
                    <MacroRing label="Fat" value={50} color="#00f5ff" totalMacros={420} />
                  </div>
                  <p className="total-cals">Total: 1900 kcal/day</p>
      
                  <button className="btn-outline btn-sm" onClick={generateBasicDietPDF}>Download PDF</button>
                </div>
              );
            }

            if (userPlanStr.includes('pro') || userPlanStr.includes('premium')) {
              const isPremium = userPlanStr.includes('premium');
              return (
                <div className={`glass dashboard-card diet-card custom-diet ${isPremium ? 'premium' : 'pro'}`}>
                  <h3 className={isPremium ? 'neon-text-gold' : 'neon-text-red'}>DIET PLAN</h3>
                  
                  {dietData.isCustom ? (
                    <>
                      <p className="plan-desc">{dietData.title}</p>
                      <div className="macros-visual">
                        <MacroRing label="Protein" value={dietData.protein} color={isPremium ? "#ffd700" : "#ff2d6b"} totalMacros={totalMacroGrams} />
                        <MacroRing label="Carbs" value={dietData.carbs} color={isPremium ? "#ffd700" : "#ff2d6b"} totalMacros={totalMacroGrams} />
                        <MacroRing label="Fat" value={dietData.fat} color={isPremium ? "#ffd700" : "#ff2d6b"} totalMacros={totalMacroGrams} />
                      </div>
                      <p className="total-cals">Total: {dietData.calories} kcal/day</p>
                      
                      <button className="btn-outline btn-sm" style={isPremium ? {borderColor:'#ffd700', color:'#ffd700'} : {borderColor:'#ff2d6b', color:'#ff2d6b'}} onClick={generateCustomDietPDF}>Download PDF</button>
                      {dietData.assignedAt && (
                        <p style={{textAlign:'center', fontSize:'0.75rem', color:'#888', marginTop:'10px'}}>Last updated: {new Date(dietData.assignedAt).toLocaleDateString()}</p>
                      )}
                    </>
                  ) : (
                    <div className="diet-preparing">
                      <div className="diet-icon">🥗</div>
                      <p>Your personalized diet plan is being prepared by your trainer</p>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}

          <div 
            className={`glass dashboard-card progress-snapshot ${showLockedWidget ? 'locked-widget' : ''}`}
            onClick={() => {
              if (showLockedWidget) navigate('/upgrade');
            }}
          >
            {showLockedWidget && (
              <div className="locked-overlay">
                <div className="lock-badge">🔒 Premium Only</div>
              </div>
            )}
            
            <div className={`snapshot-inner ${showLockedWidget ? 'blurred' : ''}`}>
              <div className="card-header">
                <h3 className="neon-text-blue">PROGRESS SNAPSHOT</h3>
              </div>
              <div className="snapshot-content">
                {progressData.length > 0 ? (
                <>
                  <div className="current-weight">
                    {progressData[progressData.length - 1].weight} <span>kg</span>
                  </div>
                  <div className="mini-chart">
                    <ResponsiveContainer width="100%" height={80}>
                      <LineChart data={progressData}>
                        <Line type="monotone" dataKey="weight" stroke="#00f5ff" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <p className="no-data">No progress logged yet.</p>
              )}
            </div>
            <button 
              className="btn-primary btn-sm w-100" 
              style={{marginTop: '15px'}} 
              onClick={(e) => {
                e.stopPropagation();
                navigate(showLockedWidget ? '/upgrade' : '/progress');
              }}
            >
              VIEW FULL PROGRESS
            </button>
            </div>
          </div>
        </div>

        <div className="glass dashboard-card full-width">
          <h3>Gym Information</h3>
          <div className="gym-info-content">
            <div className="info-block"><label>Opening Hours</label><p>Mon - Sun: 05:00 AM - 11:00 PM</p></div>
            <div className="info-block"><label>Address</label><p>123 Fitness Ave, Iron City, IC 54321</p></div>
            <div className="info-block"><label>Peak Hours</label><p>05:00 PM - 08:00 PM</p></div>
          </div>
        </div>
      </div>

      {showFullPlan && (
        <div className="modal-overlay" onClick={() => setShowFullPlan(false)}>
          <div className="glass full-plan-modal" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <h2 className="neon-text-red">30-DAY WORKOUT SCHEDULE</h2>
              <button className="close-btn" onClick={() => setShowFullPlan(false)}>×</button>
            </header>
            <div className="modal-body">
              <div className="full-plan-grid">
                {workoutData.plan.map(day => (
                  <div key={day.day} className={`day-card ${day.day === workoutData.day ? 'today' : ''} ${day.completed ? 'completed' : ''}`}>
                    <div className="day-header">
                      <span className="day-num">DAY {day.day}</span>
                      {day.completed && <span className="tick">✓</span>}
                    </div>
                    <p className="day-label">{day.label}</p>
                    {day.exercises.length > 0 ? (
                      <ul className="ex-mini-list">
                        {day.exercises.map((ex, i) => <li key={i}>{ex.name}</li>)}
                      </ul>
                    ) : (
                      <span className="rest-tag">REST</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .dashboard-container { padding: 40px 0; }
        .dashboard-grid { display: grid; gap: 25px; }
        .dashboard-card { padding: 30px; position: relative; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .dashboard-card h3 { font-size: 1.5rem; margin: 0; }
        .streak-badge { background: rgba(255, 215, 0, 0.1); color: #ffd700; padding: 5px 12px; border-radius: 20px; font-weight: 800; font-size: 0.8rem; }
        .day-counter { color: var(--text-muted); font-size: 0.85rem; }
        .stat-content { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 20px; }
        .stat-item label { color: var(--text-muted); font-size: 0.85rem; display: block; margin-bottom: 5px; }
        .stat-item p { font-size: 1.2rem; font-weight: 600; }
        .plan-name { color: var(--accent-primary); }
        .days-left { font-size: 2.5rem !important; color: var(--accent-secondary); }
        .plans-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 25px; }
        .workout-label { font-weight: 800; font-size: 1.1rem; color: white; margin-bottom: 10px; }
        .progress-bar-container { background: rgba(255,255,255,0.05); height: 6px; border-radius: 3px; margin-bottom: 25px; overflow: hidden; }
        .progress-bar { background: linear-gradient(90deg, var(--accent-secondary), #ff8fa3); height: 100%; transition: width 0.5s ease; }
        .exercise-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 25px; }
        .exercise-item { display: flex; align-items: center; gap: 15px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 10px; transition: all 0.3s; }
        .exercise-item.done { opacity: 0.5; background: rgba(0, 245, 255, 0.05); }
        .exercise-item input[type="checkbox"] { width: 20px; height: 20px; accent-color: var(--accent-primary); cursor: pointer; }
        .ex-info { flex: 1; display: flex; flex-direction: column; }
        .ex-name { font-weight: 600; color: white; }
        .ex-reps { font-size: 0.8rem; color: var(--text-muted); }
        .difficulty { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; }
        .difficulty.easy { background: rgba(0, 255, 127, 0.1); color: #00ff7f; }
        .difficulty.medium { background: rgba(255, 215, 0, 0.1); color: #ffd700; }
        .difficulty.hard { background: rgba(255, 45, 107, 0.1); color: #ff2d6b; }
        .workout-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--glass-border); margin-top: 10px; padding-top: 15px; }
        .cals { font-weight: 700; color: var(--accent-primary); font-size: 0.9rem; }
        
        .diet-card { display: flex; flex-direction: column; }
        .macros-visual { display: flex; justify-content: space-between; margin: 25px 0 15px; }
        .macro-ring-container { display: flex; flex-direction: column; align-items: center; position: relative; cursor: pointer; }
        .macro-ring { transform: rotate(-90deg); }
        .ring-bg { fill: none; stroke: rgba(255,255,255,0.05); stroke-width: 6; }
        .ring-progress { fill: none; stroke-width: 6; stroke-linecap: round; animation: fillRing 1s ease-out forwards; stroke-dashoffset: var(--offset); transition: filter 0.3s; }
        .macro-ring-container:hover .ring-progress { filter: drop-shadow(0 0 5px currentColor); }
        
        @keyframes fillRing {
          0% { stroke-dashoffset: 188.5; } /* 2*pi*30 */
          100% { stroke-dashoffset: var(--offset); }
        }
        
        .ring-content { position: absolute; top: 32px; left: 0; width: 100%; text-align: center; display: flex; justify-content: center; align-items: center; }
        .ring-value { font-weight: 700; font-size: 0.9rem; color: white; transition: opacity 0.3s; }
        .ring-percent { position: absolute; font-weight: 800; font-size: 1rem; opacity: 0; transition: opacity 0.3s; }
        .macro-ring-container:hover .ring-value { opacity: 0; }
        .macro-ring-container:hover .ring-percent { opacity: 1; }
        
        .ring-label { margin-top: 8px; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .total-cals { text-align: center; font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; letter-spacing: 1px; color: white; margin-bottom: 25px; }
        
        .diet-preparing { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 200px; text-align: center; color: var(--text-muted); }
        .diet-icon { font-size: 3rem; margin-bottom: 15px; opacity: 0.7; }
        .diet-preparing p { max-width: 250px; font-style: italic; }
        .neon-text-gold { font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; color: #ffd700; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5); margin: 0; }
        
        .progress-snapshot { display: flex; flex-direction: column; position: relative; overflow: hidden; cursor: pointer; }
        .locked-widget { border: 1px solid rgba(255, 215, 0, 0.3); }
        .locked-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10; display: flex; justify-content: center; align-items: center; transition: all 0.3s; }
        .locked-widget:hover .locked-overlay { background: rgba(0,0,0,0.6); }
        .lock-badge { background: #ffd700; color: black; padding: 8px 16px; border-radius: 20px; font-weight: 800; font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; letter-spacing: 1px; display: flex; align-items: center; gap: 5px; box-shadow: 0 0 15px rgba(255, 215, 0, 0.4); }
        
        .snapshot-inner { display: flex; flex-direction: column; flex: 1; transition: filter 0.3s; }
        .snapshot-inner.blurred { filter: blur(5px); opacity: 0.7; pointer-events: none; }
        
        .snapshot-content { flex: 1; display: flex; flex-direction: column; justify-content: center; margin-top: 10px; }
        .current-weight { font-family: 'Bebas Neue', sans-serif; font-size: 3rem; color: white; margin-bottom: 10px; }
        .current-weight span { font-size: 1.2rem; color: var(--text-muted); }
        .mini-chart { width: 100%; height: 80px; margin-top: auto; }
        .no-data { color: var(--text-muted); text-align: center; margin: auto 0; font-style: italic; }
        .w-100 { width: 100%; }

        .btn-sm { padding: 8px 16px; font-size: 0.8rem; margin-top: auto; }
        .full-width { grid-column: 1 / -1; }
        .gym-info-content { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 30px; }
        .info-block label { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 5px; display: block; }
        .loading-screen { min-height: 50vh; display: flex; justify-content: center; align-items: center; font-family: 'Bebas Neue', sans-serif; font-size: 2rem; color: var(--accent-primary); }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 5000; display: flex; justify-content: center; align-items: center; padding: 20px; }
        .full-plan-modal { width: 100%; max-width: 1200px; height: 90vh; display: flex; flex-direction: column; padding: 40px; overflow: hidden; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .modal-header h2 { font-family: 'Bebas Neue', sans-serif; font-size: 2.5rem; letter-spacing: 2px; }
        .close-btn { background: none; border: none; color: white; font-size: 3rem; cursor: pointer; line-height: 1; }
        .modal-body { flex: 1; overflow-y: auto; padding-right: 10px; }
        
        .full-plan-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
        .day-card { background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); padding: 20px; border-radius: 12px; transition: all 0.3s; }
        .day-card.today { border-color: var(--accent-primary); box-shadow: 0 0 15px rgba(0, 245, 255, 0.2); transform: scale(1.05); background: rgba(0, 245, 255, 0.05); }
        .day-card.completed { background: rgba(0, 255, 127, 0.05); border-color: #00ff7f33; }
        
        .day-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .day-num { font-weight: 800; font-size: 0.8rem; color: var(--text-muted); }
        .tick { color: #00ff7f; font-weight: bold; }
        .day-label { font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; color: white; margin-bottom: 10px; }
        .ex-mini-list { list-style: none; font-size: 0.75rem; color: var(--text-muted); }
        .ex-mini-list li { margin-bottom: 4px; }
        .rest-tag { color: var(--accent-secondary); font-weight: 800; font-size: 0.8rem; }

        @media (max-width: 768px) {
          .stat-content { flex-direction: column; }
          .plans-grid { grid-template-columns: 1fr; }
          .full-plan-modal { padding: 20px; }
          .full-plan-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
