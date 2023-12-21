const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/todoApp', { useNewUrlParser: true, useUnifiedTopology: true });

const todoSchema = new mongoose.Schema({
  title: String,
  date: Date,
  description: String,
  checked: Boolean,
  userId: String,
});

const Todo = mongoose.model('Todo', todoSchema);

// Middleware for user authentication
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) return res.status(403).json({ message: 'Forbidden' });
    req.user = user;
    next();
  });
};

// Register user
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { username, password: hashedPassword };
    const token = jwt.sign(user, 'secret_key');
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add a list
app.post('/add-list', authenticateUser, async (req, res) => {
  try {
    const { title, date, description } = req.body;
    const newTodo = new Todo({
      title,
      date,
      description,
      checked: false,
      userId: req.user.username,
    });
    await newTodo.save();
    res.json(newTodo);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's lists
app.get('/get-lists', authenticateUser, async (req, res) => {
  try {
    const lists = await Todo.find({ userId: req.user.username });
    res.json(lists);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Edit a list
app.put('/edit-list/:id', authenticateUser, async (req, res) => {
  try {
    const { title, date, description, checked } = req.body;
    const updatedTodo = await Todo.findByIdAndUpdate(
      req.params.id,
      { title, date, description, checked },
      { new: true }
    );
    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove a list
app.delete('/remove-list/:id', authenticateUser, async (req, res) => {
  try {
    await Todo.findByIdAndRemove(req.params.id);
    res.json({ message: 'List removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
