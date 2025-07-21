require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schemas
const UserSchema = new mongoose.Schema({
  email: String,
  createdAt: { type: Date, default: Date.now }
});
const VisitSchema = new mongoose.Schema({ count: { type: Number, default: 0 } });
const NewsSchema = new mongoose.Schema({
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Visit = mongoose.model('Visit', VisitSchema);
const News = mongoose.model('News', NewsSchema);

// Middleware for admin auth
function adminAuth(req, res, next) {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// API Endpoints
// 1. User signup (simulate beta/waitlist join)
app.post('/api/users', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const user = new User({ email });
  await user.save();
  res.json({ success: true });
});

// 2. Get all users (admin only)
app.post('/api/admin/users', adminAuth, async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
});

// 3. Visit count (increment on site visit)
app.post('/api/visit', async (req, res) => {
  let visit = await Visit.findOne();
  if (!visit) visit = new Visit({ count: 1 });
  else visit.count += 1;
  await visit.save();
  res.json({ count: visit.count });
});
// 4. Get visit count (admin only)
app.post('/api/admin/visits', adminAuth, async (req, res) => {
  let visit = await Visit.findOne();
  res.json({ count: visit ? visit.count : 0 });
});
// 5. Post news (admin only)
app.post('/api/admin/news', adminAuth, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  const news = new News({ title, content });
  await news.save();
  res.json({ success: true });
});
// 6. Get all news
app.get('/api/news', async (req, res) => {
  const news = await News.find().sort({ createdAt: -1 });
  res.json(news);
});
// 7. Admin login (returns success if password correct)
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) return res.json({ success: true });
  res.status(401).json({ error: 'Unauthorized' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 