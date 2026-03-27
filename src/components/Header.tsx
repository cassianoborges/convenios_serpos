import { motion } from 'framer-motion';
import logoSerpos from '@/assets/logo_serpos.jpeg';

const Header = () => {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="hero-gradient sticky top-0 z-40 shadow-lg"
    >
      <div className="container mx-auto px-4 py-2 md:py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src={logoSerpos}
              alt="Grupo Serpos"
              className="h-20 w-20 md:h-28 md:w-28 rounded-full bg-white p-1 object-contain drop-shadow-md"
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
          
          <a href="https://app.serpos.com.br/" target="_blank" rel="noopener noreferrer" className="btn-gold text-xs px-3 py-2 md:text-sm md:px-6 md:py-3">
            Área do Associado
          </a>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
