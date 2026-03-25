import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import CategoryFilters from '@/components/CategoryFilters';
import PartnerCard from '@/components/PartnerCard';
import PartnerModal from '@/components/PartnerModal';
import WhatsAppButton from '@/components/WhatsAppButton';
import Footer from '@/components/Footer';
import { usePartners } from '@/hooks/usePartners';
import { useUnidades } from '@/hooks/useUnidades';
import { Partner, Category } from '@/types/partner';
import { useUTM } from '@/hooks/useUTM';
import { useTracking } from '@/hooks/useTracking';

const Index = () => {
  useUTM(); // inicializa e persiste UTMs da URL
  const { track } = useTracking();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedUnidadeId, setSelectedUnidadeId] = useState<number | undefined>(undefined);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rastreia page_view uma vez ao carregar
  useEffect(() => { track('page_view'); }, []);

  // Rastreia busca com debounce (só dispara após parar de digitar)
  useEffect(() => {
    if (!searchQuery) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      track('search', { valor: searchQuery });
    }, 1500);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery]);

  const { data: partnersData, isLoading, isError } = usePartners({
    categoria: selectedCategory ?? undefined,
    unidade_id: selectedUnidadeId,
    busca: searchQuery || undefined,
  });

  const { data: unidades } = useUnidades();

  const partners = partnersData?.data ?? [];

  const handlePartnerClick = (partner: Partner) => {
    track('partner_click', {
      partner_id: Number(partner.id),
      partner_nome: partner.nome,
      categoria: partner.categoria,
      unidade_id: partner.unidade_id,
    });
    setSelectedPartner(partner);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedPartner(null), 200);
  };

  const handleCategorySelect = (cat: Category | null) => {
    setSelectedCategory(cat);
    if (cat) track('category_filter', { categoria: cat, valor: cat });
  };

  const handleUnidadeSelect = (id: number | undefined) => {
    setSelectedUnidadeId(id);
    if (id) track('unidade_filter', { unidade_id: id, valor: String(id) });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <HeroSection
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Filtro por Unidade */}
        {unidades && unidades.length > 0 && (
          <section className="mb-6">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-muted-foreground mr-2">Unidade:</span>
              <button
                onClick={() => handleUnidadeSelect(undefined)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${!selectedUnidadeId
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:bg-secondary'
                  }`}
              >
                Todas
              </button>
              {unidades.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleUnidadeSelect(u.id === selectedUnidadeId ? undefined : u.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${selectedUnidadeId === u.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:bg-secondary'
                    }`}
                >
                  {u.nome}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        <section className="mb-8 md:mb-12">
          <CategoryFilters
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </section>

        {/* Partners Grid */}
        <section id="parceiros">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between mb-6"
          >
            <h3 className="text-xl md:text-2xl font-bold text-foreground">
              {selectedCategory ? `Parceiros em ${selectedCategory}` : 'Todos os Parceiros'}
            </h3>
            <span className="text-sm text-muted-foreground">
              {isLoading ? '...' : `${partnersData?.total ?? 0} parceiros`}
            </span>
          </motion.div>

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {isError && (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">⚠️</p>
              <h4 className="text-lg font-semibold text-foreground mb-2">Erro ao carregar convênios</h4>
              <p className="text-muted-foreground">Verifique se o servidor está rodando em localhost:3004</p>
            </div>
          )}

          {!isLoading && !isError && partners.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {partners.map((partner, index) => (
                <PartnerCard
                  key={partner.id}
                  partner={partner}
                  onClick={() => handlePartnerClick(partner)}
                  index={index}
                />
              ))}
            </div>
          )}

          {!isLoading && !isError && partners.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <p className="text-4xl mb-4">🔍</p>
              <h4 className="text-lg font-semibold text-foreground mb-2">
                Nenhum parceiro encontrado
              </h4>
              <p className="text-muted-foreground">
                Tente buscar por outro termo ou categoria
              </p>
            </motion.div>
          )}
        </section>
      </main>

      <Footer />

      <PartnerModal
        partner={selectedPartner}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      <WhatsAppButton />
    </div>
  );
};

export default Index;
