import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext();
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};

/* Get first real image URL — never return base64 */
const getImg = (p) => {
  const imgs = [...(p.images || [])];
  if (p.imageUrl) imgs.push(p.imageUrl);
  return imgs.find(i => i) || '';
};

const slim = (p) => ({
  _id:           p._id,
  name:          p.name,
  price:         Number(p.price) || 0,
  discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
  imageUrl:      getImg(p),
  category:      p.category || '',
  weight:        p.selectedVariant?.weight || p.weight || '',
  stock:         p.selectedVariant ? (p.selectedVariant.stock ?? 99) : (p.stock ?? 99),
  selectedVariant: p.selectedVariant || null,
});

const safeSet = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); }
  catch { try { localStorage.removeItem(k); } catch {} }
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('af_cart')) || []; } catch { return []; }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => { safeSet('af_cart', cartItems); }, [cartItems]);

  const addToCart = useCallback((product, quantity = 1) => {
    const s = slim(product);
    const vw = product.selectedVariant?.weight || '';
    setCartItems(prev => {
      const ex = prev.find(i => i._id === s._id && (i.selectedVariant?.weight || '') === vw);
      if (ex) return prev.map(i =>
        (i._id === s._id && (i.selectedVariant?.weight || '') === vw)
          ? { ...i, quantity: Math.min(i.quantity + quantity, s.stock) }
          : i
      );
      return [...prev, { ...s, quantity: Math.min(quantity, s.stock) }];
    });

    setIsOpen(true);
  }, []);

  const removeFromCart = useCallback((productId, variantWeight = '') => {
    setCartItems(prev => prev.filter(i => !(i._id === productId && (i.selectedVariant?.weight || '') === variantWeight)));
  }, []);

  const updateQuantity = useCallback((productId, quantity, variantWeight = '') => {
    if (quantity < 1) return;
    setCartItems(prev => prev.map(i =>
      (i._id === productId && (i.selectedVariant?.weight || '') === variantWeight) ? { ...i, quantity: Math.min(quantity, i.stock) } : i
    ));

  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem('af_cart');
  }, []);

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cartItems.reduce((s, i) => s + ((i.discountPrice || i.price) * i.quantity), 0);

  return (
    <CartContext.Provider value={{ cartItems, cartCount, cartTotal, isOpen, setIsOpen, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
export default CartContext;
