const mongoose = require('mongoose');

async function test() {
  console.log("Connecting to mongodb...");
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/jersey_mention_bd', { serverSelectionTimeoutMS: 3000 });
    console.log("Connected successfully to 127.0.0.1");
  } catch (err) {
    console.error("Failed to connect to 127.0.0.1:", err.message);
  }

  try {
    await mongoose.connect('mongodb://[::1]:27017/jersey_mention_bd', { serverSelectionTimeoutMS: 3000 });
    console.log("Connected successfully to [::1]");
  } catch (err) {
    console.error("Failed to connect to [::1]:", err.message);
  }

  try {
    await mongoose.connect('mongodb://localhost:27017/jersey_mention_bd', { serverSelectionTimeoutMS: 3000 });
    console.log("Connected successfully to localhost");
  } catch (err) {
    console.error("Failed to connect to localhost:", err.message);
  }

  process.exit(0);
}

test();
