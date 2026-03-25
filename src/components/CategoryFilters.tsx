import { motion } from 'framer-motion';
import { useCategorias } from '@/hooks/useCategorias';

interface CategoryFiltersProps {
  selectedCategory: string | null;
  onSelect: (category: string | null) => void;
}

const CategoryFilters = ({ selectedCategory, onSelect }: CategoryFiltersProps) => {
  const { data: categories = [] } = useCategorias();

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      id="categorias"
      className="w-full"
    >
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:justify-center md:overflow-visible md:pb-0 md:gap-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => onSelect(null)}
          className={`category-chip border flex-shrink-0 ${
            selectedCategory === null
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-foreground border-border hover:border-primary/50'
          }`}
        >
          <span>🏠</span>
          <span>Todos</span>
        </button>
        
        {categories.map((category, index) => (
          <motion.button
            key={category.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 * index }}
            onClick={() => onSelect(selectedCategory === category.id ? null : category.id)}
            className={`category-chip border flex-shrink-0 ${
              selectedCategory === category.id
                ? 'bg-primary text-primary-foreground border-primary'
                : `${category.color} hover:opacity-80`
            }`}
          >
            <span>{category.icon}</span>
            <span>{category.nome}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default CategoryFilters;

