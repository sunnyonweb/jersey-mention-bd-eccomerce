const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jersey_mention_bd';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB successfully.");

  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({}, { strict: false }));

  const products = await Product.find({}).lean();
  const orders = await Order.find({}).lean();

  console.log(`Total products in DB: ${products.length}`);
  products.forEach(p => {
    console.log(` - ID: ${p.id}, SKU: ${p.sku}, Name: ${p.name}`);
  });

  console.log(`Total orders in DB: ${orders.length}`);
  orders.forEach(o => {
    console.log(` - ID: ${o.id}, OrderNumber: ${o.orderNumber}, Customer: ${o.customerName}`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
