require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { uploadImage } = require('../utils/cloudinary');

const migrateImages = async () => {
  try {
    let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/arab-fertilizer';
    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
    
    const products = await Product.find({ isActive: true });
    console.log(`Found ${products.length} products to check...`);
    
    let totalMigrated = 0;
    
    for (const product of products) {
      let needsUpdate = false;
      const newImages = [];
      
      for (const img of product.images) {
        if (img && img.startsWith('data:image')) {
          console.log(`🚀 Migrating base64 image for product: ${product.name}`);
          try {
            const url = await uploadImage(img);
            newImages.push(url);
            needsUpdate = true;
            totalMigrated++;
          } catch (e) {
            console.error(`❌ Failed to migrate image for ${product.name}:`, e.message);
            newImages.push(img); // keep base64 as fallback
          }
        } else {
          newImages.push(img); // already a URL
        }
      }
      
      if (needsUpdate) {
        product.images = newImages;
        await product.save();
        console.log(`✅ Updated ${product.name}`);
      }
    }

    console.log(`\n🎉 Migration finished! Total images moved to Cloudinary: ${totalMigrated}`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
};

migrateImages();
