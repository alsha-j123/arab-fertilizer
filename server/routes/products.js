const express  = require('express');
const router   = express.Router();
const Product  = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');
const { uploadImage } = require('../utils/cloudinary');

/* ── In-memory cache for product lists ──
   Bug fix #13: This cache is per-process. Under PM2 cluster mode, each worker
   has its own isolated copy — clearing the cache on one worker does NOT
   propagate to other workers. For multi-worker deployments use Redis or a
   shared cache (e.g. ioredis + keyv). For single-process deployments (default)
   this is safe and effective. The TTL is kept short (15s) to limit stale data
   window in clustered environments without a shared cache. */
const cache = {
  data: {},
  set(k, v, ttl = 15000) { this.data[k] = { v, exp: Date.now() + ttl }; },
  get(k) { const e = this.data[k]; if (!e) return null; if (Date.now() > e.exp) { delete this.data[k]; return null; } return e.v; },
  clear() { this.data = {}; }
};

/* ── admin key check ── */
const adminKey = (req, res, next) => {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  // Bug fix #4: No hardcoded fallback — ADMIN_SECRET must be set in environment
  if (process.env.ADMIN_SECRET && key === process.env.ADMIN_SECRET) return next();
  protect(req, res, () => {
    if (req.user?.role === 'admin') return next();
    return res.status(403).json({ success: false, message: 'Admin access required' });
  });
};

/* Upload base64 to Cloudinary, keep http URLs as-is, keep base64 directly if cloudinary fails */
const processImages = async (images) => {
  if (!images || images.length === 0) return [];
  const results = [];
  for (const img of images) {
    if (!img) continue;
    if (img.startsWith('http') || img.startsWith('/')) {
      results.push(img); // already a URL — keep it
    } else if (img.startsWith('data:image')) {
      try {
        const url = await uploadImage(img);
        results.push(url);
        console.log('✅ Uploaded to Cloudinary:', url.substring(0, 80));
      } catch (e) {
        console.error('❌ Cloudinary upload failed, saving base64 to DB directly:', e.message);
        results.push(img); // Save base64 directly to database as fallback
      }
    }
    // Skip anything else (empty strings, etc)
  }
  return results;
};

/* ── GET /api/products ── */
router.get('/', async (req, res) => {
  try {
    const { category, search, featured, page = 1, limit = 50 } = req.query;

    /* Build cache key from query params */
    const cacheKey = `products:${category||''}:${search||''}:${featured||''}:${page}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return res.json(cached);
    }

    const query = { isActive: true };
    if (category) query.category = category;
    if (featured === 'true') query.featured = true;
    if (search) query.name = { $regex: search, $options: 'i' };

    const total = await Product.countDocuments(query);

    // Optimize: Exclude heavy fields for list view
    const products = await Product.find(query)
      .select('name category price discountPrice images stock featured avgRating numReviews weight season npkRatio')
      .lean()
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort('-createdAt');

    // Further optimize: Only send the first image to keep payload small if using base64
    const optimizedProducts = products.map(p => ({
      ...p,
      images: p.images && p.images.length > 0 ? [p.images[0]] : []
    }));

    const result = { success: true, products: optimizedProducts, total };
    cache.set(cacheKey, result, 30000); /* cache for 30s */
    res.set('X-Cache', 'MISS');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── GET /api/products/:id ── */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Filter reviews: public only sees approved, admin/owner sees all? 
    // To keep it simple for now: only show approved reviews to public.
    const productObj = product.toObject();
    productObj.reviews = productObj.reviews.filter(r => r.isApproved);
    
    res.json({ success: true, product: productObj });
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── POST /api/products ── */
router.post('/', adminKey, async (req, res) => {
  try {
    const { name, category, price, discountPrice, stock, npkRatio, weight,
            season, description, images, featured, features, usage, precautions, variants } = req.body;
    if (!name || !category || price === undefined || stock === undefined)
      return res.status(400).json({ success: false, message: 'Name, category, price and stock are required' });

    const imageUrls = await processImages(images);

    const product = await Product.create({
      name, category,
      price:         Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      stock:         Number(stock),
      npkRatio:      npkRatio    || 'N/A',
      weight:        weight      || 'N/A',
      season:        season      || 'All Season',
      description:   description || '',
      images:        imageUrls,
      featured:      featured    || false,
      features:      features    || [],
      usage:         usage       || [],
      precautions:   precautions || [],
      variants:      variants    || [],
    });
    cache.clear(); /* invalidate cache on write */
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── PUT /api/products/:id ── */
router.put('/:id', adminKey, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.price !== undefined)         updates.price         = Number(updates.price);
    if (updates.discountPrice !== undefined) updates.discountPrice = updates.discountPrice ? Number(updates.discountPrice) : null;
    if (updates.stock !== undefined)         updates.stock         = Number(updates.stock);

    // Process images — upload base64 to Cloudinary, keep existing URLs
    if (updates.images && updates.images.length > 0) {
      updates.images = await processImages(updates.images);
    }

    // Bug fix #7: runValidators: true — ensures schema validation runs on updates
    // (previously false, allowing negative prices and empty required fields to be saved)
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).lean();
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    cache.clear(); /* invalidate cache on write */
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── DELETE /api/products/:id ── */
router.delete('/:id', adminKey, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    cache.clear(); /* invalidate cache on write */
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── POST /api/products/:id/review ── */
router.post('/:id/review', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) return res.status(400).json({ success: false, message: 'Rating and comment required' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const already = product.reviews.find(r => r.user.toString() === req.user._id.toString());
    if (already) return res.status(400).json({ success: false, message: 'You already reviewed this product' });
    product.reviews.push({ user: req.user._id, name: req.user.name, rating: Number(rating), comment, isApproved: false });
    // Don't updateRating yet because it's not approved
    await product.save();
    res.status(201).json({ success: true, message: 'Review submitted and pending approval', product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Expose cache invalidation helper
router.clearProductCache = () => {
  cache.clear();
  console.log('🧹 Product Cache Cleared!');
};

module.exports = router;

