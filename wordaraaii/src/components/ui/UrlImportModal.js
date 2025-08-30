// src/components/ui/UrlImportModal.js

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button'; // Your existing Button component
import Input from './Input'; // Your existing Input component

export default function UrlImportModal({ isOpen, onClose, onSubmit, title }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url);
      setUrl('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            className="glass-card w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <h2 className="text-xl font-bold mother-of-pearl-text mb-4">{title}</h2>
            <form onSubmit={handleSubmit}>
              <p className="text-sm text-text-secondary mb-4">
                Please provide a direct link to the raw content. For GitHub, use the "Raw" button link.
              </p>
              <Input
                id="url-import"
                label="URL"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" onClick={onClose} className="pearl-button !py-2 !px-4 text-sm">
                  Cancel
                </Button>
                <Button type="submit" className="primary-button !py-2 !px-4 text-sm">
                  Import
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}