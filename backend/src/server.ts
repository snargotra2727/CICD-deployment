import express, { Request, Response } from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 3000;

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'user_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');

    // Create users table if it doesn't exist
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

    // Insert sample data if table is empty
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM users');
    const countResult = rows as any[];
    if (countResult[0].count === 0) {
      await connection.query(`
        INSERT INTO users (username, email, first_name, last_name, age, city) VALUES
        ('john_doe', 'john@example.com', 'John', 'Doe', 28, 'New York'),
        ('jane_smith', 'jane@example.com', 'Jane', 'Smith', 32, 'Los Angeles'),
        ('bob_wilson', 'bob@example.com', 'Bob', 'Wilson', 24, 'Chicago')
      `);
      console.log('✅ Sample data inserted');
    }

    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
})();

// ============ API ROUTES ============

// Health check
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS solution');
    const result = rows as any[];
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

// Get all users
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    const users = rows as any[];
    res.json({ 
      success: true, 
      data: users,
      count: users.length
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create user
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
    const [newUserRows] = await pool.query('SELECT * FROM users WHERE id = ?', [insertResult.insertId]);
    const newUser = newUserRows as any[];
    
    res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      data: newUser[0]
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

// Delete user
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

// Dashboard stats
app.get('/api/dashboard', async (req: Request, res: Response) => {
  try {
    const [totalRows] = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalResult = totalRows as any[];
    
    const [ageRows] = await pool.query('SELECT AVG(age) as avg FROM users WHERE age IS NOT NULL');
    const ageResult = ageRows as any[];
    
    const [cityRows] = await pool.query(`
      SELECT city, COUNT(*) as count 
      FROM users 
      WHERE city IS NOT NULL 
      GROUP BY city 
      ORDER BY count DESC 
      LIMIT 3
    `);
    const cityResult = cityRows as any[];
    
    const [todayRows] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE DATE(created_at) = CURDATE()
    `);
    const todayResult = todayRows as any[];
    
    res.json({
      success: true,
      data: {
        totalUsers: totalResult[0].count,
        averageAge: Math.round(ageResult[0]?.avg || 0),
        topCities: cityResult,
        newToday: todayResult[0].count,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Root endpoint
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

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server is running in DEVELOPMENT mode!`);
  console.log(`📌 URL: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`👥 Users: http://localhost:${PORT}/api/users`);
  console.log('='.repeat(50));
});
