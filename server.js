const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ------------------ MongoDB Connection ------------------
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dineease')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ------------------ Models ------------------

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
});
const User = mongoose.model('User', userSchema);

// Popular Order Schema
const popularOrderSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: String, required: true },
  tags: { type: [String], required: true },
  createdAt: { type: Date, default: Date.now }
});
const PopularOrder = mongoose.model('PopularOrder', popularOrderSchema);

// Form/Custom Order Schema
const orderSchema = new mongoose.Schema({
  username: String,
  orderType: String,
  city: String,
  area: String,
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// ------------------ Routes ------------------

// Signup
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ msg: "All fields are required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.json({ msg: "Account created successfully" });
  } catch (err) {
    res.status(400).json({ msg: "Username already exists" });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ msg: "All fields are required" });

  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ msg: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

  res.json({ msg: "Login successful" });
});

// Save popular order (from frontend “Order Now” buttons)
app.post('/api/orders', async (req, res) => {
  try {
    const { title, price, tags } = req.body;
    const newOrder = new PopularOrder({ title, price, tags });
    await newOrder.save();
    res.json({ success: true, message: "Order placed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
});

// Save custom order/form order
app.post("/saveOrder", async (req, res) => {
  const { username, orderType, city, area } = req.body;
  if (!username || !orderType || !city || !area) return res.status(400).json({ msg: "All fields are required!" });

  try {
    const order = new Order({ username, orderType, city, area });
    await order.save();
    res.json({ msg: "Order saved successfully!" });
  } catch (error) {
    console.error("Error saving order:", error);
    res.status(500).json({ msg: "Error saving order" });
  }
});

// ------------------ Start Server ------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
