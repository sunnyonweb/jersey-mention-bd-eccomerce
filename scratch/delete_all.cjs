const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jersey_mention_bd';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB successfully.");

  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({}, { strict: false }));

  console.log("Deleting ALL products from MongoDB...");
  const delProdResult = await Product.deleteMany({});
  console.log(`Deleted ${delProdResult.deletedCount} products.`);

  console.log("Deleting ALL orders from MongoDB...");
  const delOrderResult = await Order.deleteMany({});
  console.log(`Deleted ${delOrderResult.deletedCount} orders.`);

  // Double check counts
  const prodCount = await Product.countDocuments();
  const orderCount = await Order.countDocuments();
  console.log(`Current product count: ${prodCount}`);
  console.log(`Current order count: ${orderCount}`);

  await mongoose.disconnect();
  console.log("Cleanup complete!");
}

run().catch(console.error);
