const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const profilesRouter = require('./routes/profiles');
const authRouter = require('./routes/auth');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/profiles', authenticateToken, profilesRouter);

app.use(express.static(path.join(__dirname, '..')));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
