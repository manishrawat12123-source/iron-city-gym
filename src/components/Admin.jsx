import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const API_BASE = import.meta.env.VITE_API_URL || '';
const ADMIN_EMAIL = 'manishwamu321@gmail.com';

const getHeaders = (json = false) => {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
};

const planClass = (plan) => (plan || 'basic').toLowerCase();

const Admin = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('members');
  const [users, setUsers] = useState([]);
  const [allProgress, setAllProgress] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [toast, setToast] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberDetail, setMemberDetail] = useState(null);

  const [showDietModal, setShowDietModal] = useState(false);
  const [dietForm, setDietForm] = useState({
    title: '', calories: '', protein: '', carbs: '', fat: '', mealPlan: '', notes: '',
  });

  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workoutForm, setWorkoutForm] = useState({
    goal: 'Weight Loss', days: 3, level: 'Beginner',
  });

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressForm, setProgressForm] = useState({
    weight: '', bodyFat: '', chest: '', waist: '', arms: '', note: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [notifForm, setNotifForm] = useState({ userId: 'all', message: '', type: 'info' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const headers = getHeaders();
      const [usersRes, progressRes, notifRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/users`, { headers }),
        fetch(`${API_BASE}/api/admin/progress/all`, { headers }),
        fetch(`${API_BASE}/api/admin/notifications`, { headers }),
      ]);

      const usersData = await usersRes.json();
      const progressData = await progressRes.json();
      const notifData = await notifRes.json();

      if (!usersRes.ok) throw new Error(usersData.error || 'Failed to load members');
      if (!usersData.success) throw new Error(usersData.error || 'Invalid members response');

      setUsers(usersData.users || []);
      if (progressRes.ok && progressData.success) {
        setAllProgress(progressData.progress || []);
      }
      if (notifRes.ok && notifData.success) {
        setNotifications(notifData.notifications || []);
      }
    } catch (err) {
      console.error(err);
      setFetchError(err.message || 'Failed to load admin data');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, navigate, fetchData]);

  const handleChangePlan = async (member, newPlan) => {
    const prev = users;
    setUsers((list) =>
      list.map((u) => (u.id === member.id ? { ...u, plan: newPlan } : u))
    );
    try {
      const res = await fetch(`${API_BASE}/api/admin/user/${member.id}/plan`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify({ plan: newPlan }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.user) {
          setUsers((list) =>
            list.map((u) => (u.id === member.id ? { ...u, ...data.user } : u))
          );
        }
        showToast(`Plan updated for ${member.name}`);
      } else {
        setUsers(prev);
        showToast(data.error || 'Failed to update plan', 'error');
      }
    } catch {
      setUsers(prev);
      showToast('Failed to update plan', 'error');
    }
  };

  const openDietModal = async (member) => {
    setSelectedUser(member);
    setDietForm({ title: '', calories: '', protein: '', carbs: '', fat: '', mealPlan: '', notes: '' });
    setShowDietModal(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/user/${member.id}/diet-plan`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success && data.dietPlan) {
        setDietForm({
          title: data.dietPlan.title || '',
          calories: data.dietPlan.calories ?? '',
          protein: data.dietPlan.protein ?? '',
          carbs: data.dietPlan.carbs ?? '',
          fat: data.dietPlan.fat ?? '',
          mealPlan: data.dietPlan.mealPlan || '',
          notes: data.dietPlan.notes || '',
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveDietPlan = async (e) => {
    e.preventDefault();
    if (!selectedUser?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/user/${selectedUser.id}/diet-plan`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({
          title: dietForm.title,
          calories: Number(dietForm.calories),
          protein: Number(dietForm.protein),
          carbs: Number(dietForm.carbs),
          fat: Number(dietForm.fat),
          mealPlan: dietForm.mealPlan,
          notes: dietForm.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowDietModal(false);
        setSelectedUser(null);
        showToast(`Diet plan saved for ${selectedUser.name}`);
        fetchData();
      } else {
        showToast(data.error || 'Failed to save diet plan', 'error');
      }
    } catch {
      showToast('Failed to save diet plan', 'error');
    }
  };

  const openWorkoutModal = (member) => {
    setSelectedUser(member);
    setWorkoutForm({
      goal: member.preferences?.goal || 'Weight Loss',
      days: Number(member.preferences?.daysPerWeek) || 3,
      level: member.preferences?.level || 'Beginner',
    });
    setShowWorkoutModal(true);
  };

  const saveWorkoutPlan = async (e) => {
    e.preventDefault();
    if (!selectedUser?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/user/${selectedUser.id}/workout-plan`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify({
          workoutPlan: {
            goal: workoutForm.goal,
            level: workoutForm.level,
            daysPerWeek: workoutForm.days,
            exercises: [],
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowWorkoutModal(false);
        setSelectedUser(null);
        showToast(`Workout plan saved for ${selectedUser.name}`);
        fetchData();
      } else {
        showToast(data.error || 'Failed to save workout plan', 'error');
      }
    } catch {
      showToast('Failed to save workout plan', 'error');
    }
  };

  const openProgressModal = (row) => {
    const member = users.find((u) => u.id === row.userId) || { id: row.userId, name: row.name, email: row.email };
    setSelectedUser(member);
    setProgressForm({
      weight: '', bodyFat: '', chest: '', waist: '', arms: '', note: '',
      date: new Date().toISOString().split('T')[0],
    });
    setShowProgressModal(true);
  };

  const saveProgress = async (e) => {
    e.preventDefault();
    if (!selectedUser?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/user/${selectedUser.id}/progress`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(progressForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowProgressModal(false);
        setSelectedUser(null);
        showToast(`Progress updated for ${selectedUser.name}`);
        fetchData();
      } else {
        showToast(data.error || 'Failed to save progress', 'error');
      }
    } catch {
      showToast('Failed to save progress', 'error');
    }
  };

  const sendNotification = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/admin/notifications/send`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(notifForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Notification sent');
        setNotifForm({ userId: 'all', message: '', type: 'info' });
        fetchData();
      } else {
        showToast(data.error || 'Failed to send notification', 'error');
      }
    } catch {
      showToast('Failed to send notification', 'error');
    }
  };

  if (loading) return <div className="admin-loading">Loading Admin Portal...</div>;

  return (
    <div className="admin-layout animate-fade">
      {toast && (
        <div className={`admin-toast admin-toast-${toast.type}`}>{toast.message}</div>
      )}

      <aside className="admin-sidebar">
        <div className="admin-logo neon-text-blue">
          IRON<span>CITY</span>
          <span style={{ fontSize: '0.8rem', color: '#fff', letterSpacing: '1px', marginLeft: '5px' }}>ADMIN</span>
        </div>
        <ul className="admin-menu">
          <li className={activeTab === 'members' ? 'active' : ''} onClick={() => setActiveTab('members')}>👥 Members</li>
          <li className={activeTab === 'diet' ? 'active' : ''} onClick={() => setActiveTab('diet')}>🥗 Diet Plans</li>
          <li className={activeTab === 'workout' ? 'active' : ''} onClick={() => setActiveTab('workout')}>🏋️ Workout Plans</li>
          <li className={activeTab === 'progress' ? 'active' : ''} onClick={() => setActiveTab('progress')}>📊 Progress</li>
          <li className={activeTab === 'notifications' ? 'active' : ''} onClick={() => setActiveTab('notifications')}>🔔 Notifications</li>
        </ul>
      </aside>

      <main className="admin-content">
        {fetchError && <div className="admin-error">{fetchError}</div>}

        {activeTab === 'members' && (
          <div className="admin-panel glass">
            <h2>Members Directory</h2>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Change Plan</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`plan-badge ${planClass(u.plan)}`}>
                          {(u.plan || 'basic').charAt(0).toUpperCase() + (u.plan || 'basic').slice(1)}
                        </span>
                      </td>
                      <td>
                        <select
                          className="plan-dropdown"
                          value={planClass(u.plan)}
                          onChange={(e) => handleChangePlan(u, e.target.value)}
                        >
                          <option value="basic">Basic</option>
                          <option value="pro">Pro</option>
                          <option value="premium">Premium</option>
                        </select>
                      </td>
                      <td>
                        <button type="button" className="btn-outline btn-sm" onClick={() => { setMemberDetail(u); setShowMemberModal(true); }}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'diet' && (
          <div className="admin-panel glass">
            <h2>Diet Plans (Pro & Premium)</h2>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Plan</th>
                    <th>Diet Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter((u) => ['pro', 'premium'].includes(planClass(u.plan)))
                    .map((u) => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td><span className={`plan-badge ${planClass(u.plan)}`}>{u.plan}</span></td>
                        <td>
                          <span className={`status-badge ${u.dietStatus === 'Assigned' ? 'assigned' : 'not-assigned'}`}>
                            {u.dietStatus}
                          </span>
                        </td>
                        <td>
                          <button type="button" className="btn-primary btn-sm" onClick={() => openDietModal(u)}>
                            Assign Diet
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'workout' && (
          <div className="admin-panel glass">
            <h2>Workout Plans</h2>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Plan</th>
                    <th>Workout Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td><span className={`plan-badge ${planClass(u.plan)}`}>{u.plan || 'basic'}</span></td>
                      <td>
                        <span className={`status-badge ${u.planStatus === 'Assigned' ? 'assigned' : 'not-assigned'}`}>
                          {u.planStatus}
                        </span>
                      </td>
                      <td>
                        <button type="button" className="btn-primary btn-sm" onClick={() => openWorkoutModal(u)}>
                          Assign Workout
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="admin-panel glass">
            <h2>Member Progress</h2>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Last Updated</th>
                    <th>Weight</th>
                    <th>Body Fat</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allProgress.map((p) => (
                    <tr key={p.userId}>
                      <td>{p.name}</td>
                      <td>{p.lastUpdated}</td>
                      <td>{p.weight}{p.weight !== '-' ? ' kg' : ''}</td>
                      <td>{p.bodyFat}{p.bodyFat !== '-' ? ' %' : ''}</td>
                      <td>
                        <button type="button" className="btn-primary btn-sm" onClick={() => openProgressModal(p)}>
                          Update Progress
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="admin-panel glass">
            <h2>Send Notification</h2>
            <form onSubmit={sendNotification} className="notif-form">
              <div className="form-group">
                <label>Send To</label>
                <select
                  value={notifForm.userId}
                  onChange={(e) => setNotifForm({ ...notifForm, userId: e.target.value })}
                  required
                >
                  <option value="all">All Members</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={notifForm.type}
                  onChange={(e) => setNotifForm({ ...notifForm, type: e.target.value })}
                  required
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                </select>
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea
                  rows={3}
                  value={notifForm.message}
                  onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                  placeholder="Type message here..."
                  required
                />
              </div>
              <button type="submit" className="btn-primary">Send Notification</button>
            </form>

            <h3 style={{ marginTop: '40px', marginBottom: '20px' }}>Sent History</h3>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Target</th>
                    <th>Type</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n) => (
                    <tr key={n.id}>
                      <td>{new Date(n.date).toLocaleString()}</td>
                      <td>{n.targetEmail === 'all' || !n.userId ? 'All Members' : n.targetEmail}</td>
                      <td><span className={`status-badge ${n.type}`}>{n.type}</span></td>
                      <td>{n.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showMemberModal && memberDetail && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="glass admin-modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h3>Member Profile</h3>
              <button type="button" className="close-btn" onClick={() => setShowMemberModal(false)}>×</button>
            </header>
            <div className="modal-body">
              <div className="detail-item"><label>Name:</label> {memberDetail.name}</div>
              <div className="detail-item"><label>Email:</label> {memberDetail.email}</div>
              <div className="detail-item">
                <label>Plan:</label>
                <span className={`plan-badge ${planClass(memberDetail.plan)}`}>{memberDetail.plan}</span>
              </div>
              <div className="detail-item"><label>Workout:</label> {memberDetail.planStatus}</div>
              <div className="detail-item"><label>Diet:</label> {memberDetail.dietStatus}</div>
            </div>
          </div>
        </div>
      )}

      {showDietModal && selectedUser && (
        <div className="modal-overlay" onClick={() => { setShowDietModal(false); setSelectedUser(null); }}>
          <div key={`diet-${selectedUser.id}`} className="glass admin-modal large" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h3 className="neon-text-gold">Assign Diet — {selectedUser.name}</h3>
              <button type="button" className="close-btn" onClick={() => { setShowDietModal(false); setSelectedUser(null); }}>×</button>
            </header>
            <div className="modal-body">
              <form onSubmit={saveDietPlan}>
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" value={dietForm.title} onChange={(e) => setDietForm({ ...dietForm, title: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Calories</label>
                    <input type="number" value={dietForm.calories} onChange={(e) => setDietForm({ ...dietForm, calories: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Protein (g)</label>
                    <input type="number" value={dietForm.protein} onChange={(e) => setDietForm({ ...dietForm, protein: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Carbs (g)</label>
                    <input type="number" value={dietForm.carbs} onChange={(e) => setDietForm({ ...dietForm, carbs: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Fat (g)</label>
                    <input type="number" value={dietForm.fat} onChange={(e) => setDietForm({ ...dietForm, fat: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Meal Plan</label>
                  <textarea rows={6} value={dietForm.mealPlan} onChange={(e) => setDietForm({ ...dietForm, mealPlan: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea rows={2} value={dietForm.notes} onChange={(e) => setDietForm({ ...dietForm, notes: e.target.value })} />
                </div>
                <button type="submit" className="btn-primary w-100" style={{ background: '#ffd700', color: '#000' }}>Save & Assign</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showWorkoutModal && selectedUser && (
        <div className="modal-overlay" onClick={() => { setShowWorkoutModal(false); setSelectedUser(null); }}>
          <div key={`workout-${selectedUser.id}`} className="glass admin-modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h3 className="neon-text-red">Assign Workout — {selectedUser.name}</h3>
              <button type="button" className="close-btn" onClick={() => { setShowWorkoutModal(false); setSelectedUser(null); }}>×</button>
            </header>
            <div className="modal-body">
              <form onSubmit={saveWorkoutPlan}>
                <div className="form-group">
                  <label>Goal</label>
                  <select value={workoutForm.goal} onChange={(e) => setWorkoutForm({ ...workoutForm, goal: e.target.value })}>
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Muscle Gain">Muscle Gain</option>
                    <option value="Strength Building">Strength Building</option>
                    <option value="General Fitness">General Fitness</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Days/Week</label>
                    <select value={workoutForm.days} onChange={(e) => setWorkoutForm({ ...workoutForm, days: Number(e.target.value) })}>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                      <option value={6}>6</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Level</label>
                    <select value={workoutForm.level} onChange={(e) => setWorkoutForm({ ...workoutForm, level: e.target.value })}>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn-primary w-100">Save Workout Plan</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showProgressModal && selectedUser && (
        <div className="modal-overlay" onClick={() => { setShowProgressModal(false); setSelectedUser(null); }}>
          <div key={`progress-${selectedUser.id}`} className="glass admin-modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h3 className="neon-text-blue">Update Progress — {selectedUser.name}</h3>
              <button type="button" className="close-btn" onClick={() => { setShowProgressModal(false); setSelectedUser(null); }}>×</button>
            </header>
            <div className="modal-body">
              <form onSubmit={saveProgress}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Weight (kg)</label>
                    <input type="number" step="0.1" value={progressForm.weight} onChange={(e) => setProgressForm({ ...progressForm, weight: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Body Fat %</label>
                    <input type="number" step="0.1" value={progressForm.bodyFat} onChange={(e) => setProgressForm({ ...progressForm, bodyFat: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Chest (cm)</label>
                    <input type="number" step="0.1" value={progressForm.chest} onChange={(e) => setProgressForm({ ...progressForm, chest: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Waist (cm)</label>
                    <input type="number" step="0.1" value={progressForm.waist} onChange={(e) => setProgressForm({ ...progressForm, waist: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Arms (cm)</label>
                    <input type="number" step="0.1" value={progressForm.arms} onChange={(e) => setProgressForm({ ...progressForm, arms: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Note</label>
                  <textarea rows={3} value={progressForm.note} onChange={(e) => setProgressForm({ ...progressForm, note: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={progressForm.date} onChange={(e) => setProgressForm({ ...progressForm, date: e.target.value })} required />
                </div>
                <button type="submit" className="btn-primary w-100">Save Progress</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
