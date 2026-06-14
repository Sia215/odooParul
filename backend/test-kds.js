require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Order = require('./models/Order');
  const orders = await Order.find({ kdsStage: { $in: ['to_cook','preparing','completed'] } })
    .select('orderNumber customer kdsStage kdsItemsDone items').limit(5);
  console.log(JSON.stringify(orders.map(o => ({
    orderNumber: o.orderNumber,
    customer: o.customer,
    kdsStage: o.kdsStage,
    itemCount: o.items.length,
    kdsItemsDone: o.kdsItemsDone
  })), null, 2));
  mongoose.disconnect();
});
