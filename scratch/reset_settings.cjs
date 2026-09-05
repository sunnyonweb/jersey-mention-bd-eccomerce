require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jersey_mention_bd';
  console.log('Connecting to:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');
  
  const SiteSettingsSchema = new mongoose.Schema({}, { strict: false });
  const SiteSettingsModel = mongoose.models.SiteSettings || mongoose.model('SiteSettings', SiteSettingsSchema, 'sitesettings');
  
  console.log('Deleting site settings document from DB to trigger re-seed...');
  const deleteResult = await SiteSettingsModel.deleteMany({});
  console.log('Deleted document count:', deleteResult.deletedCount);
  
  await mongoose.disconnect();
}

main().catch(console.error);
