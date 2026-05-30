import React from 'react';
import CategoryPage from './CategoryPage';

export const Insecticides = () => (
  <CategoryPage
    category="insecticides"
    title="Insecticides"
    icon="🐛"
    description="Broad-spectrum and targeted insecticide solutions to protect your crops from harmful pests at every growth stage."
  />
);

export const Weedicides = () => (
  <CategoryPage
    category="weedicides"
    title="Weedicides & Herbicides"
    icon="🌿"
    description="Pre-emergence and post-emergence weed control solutions for all major crops including wheat, rice, and cotton."
  />
);

export const Fungicides = () => (
  <CategoryPage
    category="fungicides"
    title="Fungicides"
    icon="🍄"
    description="Protect your crops from fungal diseases with our comprehensive range of contact and systemic fungicides."
  />
);

export const PGR = () => (
  <CategoryPage
    category="pgr"
    title="Plant Growth Regulators"
    icon="🌱"
    description="Scientifically formulated PGRs to regulate plant growth, improve yield potential, and enhance overall crop quality."
  />
);

export const Granules = () => (
  <CategoryPage
    category="granules"
    title="Granules & Fertilizers"
    icon="⚙️"
    description="High-quality granular fertilizers with essential macro and micronutrients for sustained plant nutrition throughout the season."
  />
);
