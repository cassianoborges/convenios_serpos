import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Phone, Globe, FileText, ExternalLink } from 'lucide-react';
import { Partner } from '@/types/partner';
import { useCategorias, getCategoryInfo } from '@/hooks/useCategorias';

import serposLogo from '@/assets/logo_cads.webp';

interface PartnerModalProps {
  partner: Partner | null;
  isOpen: boolean;
  onClose: () => void;
}

const PartnerModal = ({ partner, isOpen, onClose }: PartnerModalProps) => {
  const { data: categories = [] } = useCategorias();

  if (!partner) return null;
  
  const category = getCategoryInfo(partner.categoria, categories);
  
  const handleMapsClick = () => {
    const encoded = encodeURIComponent(partner.endereco);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
  };
  
  const handlePhoneClick = () => {
    const phone = (partner.whatsapp || partner.telefone).replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}`, '_blank');
  };

  const handleSiteClick = () => {
    const url = partner.site?.startsWith('http') ? partner.site : `https://${partner.site}`;
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop + centering wrapper */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[92vh] sm:max-h-[90vh] overflow-y-auto overscroll-contain"
          >
            {/* Header Image */}
            <div className="relative h-48 md:h-56">
              {partner.logo_url ? (
                <img
                  src={partner.logo_url}
                  alt={partner.nome}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = serposLogo;
                    e.currentTarget.className = 'w-full h-full object-contain p-8 bg-muted/60';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/60">
                  <img
                    src={serposLogo}
                    alt="Serpos"
                    className="w-1/2 h-3/4 object-contain opacity-60"
                  />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              {/* Discount Badge */}
              {partner.porcentagem_desconto > 1 && (
                <div className="absolute bottom-4 right-4">
                  <span className="discount-badge text-lg px-4 py-2">
                    -{partner.porcentagem_desconto}% OFF
                  </span>
                </div>
              )}
              
              {/* Category */}
              <div className="absolute bottom-4 left-4">
                <span className={`category-chip border ${category.color}`}>
                  {category.icon} {category.nome}
                </span>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4 md:p-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {partner.nome}
              </h2>
              
              <p className="text-muted-foreground mb-6">
                {partner.descricao}
              </p>
              
              {/* Info Grid */}
              <div className="space-y-4 mb-6">
                <div 
                  onClick={handleMapsClick}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary cursor-pointer hover:bg-secondary/80 transition-colors"
                >
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Endereço</p>
                    <p className="text-sm text-muted-foreground">{partner.endereco}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
                
                <div 
                  onClick={handlePhoneClick}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary cursor-pointer hover:bg-secondary/80 transition-colors"
                >
                  <Phone className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Telefone/WhatsApp</p>
                    <p className="text-sm text-muted-foreground">{partner.whatsapp || partner.telefone}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>

                {partner.site && (
                  <div 
                    onClick={handleSiteClick}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary cursor-pointer hover:bg-secondary/80 transition-colors"
                  >
                    <Globe className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Site</p>
                      <p className="text-sm text-muted-foreground truncate">{partner.site}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Rules */}
              {partner.regras && (
                <div className="p-4 rounded-lg bg-gold/10 border border-gold/30 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gold" />
                    <p className="text-sm font-semibold text-foreground">Como obter o desconto</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {partner.regras}
                  </p>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-3">
                <button 
                  onClick={handlePhoneClick}
                  className="flex-1 py-3 px-4 bg-accent text-accent-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Entrar em Contato
                </button>
                <button 
                  onClick={handleMapsClick}
                  className="py-3 px-4 border border-border rounded-lg hover:bg-secondary transition-colors"
                >
                  <MapPin className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PartnerModal;
