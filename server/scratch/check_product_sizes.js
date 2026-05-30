require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const checkSizes = async () => {
  try {
    let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/arab-fertilizer';
    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
    
    const categories = ['insecticides', 'weedicides', 'fungicides', 'pgr', 'granules'];
    
    for (const cat of categories) {
      const products = await Product.find({ category: cat, isActive: true }).lean();
      let totalSize = 0;
      let base64Count = 0;
      
      products.forEach(p => {
        const json = JSON.stringify(p);
        totalSize += json.length;
        p.images.forEach(img => {
          if (img.startsWith('data:image')) base64Count++;
        });
      });
      
      console.log(`Category: ${cat}`);
      console.log(`- Product count: ${products.length}`);
      console.log(`- Total JSON size: ${(totalSize / 1024).toFixed(2)} KB`);
      console.log(`- Base64 images: ${base64Count}`);
      console.log('---');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

checkSizes();
