import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import axios from 'axios';

const ProductsContext = createContext();
export const useProducts = () => useContext(ProductsContext);

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(false);
  const cacheRef = useRef({ data: null, time: 0 });
  const CACHE_TTL = 30000; // 30 seconds

  const fetchProducts = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cacheRef.current.data && (now - cacheRef.current.time) < CACHE_TTL) {
      setProducts(cacheRef.current.data);
      return cacheRef.current.data;
    }
    setLoading(true);
    try {
      const { data } = await axios.get('/api/products');
      const p = data.products || [];
      cacheRef.current = { data: p, time: Date.now() };
      setProducts(p);
      return p;
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const invalidate = () => { cacheRef.current = { data: null, time: 0 }; };

  return (
    <ProductsContext.Provider value={{ products, loading, fetchProducts, invalidate, setProducts }}>
      {children}
    </ProductsContext.Provider>
  );
};
