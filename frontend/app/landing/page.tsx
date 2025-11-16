'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Lock, Shuffle, Link2, Code, Shield, Users, Zap, Target, Package } from 'lucide-react';
import VotingAnimation from '../components/VotingAnimation';

export default function LandingPage() {
  return (
    <main className="min-h-screen relative">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-7xl mx-auto w-full">
          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-block mb-6"
            >
              <h1
                className="text-6xl md:text-8xl font-bold text-white"
                style={{
                  fontFamily: 'Handjet, monospace',
                }}
              >
                The People's Vote
              </h1>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-2xl md:text-4xl text-white/90 mb-6 font-light"
              style={{ fontFamily: 'Handjet, monospace' }}
            >
              Democracy Powered by Zero-Knowledge Cryptography
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-12"
            >
              Vote with complete anonymity. Your choice, encrypted with ZK proofs and shuffled through a mixnet.
              No one can trace your vote back to you, but everyone can verify the results.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-full font-bold text-lg uppercase tracking-wider transition-all duration-300"
                  style={{
                    fontFamily: 'Handjet, monospace',
                    background: 'linear-gradient(90deg, #00FFFF, #FF00FF)',
                    color: '#000',
                    boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
                  }}
                >
                  View Proposals
                </motion.button>
              </Link>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-full font-bold text-lg uppercase tracking-wider transition-all duration-300 border border-white/20"
                style={{
                  fontFamily: 'Handjet, monospace',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  color: '#fff',
                }}
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Learn More
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-white/40"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <VotingAnimation />
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-4"
              style={{ fontFamily: 'Handjet, monospace' }}
            >
              Why Choose The People's Vote?
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Built on cutting-edge cryptographic technology to ensure privacy, security, and transparency
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="rounded-xl p-8 border border-white/10"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div
                  className="w-12 h-12 rounded flex items-center justify-center mb-6"
                  style={{
                    background: `${feature.color}15`,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3
                  className="text-xl font-semibold text-white mb-4"
                  style={{ fontFamily: 'Handjet, monospace' }}
                >
                  {feature.title}
                </h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-4"
              style={{ fontFamily: 'Handjet, monospace' }}
            >
              Built on Web3
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Leveraging blockchain technology and advanced cryptography
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {technologies.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="rounded-xl p-6 border border-white/10 text-center hover:border-white/20 transition-all duration-300"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="flex justify-center mb-4">
                  <div
                    className="w-12 h-12 rounded flex items-center justify-center"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <tech.icon className="w-6 h-6 text-white/80" />
                  </div>
                </div>
                <h4
                  className="text-lg font-semibold text-white mb-2"
                  style={{ fontFamily: 'Handjet, monospace' }}
                >
                  {tech.name}
                </h4>
                <p className="text-white/50 text-sm">{tech.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-4xl md:text-6xl font-bold text-white mb-6"
              style={{ fontFamily: 'Handjet, monospace' }}
            >
              Ready to Vote Anonymously?
            </h2>
            <p className="text-xl text-white/60 mb-12">
              Join the future of democratic decision-making with complete privacy and transparency
            </p>
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-5 rounded-full font-bold text-xl uppercase tracking-wider transition-all duration-300"
                style={{
                  fontFamily: 'Handjet, monospace',
                  background: 'linear-gradient(90deg, #00FFFF, #FF00FF)',
                  color: '#000',
                  boxShadow: '0 0 30px rgba(0, 255, 255, 0.4)',
                }}
              >
                Get Started
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-white/40">
          <p style={{ fontFamily: 'Handjet, monospace' }}>
            © 2024 The People's Vote. Built with privacy and transparency.
          </p>
        </div>
      </footer>
    </main>
  );
}

const features = [
  {
    title: 'Zero-Knowledge Proofs',
    description: 'Your vote is encrypted using advanced ZK cryptography. Prove you voted without revealing your choice.',
    icon: Lock,
    color: '#00FFFF',
  },
  {
    title: 'Mixnet Anonymization',
    description: 'Votes are shuffled through a mixnet, completely breaking the link between voter and vote.',
    icon: Shuffle,
    color: '#FF00FF',
  },
  {
    title: 'Blockchain Verified',
    description: 'All votes are recorded on-chain, ensuring immutability and transparent verification.',
    icon: Link2,
    color: '#FFD700',
  },
  {
    title: 'Open Source',
    description: 'Fully transparent and auditable code. Trust through verification, not authority.',
    icon: Code,
    color: '#7B68EE',
  },
  {
    title: 'Decentralized',
    description: 'No central authority can manipulate or censor votes. True democratic governance.',
    icon: Users,
    color: '#FF1493',
  },
  {
    title: 'Privacy First',
    description: 'Your identity and vote are completely separate. Vote freely without fear of retaliation.',
    icon: Shield,
    color: '#00CED1',
  },
];

const technologies = [
  {
    name: 'Zero-Knowledge',
    description: 'Advanced cryptography',
    icon: Lock,
  },
  {
    name: 'Polkadot',
    description: 'Blockchain network',
    icon: Zap,
  },
  {
    name: 'Noir',
    description: 'ZK circuit language',
    icon: Target,
  },
  {
    name: 'IPFS',
    description: 'Decentralized storage',
    icon: Package,
  },
];
