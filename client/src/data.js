import React from 'react';
import { IconBug, IconLeaf, IconShield, IconSeedling, IconCog } from './components/SvgIcons';

/* ── Categories (kept — these are UI structure, not product data) ── */
export const categories = [
  { id: 'insecticides', label: 'Insecticides', icon: <IconBug size={22} />, desc: 'Effective pest control solutions for healthy crops' },
  { id: 'weedicides', label: 'Weedicides', icon: <IconLeaf size={22} />, desc: 'Weed management for maximum yield' },
  { id: 'fungicides', label: 'Fungicides', icon: <IconShield size={22} />, desc: 'Protect crops from fungal diseases' },
  { id: 'pgr',        label: 'PGR',        icon: <IconSeedling size={22} />, desc: 'Plant Growth Regulators for optimum growth' },
  { id: 'granules',   label: 'Granules',   icon: <IconCog size={22} />, desc: 'Slow-release granular fertilizers' }
];

/* ── No dummy products — all data comes from admin panel ── */
export const sampleProducts = [];

/* ── Live helpers — reads from admin localStorage ── */
const KEY = 'af_products';

export const getLiveProducts = () => {
  try {
    const s = localStorage.getItem(KEY);
    if (s) {
      const p = JSON.parse(s);
      if (Array.isArray(p)) return p;
    }
  } catch {}
  return [];
};

export const getLiveProductsByCategory = category =>
  getLiveProducts().filter(p => p.category === category);

export const getLiveFeaturedProducts = () =>
  getLiveProducts().filter(p => p.featured);

export const getLiveProductById = id =>
  getLiveProducts().find(p => p._id === id);

/* ── Legacy aliases (kept so nothing breaks) ── */
export const getProductsByCategory = getLiveProductsByCategory;
export const getFeaturedProducts   = getLiveFeaturedProducts;
export const getProductById        = getLiveProductById;
