const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jersey_mention_bd';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB successfully.");

  const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  // Find all customers
  const customers = await User.find({ role: 'customer' }).lean();
  const customerIds = customers.map(c => c.id);
  console.log(`Found ${customerIds.length} normal customers to delete.`);

  if (customerIds.length > 0) {
    console.log("Deleting customer accounts...");
    const delUserResult = await User.deleteMany({ role: 'customer' });
    console.log(`Deleted ${delUserResult.deletedCount} user accounts.`);

    // Delete customer notifications in notifications and systemnotifications collections
    // Check if models exist or use raw collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const hasNotifications = collections.some(c => c.name === 'notifications');
    const hasSystemNotifications = collections.some(c => c.name === 'systemnotifications');

    if (hasNotifications) {
      const delNotif = await mongoose.connection.db.collection('notifications').deleteMany({ userId: { $in: customerIds } });
      console.log(`Deleted ${delNotif.deletedCount} items from notifications collection.`);
    }

    if (hasSystemNotifications) {
      const delSysNotif = await mongoose.connection.db.collection('systemnotifications').deleteMany({ userId: { $in: customerIds } });
      console.log(`Deleted ${delSysNotif.deletedCount} items from systemnotifications collection.`);
    }
  }

  // Double check remaining users
  const remainingUsers = await User.find({}).lean();
  console.log(`Remaining users in DB: ${remainingUsers.length}`);
  remainingUsers.forEach(u => {
    console.log(` - ID: ${u.id}, Name: ${u.name}, Role: ${u.role}, Email: ${u.email}`);
  });

  await mongoose.disconnect();
  console.log("Customer cleanup complete!");
}

run().catch(console.error);
