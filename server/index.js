const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'ironcity_super_secret_key';
const ADMIN_EMAIL = 'manishwamu321@gmail.com';

const {
  initDatabase,
  getAllMembers,
  getMemberById,
  getMemberByEmail,
  persistMembersToJson,
  syncUserRecord,
  db,
} = require('./db');
const adminRoutes = require('./adminRoutes');

initDatabase();

app.use(cors());
app.use(express.json());

// Path to data files
const MEMBERS_FILE = path.join(__dirname, 'members.json');
const REVIEWS_FILE = path.join(__dirname, 'reviews.json');
const PROGRESS_FILE = path.join(__dirname, 'progress.json');

// Helper to load data
const loadData = (file, defaultData) => {
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file));
  }
  fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
  return defaultData;
};

let members = getAllMembers();

const refreshMembers = () => {
  members = getAllMembers();
};

let reviews = loadData(REVIEWS_FILE, [
  { id: 1, name: "Alex Johnson", rating: 5, comment: "Best gym in the city!", date: "2 days ago" },
  { id: 2, name: "Sarah Miller", rating: 4, comment: "Love the trainers here.", date: "1 week ago" }
]);

let progressData = loadData(PROGRESS_FILE, {}); // { email: [entries] }

// Helper to save data
const saveData = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

let otpStorage = {}; // { email: otp }
let resetOtpStorage = {}; // { email: { otp, expiry } }

const dashboardData = {
  plan: "Pro Membership",
  expiry: "2026-12-15",
  daysLeft: 220,
  workout: "Day 3: Chest & Triceps",
  diet: "High Protein - Bulking Phase"
};

// Nodemailer Setup
let transporter;
const useRealEmail = process.env.EMAIL_USER && process.env.EMAIL_PASS;

if (useRealEmail) {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('Real Gmail SMTP Transporter Active');
} else {
  nodemailer.createTestAccount((err, account) => {
    if (err) {
      console.error('Failed to create a testing account. ' + err.message);
      return;
    }
    console.log('Ethereal Email Test Account Created!');
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass
      }
    });
  });
}

const handleLogin = async (req, res) => {
  const { email, password } = req.body;
  const user = getMemberByEmail(email);

  if (user) {
    const isMatch = user.password.startsWith('$2')
      ? await bcrypt.compare(password, user.password)
      : password === user.password;

    if (isMatch) {
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan || 'basic',
          isAdmin: user.email === ADMIN_EMAIL,
          workoutPlan: user.workoutPlan,
        },
      });
    }
  }
  res.status(401).json({
    success: false,
    message: 'Incorrect password. Try again or click Forgot Password.',
  });
};

app.post('/api/login', handleLogin);
app.post('/api/auth/login', handleLogin);

app.post('/api/send-otp', (req, res) => {
  const { email } = req.body;
  const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStorage[email] = randomOtp;
  
  console.log(`[REGISTRATION OTP]: ${randomOtp}`); 
  
  if (transporter) {
    transporter.sendMail({
      from: '"Iron City Gym" <support@ironcity.com>',
      to: email,
      subject: "Your Registration OTP",
      text: `Your Iron City verification code is: ${randomOtp}`
    }, (err, info) => {
      if (!err && !useRealEmail) console.log("Test Mail URL: " + nodemailer.getTestMessageUrl(info));
    });
  }

  res.json({ success: true, message: "Verification code sent!" });
});

app.post('/api/register', async (req, res) => {
  const { email, password, name, otp } = req.body;
  
  if (otpStorage[email] !== otp) {
    return res.status(400).json({ success: false, message: "Invalid OTP code" });
  }

  const existingUser = members.find(m => m.email === email);
  if (existingUser) return res.status(400).json({ success: false, message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await db.run(
    'INSERT INTO users (email, password, name, plan, isAdmin) VALUES (?, ?, ?, ?, 0)',
    [email, hashedPassword, name, 'basic']
  );
  refreshMembers();
  persistMembersToJson();
  const newUser = getMemberById(result.lastInsertRowid);
  delete otpStorage[email];
  const token = jwt.sign(
    { userId: newUser.id, email: newUser.email },
    process.env.JWT_SECRET || JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({
    success: true,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      plan: newUser.plan,
      isAdmin: false,
      workoutPlan: newUser.workoutPlan,
    },
    token,
  });
});

// Forgot Password Routes
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = members.find(m => m.email === email);
  if (!user) return res.status(404).json({ success: false, message: "No account found with this email" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  resetOtpStorage[email] = { otp, expiry: Date.now() + 600000 }; // 10 mins

  console.log(`[PASSWORD RESET OTP]: ${otp}`);

  if (transporter) {
    transporter.sendMail({
      from: '"Iron City Gym" <support@ironcity.com>',
      to: email,
      subject: "Password Reset OTP",
      text: `Your password reset code is: ${otp}. Valid for 10 minutes.`
    });
  }
  res.json({ success: true, message: "OTP sent" });
});

app.post('/api/auth/verify-reset-otp', (req, res) => {
  const { email, otp } = req.body;
  const record = resetOtpStorage[email];

  if (!record || record.otp !== otp || Date.now() > record.expiry) {
    return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
  }
  res.json({ success: true });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const record = resetOtpStorage[email];

  if (!record || record.otp !== otp || Date.now() > record.expiry) {
    return res.status(400).json({ success: false, message: "Invalid or expired OTP session" });
  }

  const user = getMemberByEmail(email);
  if (user) {
    user.password = await bcrypt.hash(newPassword, 10);
    syncUserRecord(user);
    refreshMembers();
    persistMembersToJson();
    delete resetOtpStorage[email];
    return res.json({ success: true, message: "Password reset successfully" });
  }
  res.status(404).json({ success: false, message: "User not found" });
});

app.get('/api/dashboard', (req, res) => {
  res.json(dashboardData);
});

app.get('/api/reviews', (req, res) => {
  res.json(reviews);
});

app.post('/api/reviews', (req, res) => {
  const newReview = {
    id: reviews.length + 1,
    name: req.body.name || "Anonymous",
    rating: req.body.rating || 5,
    comment: req.body.comment,
    date: "Just now"
  };
  reviews.unshift(newReview);
  saveData(REVIEWS_FILE, reviews);
  res.json(newReview);
});

// Workout Generation Helper
const EXERCISES = {
  "Weight Loss": [
    { name: "Jumping Jacks", reps: "30s", cals: 50 },
    { name: "Burpees", reps: "15", cals: 80 },
    { name: "Mountain Climbers", reps: "40s", cals: 60 },
    { name: "Plank", reps: "60s", cals: 30 },
    { name: "High Knees", reps: "45s", cals: 70 }
  ],
  "Muscle Gain": [
    { name: "Bench Press", reps: "4x10", cals: 120 },
    { name: "Deadlifts", reps: "3x8", cals: 150 },
    { name: "Squats", reps: "4x12", cals: 140 },
    { name: "Pull Ups", reps: "3xMax", cals: 100 },
    { name: "Bicep Curls", reps: "3x12", cals: 60 }
  ],
  "Strength Building": [
    { name: "Overhead Press", reps: "5x5", cals: 110 },
    { name: "Barbell Rows", reps: "5x5", cals: 130 },
    { name: "Romanian Deadlift", reps: "4x8", cals: 140 },
    { name: "Pushups", reps: "4x20", cals: 80 },
    { name: "Core Hold", reps: "45s", cals: 40 }
  ],
  "General Fitness": [
    { name: "Walking Lunges", reps: "3x20", cals: 90 },
    { name: "Dumbbell Press", reps: "3x15", cals: 100 },
    { name: "Cycling", reps: "10 mins", cals: 200 },
    { name: "Stretching", reps: "5 mins", cals: 20 },
    { name: "Pushups", reps: "3x12", cals: 60 }
  ]
};

const generateWorkoutPlan = (goal, days, level) => {
  const plan = [];
  const muscleGroups = ["Chest & Triceps", "Back & Biceps", "Legs & Glutes", "Shoulders & Abs", "Arms & Core", "Full Body HIIT"];
  const difficulty = level === "Beginner" ? "Easy" : level === "Intermediate" ? "Medium" : "Hard";

  for (let i = 1; i <= 30; i++) {
    const isRestDay = (i % 7) > days || (i % 7) === 0;
    if (isRestDay) {
      plan.push({ day: i, label: "Rest Day", exercises: [], totalCals: 0, completed: true });
      continue;
    }

    const group = muscleGroups[(i - 1) % muscleGroups.length];
    const exercises = EXERCISES[goal] || EXERCISES["General Fitness"];
    
    plan.push({
      day: i,
      label: `Day ${i}: ${group}`,
      completed: false,
      totalCals: exercises.reduce((acc, ex) => acc + ex.cals, 0),
      exercises: exercises.map((ex, idx) => ({
        id: `${i}-${idx}`,
        ...ex,
        difficulty,
        done: false
      }))
    });
  }
  return plan;
};

// User Preferences & Workout Plan
app.post('/api/user/preferences', (req, res) => {
  const { email, goal, daysPerWeek, level } = req.body;
  const user = members.find(m => m.email === email);
  
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  user.preferences = { goal, daysPerWeek, level };
  user.workoutPlan = generateWorkoutPlan(goal, parseInt(daysPerWeek), level);
  user.currentDay = 1;
  user.streak = 0;

  syncUserRecord(user);
  refreshMembers();
  persistMembersToJson();
  res.json({ success: true, workoutPlan: user.workoutPlan });
});

app.get('/api/user/workout-plan', (req, res) => {
  const email = req.query.email;
  const user = members.find(m => m.email === email);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  
  res.json({
    success: true,
    workoutPlan: user.workoutPlan || null,
    currentDay: user.currentDay || 1,
    streak: user.streak || 0
  });
});

app.post('/api/user/workout/complete', (req, res) => {
  const { email, day, exerciseId } = req.body;
  const user = members.find(m => m.email === email);
  if (!user || !user.workoutPlan) return res.status(400).json({ success: false });

  const dayPlan = user.workoutPlan.find(d => d.day === day);
  if (!dayPlan) return res.status(404).json({ success: false });

  const ex = dayPlan.exercises.find(e => e.id === exerciseId);
  if (ex) ex.done = !ex.done;

  // Check if all exercises for the day are done
  const allDone = dayPlan.exercises.every(e => e.done);
  if (allDone && !dayPlan.completed) {
    dayPlan.completed = true;
    user.streak = (user.streak || 0) + 1;
    if (user.currentDay === day) user.currentDay++;
  }

  syncUserRecord(user);
  refreshMembers();
  persistMembersToJson();
  res.json({ success: true, streak: user.streak, currentDay: user.currentDay });
});

app.use('/api/admin', adminRoutes);

// Diet Plan Routes
app.get('/api/user/diet-plan', async (req, res) => {
  const email = req.query.email;
  const user = getMemberByEmail(email);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if ((user.plan || '').toLowerCase() === 'basic') {
    return res.json({ success: true, plan: null });
  }

  const diet = await db.get('SELECT * FROM diet_plans WHERE userId = ?', [user.id]);
  if (diet) {
    return res.json({ success: true, plan: diet });
  }

  res.json({ success: true, plan: null });
});

// User Progress Routes (Read Only)
app.get('/api/user/progress', (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ success: false, message: "Email required" });
  
  const user = members.find(m => m.email === email);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const userProgress = progressData[email] || [];
  res.json({ success: true, progress: userProgress });
});

app.get('/api/admin/progress/pending', (req, res) => {
  const pendingMembers = [];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  members.forEach(member => {
    // Only track standard users, not admins
    if (member.email === 'john@example.com') return; 
    
    const userProgress = progressData[member.email] || [];
    if (userProgress.length === 0) {
      pendingMembers.push({ ...member, daysAgoText: 'Never updated' });
    } else {
      const lastEntryDate = new Date(userProgress[userProgress.length - 1].date);
      if (lastEntryDate < sevenDaysAgo) {
        const daysAgo = Math.floor((new Date() - lastEntryDate) / (1000 * 60 * 60 * 24));
        pendingMembers.push({ ...member, daysAgoText: `${daysAgo} days ago` });
      }
    }
  });
  res.json({ success: true, pendingMembers });
});

// Cron Job for Weekly Email
cron.schedule('0 9 * * 1', () => {
  const pendingMembers = [];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  members.forEach(member => {
    if (member.email === 'john@example.com') return;
    const userProgress = progressData[member.email] || [];
    if (userProgress.length === 0) {
      pendingMembers.push({ name: member.name, daysAgo: 'Never' });
    } else {
      const lastEntryDate = new Date(userProgress[userProgress.length - 1].date);
      if (lastEntryDate < sevenDaysAgo) {
        const daysAgo = Math.floor((new Date() - lastEntryDate) / (1000 * 60 * 60 * 24));
        pendingMembers.push({ name: member.name, daysAgo });
      }
    }
  });

  if (pendingMembers.length > 0) {
    let body = "Hi Coach! Time to update your members' weekly progress.\nMembers pending update (not updated in 7+ days):\n";
    pendingMembers.forEach(p => {
      body += `- ${p.name} - Last updated: ${p.daysAgo} days ago\n`;
    });
    body += "Login to admin panel: http://localhost:5174/admin\n";

    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'john@example.com',
      subject: 'Weekly Progress Update Reminder',
      text: body
    }).catch(console.error);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
