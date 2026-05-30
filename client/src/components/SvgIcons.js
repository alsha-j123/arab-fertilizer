import React from 'react';

/* ── Base wrappers ─────────────────────────────────────────── */
const S = ({ children, size = 24, color, fill = 'none', sw = 1.8, style, ...p }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke={color || 'currentColor'} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }} {...p}>
    {children}
  </svg>
);
const F = ({ children, size = 24, color, style, ...p }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color || 'currentColor'} stroke="none"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }} {...p}>
    {children}
  </svg>
);

/* ── Icons ─────────────────────────────────────────────────── */

// Bug / Insect
export const IconBug = (p) => <S {...p}><path d="M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13v-1a3.003 3.003 0 116 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 014-4h4a4 4 0 014 4v3c0 3.3-2.7 6-6 6z"/><path d="M12 20v-9M6.53 9C4.6 8.8 3 7.1 3 5M6 13H2M6 17l-4 1M17.47 9c1.93-.2 3.53-1.9 3.53-4M18 13h4M18 17l4 1"/></S>;

// Leaf
export const IconLeaf = (p) => <S {...p}><path d="M11 20A7 7 0 019.8 6.9C15.5 4.9 20 2 20 2s-1.2 6.6-5 11"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></S>;

// Shield
export const IconShield = (p) => <S {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></S>;

// Seedling
export const IconSeedling = (p) => <S {...p}><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 00-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></S>;

// Cog / Gear
export const IconCog = (p) => <S {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></S>;

// Tag / Label (limited offer)
export const IconTag = (p) => <S {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></S>;

// Wheat
export const IconWheat = (p) => <S {...p}><path d="M2 22l10-10"/><path d="M16 8l-2.2-2.2M6.3 17.7L4.1 15.5"/><path d="M9.4 14.6L7.2 12.4"/><path d="M12.5 11.5L10.3 9.3"/><path d="M19 5l-2.2-2.2"/><path d="M22 2l-6.6 6.6"/><path d="M18 10c-3 0-4.5-1.5-4.5-1.5S12 7 12 4"/><path d="M14 14c-3 0-4.5-1.5-4.5-1.5S8 11 8 8"/><path d="M10 18c-3 0-4.5-1.5-4.5-1.5S4 15 4 12"/></S>;

// Flask / Microscope (lab tested)
export const IconFlask = (p) => <S {...p}><path d="M9 3h6M10 9V3M14 9V3"/><path d="M6 21h12"/><path d="M7.7 15l-1.4 2.1A2 2 0 008 20h8a2 2 0 001.7-2.9L16.3 15"/><path d="M10 9a5 5 0 00-3.3 6h10.6A5 5 0 0014 9"/></S>;

// Truck
export const IconTruck = (p) => <S {...p}><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></S>;

// Badge / Check (quality)
export const IconBadgeCheck = (p) => <S {...p}><path d="M3.85 8.62a4 4 0 014.78-4.77 4 4 0 016.74 0 4 4 0 014.78 4.78 4 4 0 010 6.74 4 4 0 01-4.77 4.78 4 4 0 01-6.75 0 4 4 0 01-4.78-4.77 4 4 0 010-6.76z"/><path d="M9 12l2 2 4-4"/></S>;

// Credit Card
export const IconCreditCard = (p) => <S {...p}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></S>;

// Trophy
export const IconTrophy = (p) => <S {...p}><path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 1012 0V2z"/></S>;

// Search
export const IconSearch = (p) => <S {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></S>;

// Frown / Sad
export const IconFrown = (p) => <S {...p}><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></S>;

// Lock
export const IconLock = (p) => <S {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></S>;

// User
export const IconUser = (p) => <S {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></S>;

// Key
export const IconKey = (p) => <S {...p}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></S>;

// Package / Box
export const IconPackage = (p) => <S {...p}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></S>;

// Save / Floppy
export const IconSave = (p) => <S {...p}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></S>;

// Loader / Spinner
export const IconLoader = (p) => <S {...p}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></S>;

// Shopping Cart
export const IconCart = (p) => <S {...p}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></S>;

// Heart outline
export const IconHeart = (p) => <S {...p}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></S>;

// Heart filled
export const IconHeartFilled = (p) => <F {...p}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></F>;

// Trash
export const IconTrash = (p) => <S {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></S>;

// Check Circle
export const IconCheckCircle = (p) => <S {...p}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></S>;

// X Circle
export const IconXCircle = (p) => <S {...p}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></S>;

// Scale
export const IconScale = (p) => <S {...p}><path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></S>;

// Clipboard
export const IconClipboard = (p) => <S {...p}><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></S>;

// Alert Triangle
export const IconAlertTriangle = (p) => <S {...p}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></S>;

// Message Circle
export const IconMessageCircle = (p) => <S {...p}><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></S>;

// Star
export const IconStar = (p) => <S {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></S>;

// Edit / Pen
export const IconEdit = (p) => <S {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></S>;

// Mail
export const IconMail = (p) => <S {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></S>;

// Phone
export const IconPhone = (p) => <S {...p}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></S>;

// Map Pin
export const IconMapPin = (p) => <S {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></S>;

// Clock
export const IconClock = (p) => <S {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></S>;

// Send
export const IconSend = (p) => <S {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></S>;

// Receipt
export const IconReceipt = (p) => <S {...p}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><path d="M8 10h8M8 14h4"/></S>;

// Banknote / Cash
export const IconBanknote = (p) => <S {...p}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></S>;

// Smartphone
export const IconSmartphone = (p) => <S {...p}><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></S>;

// Target / Bullseye
export const IconTarget = (p) => <S {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></S>;

// Handshake
export const IconHandshake = (p) => <S {...p}><path d="M11 17a4 4 0 01-3.4-6.1"/><path d="M20.9 12.6A4 4 0 0017 8h-1.7"/><path d="M3 8h1.7"/><path d="M6 12a4 4 0 003.4 6.1"/><path d="M2 12h2M20 12h2"/><path d="M12 2v2M12 20v2"/><path d="M9 16l3-3 3 3"/></S>;

// Check (simple)
export const IconCheck = (p) => <S {...p}><polyline points="20 6 9 17 4 12"/></S>;

// Facebook
export const IconFacebook = (p) => <F {...p}><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></F>;

// Instagram
export const IconInstagram = (p) => <S {...p}><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></S>;

// Twitter / X
export const IconTwitter = (p) => <F {...p}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></F>;

// YouTube / Play
export const IconYoutube = (p) => <S {...p}><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none"/></S>;

// Hundred / 100%
export const IconHundred = (p) => <S {...p}><path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/><path d="M9 12l2 2 4-4"/></S>;
// Chart / Dashboard
export const IconChart = (p) => <S {...p}><path d="M18 20V10M12 20V4M6 20v-6"/></S>;

// Trending Up / Stock
export const IconTrendingUp = (p) => <S {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></S>;

// Users / Employees
export const IconUsers = (p) => <S {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></S>;

// Store / Dealers
export const IconStore = (p) => <S {...p}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></S>;

// Fuel / Gas Station
export const IconFuel = (p) => <S {...p}><path d="M3 22h12M4 9h10M14 22V4a2 2 0 012-2h2a2 2 0 012 2v18M14 7h6M10 11a1 1 0 100-2 1 1 0 000 2zM10 15a1 1 0 100-2 1 1 0 000 2z"/><path d="M3 7h1v10H3zM9 7h1v10H9z"/></S>;

// Home
export const IconHome = (p) => <S {...p}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></S>;

// Log Out
export const IconLogOut = (p) => <S {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></S>;

