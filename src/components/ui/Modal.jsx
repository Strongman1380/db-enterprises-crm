import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, width = 'max-w-xl' }) {
  return (
    <AnimatePresence>
      {/* AnimatePresence must have keyed motion.div elements as direct children —
          NOT a Fragment — so it can properly detect and animate removal. */}

      {open && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 bg-charcoal/30 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {open && (
        <motion.div
          key="modal-container"
          initial={{ opacity: 0, scale: 0.97, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 overflow-y-auto"
          onClick={onClose}
        >
          <div className="flex items-center justify-center min-h-full p-4">
            <div
              className={`relative w-full ${width} my-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-charcoal">{title}</h2>
                  <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-ivory-300 transition-colors"
                  >
                    <X size={14} className="text-charcoal-muted" />
                  </button>
                </div>
                {children}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
