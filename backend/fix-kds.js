require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Order = require('./models/Order');
  // Fix all orders where all items done but stage not completed
  const orders = await Order.find({ kdsStage: { $in: ['to_cook', 'preparing'] } });
  let fixed = 0;
  for (const o of orders) {
    if (o.items.length > 0 && o.kdsItemsDone.length >= o.items.length) {
      o.kdsStage = 'completed';
      await o.save();
      fixed++;
      console.log('Fixed:', o.orderNumber);
    }
  }
  // Also archive completed orders older than today
  const today = new Date(); today.setHours(0,0,0,0);
  const old = await Order.updateMany(
    { kdsStage: 'completed', kdsSentAt: { $lt: today } },
    { kdsStage: 'archived' }
  );
  console.log('Total fixed:', fixed, '| Archived old:', old.modifiedCount);
  mongoose.disconnect();
});
