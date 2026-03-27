import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  const handleClick = () => {
    window.open('https://wa.me/556296295109?text=Olá! Preciso de ajuda com os convênios Grupo Serpos.', '_blank');
  };

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className="floating-button"
      aria-label="Contato via WhatsApp"
    >
      <MessageCircle className="w-6 h-6 text-white" />
    </motion.button>
  );
};

export default WhatsAppButton;
