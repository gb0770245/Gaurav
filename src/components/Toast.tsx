import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className="fixed top-20 left-1/2 bg-gray-800 text-white px-5 py-3 rounded-xl shadow-2xl z-[70] flex items-center gap-3 w-11/12 max-w-sm text-sm font-medium"
        >
          <CheckCircle className="text-green-400 w-5 h-5" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
