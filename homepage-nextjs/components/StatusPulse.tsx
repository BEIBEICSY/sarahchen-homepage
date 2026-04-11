import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusPulseProps {
  status: string;
}

const StatusPulse = ({ status }: StatusPulseProps) => {
  const textVariants = {
    enter: { y: 10, opacity: 0 },
    center: { y: 0, opacity: 1 },
    exit: { y: -10, opacity: 0 },
  };

  return (
    <>
      <div className="flex items-center justify-center gap-2 mt-4">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 pulse-dot"
          style={{ 
            backgroundColor: 'rgba(74, 222, 128, 0.9)',
            boxShadow: '0 0 8px 2px rgba(74, 222, 128, 0.6), 0 0 16px 4px rgba(74, 222, 128, 0.3)'
          }}
        />
        <AnimatePresence mode="wait">
          <motion.span
            key={status}
            className="text-white/70 text-sm md:text-base font-light tracking-wide"
            variants={textVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {status}
          </motion.span>
        </AnimatePresence>
      </div>

      <style jsx>{`
        .pulse-dot {
          animation: pulse-opacity 2s ease-in-out infinite;
        }

        @keyframes pulse-opacity {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default StatusPulse;
