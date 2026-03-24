import { motion } from 'framer-motion';
import SearchBar from './SearchBar';

interface HeroSectionProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

const HeroSection = ({ searchValue, onSearchChange }: HeroSectionProps) => {
  return (
    <section className="hero-gradient py-12 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Descontos Exclusivos para{' '}
            <span className="text-gold">Associados</span>
          </h2>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto">
            Encontre parceiros com benefícios especiais em saúde, educação, lazer e muito mais
          </p>
        </motion.div>
        
        <SearchBar value={searchValue} onChange={onSearchChange} />
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-6 mt-8"
        >
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-gold">50+</p>
            <p className="text-sm text-white/70">Parceiros</p>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-gold">35%</p>
            <p className="text-sm text-white/70">Até de desconto</p>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-gold">7</p>
            <p className="text-sm text-white/70">Categorias</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
