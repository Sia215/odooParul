require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Order = require('./models/Order');
  
  // Find ORD-0014
  const order = await Order.findOne({ orderNumber: 'ORD-0014' });
  console.log('Before:', { kdsStage: order.kdsStage, kdsItemsDone: order.kdsItemsDone, itemCount: order.items.length });
  
  // Simulate what the PATCH route does
  order.kdsItemsDone = ['0', '1'];
  const totalItems = order.items.length;
  console.log('kdsItemsDone.length:', order.kdsItemsDone.length, 'totalItems:', totalItems);
  
  if (order.kdsItemsDone.length >= totalItems) {
    order.kdsStage = 'completed';
  }
  
  await order.save();
  console.log('After:', { kdsStage: order.kdsStage, kdsItemsDone: order.kdsItemsDone });
  mongoose.disconnect();
});
