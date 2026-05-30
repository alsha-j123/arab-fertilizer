import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const WishlistContext = createContext();
export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
};

const getImg = (p) => {
  const imgs = [...(p.images || [])];
  if (p.imageUrl) imgs.push(p.imageUrl);
  return imgs.find(i => i) || '';
};

const slim = (p) => ({
  _id: p._id, name: p.name,
  price: Number(p.price) || 0,
  discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
  imageUrl: getImg(p),
  category: p.category || '',
  weight: p.weight || '',
  stock: p.stock || 0,
  avgRating: p.avgRating || 0,
  numReviews: p.numReviews || 0,
});

const safeSet = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); }
  catch { try { localStorage.removeItem(k); } catch {} }
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('af_wishlist')) || []; } catch { return []; }
  });

  useEffect(() => { safeSet('af_wishlist', wishlistItems); }, [wishlistItems]);

  const addToWishlist    = useCallback((p) => setWishlistItems(prev => prev.find(i => i._id === p._id) ? prev : [...prev, slim(p)]), []);
  const removeFromWishlist = useCallback((id) => setWishlistItems(prev => prev.filter(i => i._id !== id)), []);
  const isInWishlist     = useCallback((id) => wishlistItems.some(i => i._id === id), [wishlistItems]);
  const toggleWishlist   = useCallback((p) => isInWishlist(p._id) ? removeFromWishlist(p._id) : addToWishlist(p), [isInWishlist, addToWishlist, removeFromWishlist]);

  return (
    <WishlistContext.Provider value={{ wishlistItems, wishlistCount: wishlistItems.length, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
export default WishlistContext;
