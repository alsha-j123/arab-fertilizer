import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeUp = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

const AboutUs = () => (
  <div style={{ paddingTop: 68 }}>
    {/* Hero */}
    <div style={{
      background: 'linear-gradient(135deg, rgba(45,90,39,0.88), rgba(93,64,55,0.85)), url(https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1400) center/cover',
      padding: 'clamp(56px,8vw,90px) 20px', textAlign: 'center'
    }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ color: 'white', fontFamily: 'Playfair Display', fontSize: 'clamp(1.8rem, 5vw, 3.2rem)', marginBottom: 16 }}>About Arab Fertilizer</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'clamp(0.9rem,2vw,1.1rem)', maxWidth: 580, margin: '0 auto', lineHeight: 1.7 }}>
          Empowering Pakistan's farmers with premium agricultural inputs since 2016
        </p>
      </motion.div>
    </div>

    {/* Mission — 2-col → 1-col via CSS class */}
    <section style={{ padding: 'clamp(48px,7vw,80px) 20px', background: '#f8fdf6' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="about-mission-grid">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <div style={{ width: 60, height: 4, background: 'linear-gradient(90deg, #2D5A27, #C8A951)', borderRadius: 2, marginBottom: 16 }} />
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 20 }}>Our <span style={{ color: '#2D5A27' }}>Mission</span></h2>
            <p style={{ color: '#555', lineHeight: 1.85, fontSize: '0.95rem', marginBottom: 20 }}>
              Arab Fertilizers & Agro Chemicals was founded with a singular mission: to bring the highest quality agricultural inputs directly to Pakistan's farming communities at fair and transparent prices.
            </p>
            <p style={{ color: '#555', lineHeight: 1.85, fontSize: '0.95rem', marginBottom: 28 }}>
              We believe that every farmer — whether managing an acre or a thousand — deserves access to scientifically proven crop protection products, expert agronomic advice, and reliable service.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { value: '10+', label: 'Years of Service' },
                { value: '10K+', label: 'Happy Farmers' },
                { value: '200+', label: 'Products' },
                { value: '40+', label: 'Cities Covered' }
              ].map(stat => (
                <div key={stat.label} style={{ background: 'white', borderRadius: 10, padding: 'clamp(12px,2vw,16px)', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 'clamp(1.4rem,3vw,1.8rem)', fontWeight: 800, color: '#2D5A27', fontFamily: 'Playfair Display' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.82rem', color: '#666' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
              <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop" alt="Fields" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>

    {/* Values */}
    <section style={{ padding: 'clamp(44px,6vw,70px) 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} style={{ textAlign: 'center', marginBottom: 44 }}>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 10 }}>Our <span style={{ color: '#2D5A27' }}>Core Values</span></h2>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {[
            { icon: '🎯', title: 'Quality First', desc: 'Every product passes rigorous quality checks before reaching our customers.' },
            { icon: '🤝', title: 'Farmer Partnership', desc: 'We treat every farmer as a partner, not just a customer.' },
            { icon: '🔬', title: 'Science-Backed', desc: 'All recommendations are based on the latest agricultural research.' },
            { icon: '🌱', title: 'Sustainability', desc: 'Promoting environmentally responsible farming practices.' }
          ].map(val => (
            <motion.div key={val.title} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
              style={{ background: 'white', borderRadius: 14, padding: 'clamp(20px,3vw,28px) 20px', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
              whileHover={{ y: -5, boxShadow: '0 12px 32px rgba(45,90,39,0.12)' }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>{val.icon}</div>
              <h3 style={{ fontFamily: 'Playfair Display', fontSize: '1.02rem', marginBottom: 10 }}>{val.title}</h3>
              <p style={{ color: '#666', fontSize: '0.85rem', lineHeight: 1.7 }}>{val.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Team */}
    <section style={{ padding: 'clamp(44px,6vw,70px) 20px', background: '#f9f5f0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} style={{ textAlign: 'center', marginBottom: 44 }}>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 10 }}>
            Meet Our <span style={{ color: '#5D4037' }}>Team</span>
          </h2>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
          {[
            { name: 'Qasir Hassan', role: 'Founder & CEO', avatar: 'QH', bg: '#2D5A27' },
            { name: 'Mubashir Hassan', role: 'CFO', avatar: 'MH', bg: '#5D4037' },
            { name: 'Muhammad Javid Sarwar', role: 'Managing Director', avatar: 'JS', bg: '#C8A951' },
            { name: 'Saleem Raza', role: 'HR Manager', avatar: 'SR', bg: '#1a3a15' }
          ].map(member => (
            <motion.div key={member.name} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
              style={{ background: 'white', borderRadius: 14, padding: 'clamp(20px,3vw,28px) 18px', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: member.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.8rem', color: 'white', fontFamily: 'Playfair Display', fontWeight: 700 }}>
                {member.avatar}
              </div>
              <h3 style={{ fontFamily: 'Playfair Display', fontSize: '0.97rem', marginBottom: 6 }}>{member.name}</h3>
              <p style={{ color: '#888', fontSize: '0.82rem' }}>{member.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section style={{ background: 'linear-gradient(135deg, #2D5A27, #5D4037)', padding: 'clamp(48px,7vw,70px) 20px', textAlign: 'center' }}>
      <h2 style={{ color: '#C8A951', fontFamily: 'Playfair Display', fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', marginBottom: 16 }}>Ready to Grow with Us?</h2>
      <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 28, fontSize: 'clamp(0.9rem,2vw,1rem)', maxWidth: 520, margin: '0 auto 28px' }}>Browse our full range of agricultural products and start your journey to better yields</p>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/insecticides" style={{ background: '#C8A951', color: '#1a1a1a', padding: '13px 28px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: '0.95rem' }}>Shop Now</Link>
        <Link to="/contact" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.4)', padding: '13px 28px', borderRadius: 10, fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>Contact Us</Link>
      </div>
    </section>
  </div>
);

export default AboutUs;
