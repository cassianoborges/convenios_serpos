const LOGO_URL = 'https://serpos.com.br/wp-content/uploads/2024/10/logo-grupo-serpos.png.webp';

import { motion } from 'framer-motion';

const Header = () => {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="hero-gradient sticky top-0 z-40 shadow-lg"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src={LOGO_URL}
              alt="Grupo Serpos" 
              className="h-14 object-contain drop-shadow-md"
            />
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-medium text-white/90 hover:text-white transition-colors">
              Início
            </a>
            <a href="#parceiros" className="text-sm font-medium text-white/90 hover:text-white transition-colors">
              Parceiros
            </a>
            <a href="#categorias" className="text-sm font-medium text-white/90 hover:text-white transition-colors">
              Categorias
            </a>
          </nav>
          
          <a href="https://app.serpos.com.br/" target="_blank" rel="noopener noreferrer" className="btn-gold text-sm hidden md:block">
            Área do Associado
          </a>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
