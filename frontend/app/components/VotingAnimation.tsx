'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Shuffle } from 'lucide-react';

interface Vote {
  id: number;
  stage: 'entering' | 'encrypting' | 'mixing' | 'complete';
  yOffset: number;
}

export default function VotingAnimation() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [mixnetVotes, setMixnetVotes] = useState<number[]>([]);
  const [voteCounter, setVoteCounter] = useState(0);

  useEffect(() => {
    // Generate 2-3 votes every 2.5 seconds
    const burstInterval = setInterval(() => {
      setVoteCounter((prev) => {
        const burstSize = Math.floor(Math.random() * 2) + 2; // 2-3 votes
        const newVotes: Vote[] = [];

        for (let i = 0; i < burstSize; i++) {
          newVotes.push({
            id: prev + i + 1,
            stage: 'entering',
            yOffset: (Math.random() - 0.5) * 80,
          });
        }

        setVotes((currentVotes) => [...currentVotes, ...newVotes]);
        return prev + burstSize;
      });
    }, 2500);

    return () => clearInterval(burstInterval);
  }, []);

  useEffect(() => {
    votes.forEach((vote) => {
      if (vote.stage === 'entering') {
        setTimeout(() => {
          setVotes((current) =>
            current.map((v) =>
              v.id === vote.id ? { ...v, stage: 'encrypting' } : v
            )
          );
        }, 1000);
      } else if (vote.stage === 'encrypting') {
        setTimeout(() => {
          setVotes((current) =>
            current.map((v) =>
              v.id === vote.id ? { ...v, stage: 'mixing' } : v
            )
          );
        }, 1500);
      } else if (vote.stage === 'mixing') {
        setTimeout(() => {
          setMixnetVotes((current) => {
            const newMixnet = [...current, vote.id];
            return newMixnet.sort(() => Math.random() - 0.5);
          });

          setVotes((current) =>
            current.map((v) =>
              v.id === vote.id ? { ...v, stage: 'complete' } : v
            )
          );
        }, 1000);
      } else if (vote.stage === 'complete') {
        setTimeout(() => {
          setVotes((current) => current.filter((v) => v.id !== vote.id));
        }, 500);
      }
    });
  }, [votes]);

  useEffect(() => {
    if (mixnetVotes.length > 15) {
      setMixnetVotes((current) => current.slice(-15));
    }
  }, [mixnetVotes]);

  return (
    <div className="w-full max-w-6xl mx-auto py-16 px-4">
      {/* Title */}
      <div className="text-center mb-12">
        <h2
          className="text-6xl md:text-7xl font-bold text-white mb-6"
          style={{ fontFamily: 'Handjet, monospace' }}
        >
          Truly Anonymous Voting
        </h2>
        <p className="text-white/70 text-2xl">
          Encrypted with zero-knowledge proofs and shuffled through a mixnet
        </p>
      </div>

      {/* Animation Container */}
      <div className="relative h-80 md:h-96 rounded-xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(20px)' }}>
        {/* Stage Labels */}
        <div className="absolute top-6 left-0 right-0 flex justify-between px-12 z-10">
          <div className="text-center flex-1">
            <div className="text-base md:text-lg font-bold text-white/70 uppercase tracking-wider" style={{ fontFamily: 'Handjet, monospace' }}>
              Voters
            </div>
          </div>
          <div className="text-center flex-1">
            <div className="text-base md:text-lg font-bold text-cyan-400 uppercase tracking-wider" style={{ fontFamily: 'Handjet, monospace' }}>
              Encrypted
            </div>
          </div>
          <div className="text-center flex-1">
            <div className="text-base md:text-lg font-bold text-purple-400 uppercase tracking-wider" style={{ fontFamily: 'Handjet, monospace' }}>
              Mixed
            </div>
          </div>
        </div>

        {/* Stage Dividers */}
        <div className="absolute top-20 bottom-0 left-1/3 w-px bg-gradient-to-b from-cyan-400/30 via-cyan-400/10 to-transparent" />
        <div className="absolute top-20 bottom-0 left-2/3 w-px bg-gradient-to-b from-purple-400/30 via-purple-400/10 to-transparent" />

        {/* Animated Votes */}
        <AnimatePresence>
          {votes.map((vote) => {
            const positions = {
              entering: '16.66%',
              encrypting: '50%',
              mixing: '83.33%',
            };

            return (
              <motion.div
                key={vote.id}
                initial={{
                  left: '5%',
                  top: '50%',
                  opacity: 0,
                  scale: 0.5
                }}
                animate={{
                  left: positions[vote.stage],
                  top: `calc(50% + ${vote.yOffset}px)`,
                  opacity: vote.stage === 'complete' ? 0 : 1,
                  scale: vote.stage === 'encrypting' ? [1, 1.2, 1] : 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.2,
                  transition: { duration: 0.4 }
                }}
                transition={{
                  duration: 0.9,
                  ease: [0.4, 0, 0.2, 1],
                  scale: {
                    duration: 1.5,
                    repeat: vote.stage === 'encrypting' ? Infinity : 0,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                  }
                }}
                className="absolute -translate-y-1/2 -translate-x-1/2"
              >
                <div className="relative">
                  {/* Vote Block */}
                  <div
                    className="w-16 h-16 rounded-lg"
                    style={{
                      background: vote.stage === 'encrypting'
                        ? 'rgba(0, 255, 255, 0.3)'
                        : 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(10px)',
                      border: vote.stage === 'encrypting'
                        ? '2px solid rgba(0, 255, 255, 0.6)'
                        : '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: vote.stage === 'encrypting'
                        ? '0 0 30px rgba(0, 255, 255, 0.7), 0 0 60px rgba(0, 255, 255, 0.4)'
                        : '0 4px 12px rgba(0, 0, 0, 0.2)',
                    }}
                  />

                  {/* Encryption Effect */}
                  {vote.stage === 'encrypting' && (
                    <>
                      <motion.div
                        className="absolute -top-10 left-1/2 -translate-x-1/2 text-cyan-400"
                        animate={{
                          opacity: [0, 1, 1, 0],
                          y: [15, 0, 0, -10],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                        }}
                      >
                        <Lock className="w-7 h-7" strokeWidth={2.5} />
                      </motion.div>

                      <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400"
                        style={{ width: '70px', height: '70px' }}
                        animate={{
                          scale: [1, 2.2],
                          opacity: [0.7, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeOut',
                        }}
                      />

                      <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400"
                        style={{ width: '70px', height: '70px' }}
                        animate={{
                          scale: [1, 2.2],
                          opacity: [0.7, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeOut',
                          delay: 0.75,
                        }}
                      />
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Mixnet Votes Display */}
        <div className="absolute right-12 top-24 bottom-12 flex flex-wrap content-center gap-2.5 pl-4 w-36">
          <AnimatePresence mode="popLayout">
            {mixnetVotes.map((voteId) => (
              <motion.div
                key={voteId}
                initial={{ x: -120, opacity: 0, scale: 0 }}
                animate={{
                  x: 0,
                  opacity: 0.85,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 350,
                  damping: 20,
                }}
                layout
                className="w-12 h-12 rounded-lg"
                style={{
                  background: 'rgba(147, 112, 219, 0.25)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(147, 112, 219, 0.3)',
                  boxShadow: '0 2px 8px rgba(147, 112, 219, 0.2)',
                }}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Encryption Zone */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border-2 border-cyan-400/20"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Mixnet Zone */}
        <motion.div
          className="absolute top-1/2 right-16 -translate-y-1/2 w-32 h-64 rounded-lg border-2 border-dashed border-purple-400/30"
          animate={{
            borderColor: ['rgba(147, 112, 219, 0.3)', 'rgba(147, 112, 219, 0.5)', 'rgba(147, 112, 219, 0.3)'],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
          }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Shuffle className="w-10 h-10 text-purple-400/30" />
          </div>
        </motion.div>
      </div>

      {/* Feature Descriptions */}
      <div className="grid md:grid-cols-2 gap-6 mt-12">
        <div className="rounded-xl p-6 border border-white/10" style={{ background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
              <Lock className="w-6 h-6 text-cyan-400/80" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: 'Handjet, monospace' }}>
                Zero-Knowledge Encryption
              </h3>
              <p className="text-white/60 text-base leading-relaxed">
                Your vote is encrypted using zero-knowledge proofs, ensuring privacy while remaining verifiable.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-6 border border-white/10" style={{ background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(147, 112, 219, 0.1)', backdropFilter: 'blur(10px)' }}>
              <Shuffle className="w-6 h-6 text-purple-400/80" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: 'Handjet, monospace' }}>
                Mixnet Anonymization
              </h3>
              <p className="text-white/60 text-base leading-relaxed">
                Many votes are shuffled together, breaking any link between voters and their encrypted votes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
