const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jersey_mention_bd';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB successfully.");

  // Get collections list
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("Collections in DB:");
  collections.forEach(c => console.log(` - ${c.name}`));

  const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const users = await User.find({}).lean();
  console.log(`Total users in DB: ${users.length}`);
  users.forEach(u => {
    console.log(` - ID: ${u.id}, Name: ${u.name}, Role: ${u.role}, Email: ${u.email}, Phone: ${u.phone}`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
