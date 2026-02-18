import express, { Request, Response } from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 3000;

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'app_user',
  password: process.env.DB_PASSWORD || 'app_password',
  database: process.env.DB_NAME || 'user_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware
app.use(cors({
  origin: ['http://localhost', 'http://localhost:80', 'http://localhost:4200'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    
    // Create tables if they don't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        age INT,
        city VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table ready');
    
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
})();

// ============ ROOT ENDPOINT ============
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'User Management API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/api/health',
      users: '/api/users',
      dashboard: '/api/dashboard'
    }
  });
});

// ============ HEALTH CHECK ============
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      success: true,
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// ============ USER ROUTES ============

// GET all users
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json({ 
      success: true, 
      data: rows,
      count: Array.isArray(rows) ? rows.length : 0
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single user
app.get('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    const users = rows as any[];
    
    if (users.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    
    res.json({ success: true, data: users[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE user
app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const { username, email, first_name, last_name, age, city } = req.body;
    
    if (!username || !email) {
      res.status(400).json({ 
        success: false, 
        message: 'Username and email are required' 
      });
      return;
    }

    const [result] = await pool.query(
      `INSERT INTO users (username, email, first_name, last_name, age, city) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, first_name || null, last_name || null, age || null, city || null]
    );
    
    const insertResult = result as any;
    const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [insertResult.insertId]);
    const users = newUser as any[];
    
    res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      data: users[0]
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ 
        success: false, 
        message: 'Username or email already exists' 
      });
      return;
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE user
app.put('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, age, city } = req.body;
    
    const [result] = await pool.query(
      `UPDATE users 
       SET first_name = ?, last_name = ?, age = ?, city = ? 
       WHERE id = ?`,
      [first_name, last_name, age, city, req.params.id]
    );
    
    const updateResult = result as any;
    
    if (updateResult.affectedRows === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    
    const [updatedUser] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    const users = updatedUser as any[];
    
    res.json({ 
      success: true, 
      message: 'User updated successfully',
      data: users[0]
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE user
app.delete('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    const deleteResult = result as any;
    
    if (deleteResult.affectedRows === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ DASHBOARD STATS ============
app.get('/api/dashboard', async (req: Request, res: Response) => {
  try {
    const [userResult] = await pool.query('SELECT COUNT(*) as count FROM users');
    const userCount = userResult as any[];
    
    res.json({
      success: true,
      data: {
        totalUsers: userCount[0]?.count || 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server is running!`);
  console.log(`📌 URL: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`👥 Users: http://localhost:${PORT}/api/users`);
  console.log('='.repeat(50));
});
