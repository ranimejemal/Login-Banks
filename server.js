import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'secure_bank',
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const initializeDatabase = async () => {
  const connection = await pool.getConnection();

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        account_number VARCHAR(50) UNIQUE NOT NULL,
        balance DECIMAL(15, 2) DEFAULT 5000.00,
        account_type VARCHAR(100) DEFAULT 'Compte Courant',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        account_id INT NOT NULL,
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        type ENUM('debit', 'credit') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      )
    `);

    console.log('Database tables initialized');
  } finally {
    connection.release();
  }
};

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.post('/api/auth/signup', async (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const connection = await pool.getConnection();

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.query(
      'INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)',
      [email, hashedPassword, fullName]
    );

    const [[user]] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    const accountNumber = `FR${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    await connection.query(
      'INSERT INTO accounts (user_id, account_number) VALUES (?, ?)',
      [user.id, accountNumber]
    );

    const token = jwt.sign({ userId: user.id, email }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({ token, user: { id: user.id, email, fullName } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  } finally {
    connection.release();
  }
});

app.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  const connection = await pool.getConnection();

  try {
    const [[user]] = await connection.query(
      'SELECT id, email, password, full_name FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  } finally {
    connection.release();
  }
});

app.get('/api/user/profile', verifyToken, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const [[user]] = await connection.query(
      'SELECT id, email, full_name FROM users WHERE id = ?',
      [req.userId]
    );

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  } finally {
    connection.release();
  }
});

app.get('/api/accounts', verifyToken, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const [accounts] = await connection.query(
      'SELECT id, account_number, balance, account_type, created_at FROM accounts WHERE user_id = ?',
      [req.userId]
    );

    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  } finally {
    connection.release();
  }
});

app.get('/api/transactions/:accountId', verifyToken, async (req, res) => {
  const { accountId } = req.params;
  const connection = await pool.getConnection();

  try {
    const [[account]] = await connection.query(
      'SELECT user_id FROM accounts WHERE id = ?',
      [accountId]
    );

    if (!account || account.user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [transactions] = await connection.query(
      'SELECT id, description, amount, type, created_at FROM transactions WHERE account_id = ? ORDER BY created_at DESC LIMIT 10',
      [accountId]
    );

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  } finally {
    connection.release();
  }
});

app.listen(PORT, async () => {
  await initializeDatabase();
  console.log(`Server running on http://localhost:${PORT}`);
});
