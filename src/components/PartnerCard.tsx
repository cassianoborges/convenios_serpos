import { motion } from 'framer-motion';
import serposLogo from '@/assets/logo_cads.webp';
import { MapPin, Phone } from 'lucide-react';
import { Partner } from '@/types/partner';
import { useCategorias, getCategoryInfo } from '@/hooks/useCategorias';

interface PartnerCardProps {
  partner: Partner;
  onClick: () => void;
  index: number;
}

const PartnerCard = ({ partner, onClick, index }: PartnerCardProps) => {
  const { data: categories = [] } = useCategorias();
  const category = getCategoryInfo(partner.categoria, categories);
  
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={onClick}
      className="card-partner cursor-pointer overflow-hidden group"
    >
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {partner.logo_url ? (
            <img
              src={partner.logo_url}
              alt={partner.nome}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = serposLogo;
                e.currentTarget.className = 'w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-110';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/60">
              <img
                src={serposLogo}
                alt="Serpos"
                className="w-3/4 h-3/4 object-contain opacity-60"
              />
            </div>
          )}
        </div>
        
        {/* Discount Badge */}
        {partner.porcentagem_desconto > 1 && (
          <div className="absolute top-3 right-3">
            <span className="discount-badge">
              -{partner.porcentagem_desconto}%
            </span>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className={`category-chip text-xs border ${category.color}`}>
            {category.icon} {category.nome}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-foreground text-lg mb-2 line-clamp-1">
          {partner.nome}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {partner.descricao}
        </p>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{partner.endereco}</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{partner.telefone}</span>
        </div>
        
        <button className="w-full mt-4 py-2.5 px-4 bg-accent text-accent-foreground font-medium rounded-lg transition-all hover:opacity-90">
          Ver Detalhes
        </button>
      </div>
    </motion.div>
  );
};

export default PartnerCard;
