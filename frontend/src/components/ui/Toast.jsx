// src/components/ui/Toast.jsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X, AlertCircle, Info } from 'lucide-react';

const Toast = ({ 
  isOpen, 
  onClose, 
  message, 
  type = 'success', 
  duration = 4000,
  position = 'bottom-right'
}) => {
  const positions = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };

  const styles = {
    success: 'bg-[#00FFA3]/10 border-[#00FFA3]/20 text-[#00FFA3]',
    error: 'bg-[#FF4D6D]/10 border-[#FF4D6D]/20 text-[#FF4D6D]',
    warning: 'bg-[#FF9F5B]/10 border-[#FF9F5B]/20 text-[#FF9F5B]',
    info: 'bg-[#0082FB]/10 border-[#0082FB]/20 text-[#0082FB]'
  };

  const Icon = icons[type];

  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.5 }}
          className={`fixed z-50 ${positions[position]} mx-4`}
        >
          <div className={`flex items-center gap-3 p-4 rounded-xl border shadow-2xl max-w-sm ${styles[type]}`}>
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium flex-1">{message}</span>
            <button
              onClick={onClose}
              className="ml-2 p-1 rounded-lg hover:bg-white/10 transition-colors duration-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;