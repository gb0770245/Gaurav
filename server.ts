import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { INITIAL_USERS, INITIAL_ORDERS, RESTAURANTS, INITIAL_RIDERS, COUPONS } from './src/data';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// In-memory data store
let users = [...INITIAL_USERS];
let orders = [...INITIAL_ORDERS];
let restaurants = [...RESTAURANTS];
let riders = [...INITIAL_RIDERS];
let coupons = [...COUPONS];
let banners = [
  { id: '1', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', active: true },
  { id: '2', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80', active: true }
];
let supportTickets = [
    { id: 'T-101', user: 'Rahul Kumar', issue: 'Order not delivered', status: 'Open', date: '2023-10-25', description: 'I ordered 2 hours ago and still not received.' },
    { id: 'T-102', user: 'Amit Singh', issue: 'Refund request', status: 'Resolved', date: '2023-10-24', description: 'Food was cold, need refund.' }
];

// Broadcast function
const broadcast = (type: string, payload: any) => {
  const message = JSON.stringify({ type, payload });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// API Routes

// Get all initial data
app.get('/api/data', (req, res) => {
  res.json({
    users,
    orders,
    restaurants,
    riders,
    coupons,
    banners,
    supportTickets
  });
});

// --- ORDERS ---
app.post('/api/orders', (req, res) => {
  const newOrder = req.body;
  orders = [newOrder, ...orders];
  broadcast('ORDER_CREATED', newOrder);
  res.status(201).json(newOrder);
});

app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });
  orders[index] = { ...orders[index], ...updates };
  const updatedOrder = orders[index];
  broadcast('ORDER_UPDATED', updatedOrder);
  res.json(updatedOrder);
});

// --- USERS ---
app.post('/api/users', (req, res) => {
  const newUser = req.body;
  users = [...users, newUser];
  broadcast('USER_CREATED', newUser);
  res.status(201).json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const index = users.findIndex(u => u.id === Number(id));
  if (index === -1) return res.status(404).json({ error: 'User not found' });
  users[index] = { ...users[index], ...updates };
  const updatedUser = users[index];
  broadcast('USER_UPDATED', updatedUser);
  res.json(updatedUser);
});

// --- RIDERS ---
app.post('/api/riders', (req, res) => {
  const newRider = req.body;
  riders = [...riders, newRider];
  broadcast('RIDER_CREATED', newRider);
  res.status(201).json(newRider);
});

app.put('/api/riders/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const index = riders.findIndex(r => r.id === Number(id));
  if (index === -1) return res.status(404).json({ error: 'Rider not found' });
  riders[index] = { ...riders[index], ...updates };
  const updatedRider = riders[index];
  broadcast('RIDER_UPDATED', updatedRider);
  res.json(updatedRider);
});

// --- RESTAURANTS ---
app.post('/api/restaurants', (req, res) => {
  const newRestaurant = req.body;
  restaurants = [...restaurants, newRestaurant];
  broadcast('RESTAURANT_CREATED', newRestaurant);
  res.status(201).json(newRestaurant);
});

app.put('/api/restaurants/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const index = restaurants.findIndex(r => r.id === Number(id));
  if (index === -1) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }
  restaurants[index] = { ...restaurants[index], ...updates };
  const updatedRestaurant = restaurants[index];
  broadcast('RESTAURANT_UPDATED', updatedRestaurant);
  res.json(updatedRestaurant);
});

app.delete('/api/restaurants/:id', (req, res) => {
  const { id } = req.params;
  restaurants = restaurants.filter(r => r.id !== Number(id));
  broadcast('RESTAURANT_DELETED', Number(id));
  res.json({ success: true });
});

// --- COUPONS ---
app.post('/api/coupons', (req, res) => {
  const newCoupon = req.body;
  coupons = [...coupons, newCoupon];
  broadcast('COUPON_CREATED', newCoupon);
  res.status(201).json(newCoupon);
});

app.delete('/api/coupons/:code', (req, res) => {
  const { code } = req.params;
  coupons = coupons.filter(c => c.code !== code);
  broadcast('COUPON_DELETED', code);
  res.json({ success: true });
});

app.put('/api/coupons/:code', (req, res) => {
  const { code } = req.params;
  const updates = req.body;
  const index = coupons.findIndex(c => c.code === code);
  if (index === -1) return res.status(404).json({ error: 'Coupon not found' });
  coupons[index] = { ...coupons[index], ...updates };
  const updatedCoupon = coupons[index];
  broadcast('COUPON_UPDATED', updatedCoupon);
  res.json(updatedCoupon);
});

// --- BANNERS ---
app.post('/api/banners', (req, res) => {
  const newBanner = req.body;
  banners = [...banners, newBanner];
  broadcast('BANNER_CREATED', newBanner);
  res.status(201).json(newBanner);
});

app.delete('/api/banners/:id', (req, res) => {
  const { id } = req.params;
  banners = banners.filter(b => b.id !== id);
  broadcast('BANNER_DELETED', id);
  res.json({ success: true });
});

app.put('/api/banners/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const index = banners.findIndex(b => b.id === id);
  if (index === -1) return res.status(404).json({ error: 'Banner not found' });
  banners[index] = { ...banners[index], ...updates };
  broadcast('BANNER_UPDATED', banners[index]);
  res.json({ success: true, banner: banners[index] });
});

// --- NOTIFICATIONS ---
app.post('/api/notifications', (req, res) => {
  const notification = req.body;
  broadcast('NOTIFICATION_SENT', notification);
  res.json({ success: true });
});


// Vite integration
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
