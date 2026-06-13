require('dotenv').config();
const express        = require('express');
const mongoose       = require('mongoose');
const cors           = require('cors');
const path           = require('path');
const http           = require('http');
const { WebSocketServer } = require('ws');

const authRoutes           = require('./routes/auth');
const categoryRoutes       = require('./routes/categories');
const productRoutes        = require('./routes/products');
const paymentRoutes        = require('./routes/paymentMethods');
const floorRoutes          = require('./routes/floors');
const tableRoutes          = require('./routes/tables');
const floorsWithTablesRoutes = require('./routes/floorsWithTables');
const couponRoutes         = require('./routes/coupons');
const promotionRoutes      = require('./routes/promotions');
const posRoutes            = require('./routes/pos');
const employeeRoutes       = require('./routes/employees');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server });

// WebSocket — broadcast category changes to all connected clients
wss.on('connection', (ws) => {
  ws.on('error', () => {});
});

app.locals.broadcast = (payload) => {
  const data = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(data);
  });
};

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/payment-methods', paymentRoutes);
app.use('/api/floors-with-tables', floorsWithTablesRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/employees', employeeRoutes);

// Serve React build — only for non-API routes
app.use(express.static(path.join(__dirname, 'public')));
app.get('*path', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(process.env.PORT, () =>
      console.log(`Server running on http://localhost:${process.env.PORT}`)
    );
  })
  .catch((err) => console.error('MongoDB connection error:', err));
