const mongoose = require('mongoose');
const dns = require('dns');

// Fix for Windows / ISP DNS resolvers failing on MongoDB Atlas SRV records (_mongodb._tcp)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}



const connectDB = async () => {
  const uri = process.env.MONGO_URI || DIRECT_REPLICA_FALLBACK;
  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected Successfully ✅ (${conn.connection.host})`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    if (error.message.includes('querySrv') || error.message.includes('ECONNREFUSED')) {
      try {
        console.log('Attempting connection with direct replica set fallback...');
        const conn = await mongoose.connect(DIRECT_REPLICA_FALLBACK);
        console.log(`MongoDB Connected Successfully via direct fallback ✅ (${conn.connection.host})`);
      } catch (fallbackError) {
        console.error(`Fallback connection error: ${fallbackError.message}`);
      }
    }
  }
};

module.exports = connectDB;
