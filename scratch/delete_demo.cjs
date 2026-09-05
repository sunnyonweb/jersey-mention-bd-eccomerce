const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jersey_mention_bd';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB successfully.");

  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
  const Review = mongoose.models.Review || mongoose.model('Review', new mongoose.Schema({}, { strict: false }));
  const InventoryLog = mongoose.models.InventoryLog || mongoose.model('InventoryLog', new mongoose.Schema({}, { strict: false }));
  const Notification = mongoose.models.SystemNotification || mongoose.model('SystemNotification', new mongoose.Schema({}, { strict: false }));

  console.log("Deleting demo products...");
  const delProdResult = await Product.deleteMany({ id: { $in: ['prod-1', 'prod-2'] } });
  console.log(`Deleted ${delProdResult.deletedCount} products.`);

  console.log("Deleting demo orders...");
  const delOrderResult = await Order.deleteMany({ id: { $in: ['ord-1001'] } });
  console.log(`Deleted ${delOrderResult.deletedCount} orders.`);

  console.log("Deleting demo reviews...");
  const delReviewResult = await Review.deleteMany({ id: { $in: ['rev-1', 'rev-2'] } });
  console.log(`Deleted ${delReviewResult.deletedCount} reviews.`);

  console.log("Deleting demo inventory logs...");
  const delInvResult = await InventoryLog.deleteMany({ id: { $in: ['inv-1'] } });
  console.log(`Deleted ${delInvResult.deletedCount} inventory logs.`);

  console.log("Deleting demo notifications...");
  const delNotifResult = await Notification.deleteMany({ id: { $in: ['notif-1'] } });
  console.log(`Deleted ${delNotifResult.deletedCount} notifications.`);

  await mongoose.disconnect();
  console.log("Cleanup complete!");
}

run().catch(console.error);
