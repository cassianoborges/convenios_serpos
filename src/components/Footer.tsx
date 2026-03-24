import logoSerpos from '@/assets/logo-serpos.png';

const Footer = () => {
  return (
    <footer className="hero-gradient py-12 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={logoSerpos} 
                alt="Grupo Serpos" 
                className="h-14 w-14 rounded-full bg-white p-1"
              />
              <div>
                <h3 className="text-lg font-bold text-white">Grupo Serpos</h3>
                <p className="text-xs text-white/70">Cuidando de você e sua família</p>
              </div>
            </div>
            <p className="text-sm text-white/60 text-center md:text-left">
              Há mais de 30 anos oferecendo tranquilidade e segurança para as famílias goianas.
            </p>
          </div>
          
          {/* Links */}
          <div className="text-center md:text-left">
            <h4 className="font-semibold text-white mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">
                  Início
                </a>
              </li>
              <li>
                <a href="#parceiros" className="text-sm text-white/70 hover:text-white transition-colors">
                  Parceiros
                </a>
              </li>
              <li>
                <a href="https://serpos.com.br" target="_blank" rel="noopener noreferrer" className="text-sm text-white/70 hover:text-white transition-colors">
                  Site Oficial
                </a>
              </li>
              <li>
                <a href="https://app.serpos.com.br/" target="_blank" rel="noopener noreferrer" className="text-sm text-gold hover:text-gold/80 transition-colors">
                  2ª Via de Boleto
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div className="text-center md:text-left">
            <h4 className="font-semibold text-white mb-4">Contato</h4>
            <ul className="space-y-2">
              <li className="text-sm text-white/70">
                📍 Rua Acácia, 24 - Goiânia, GO
              </li>
              <li className="text-sm text-white/70">
                📞 (62) 3532-5661
              </li>
              <li className="text-sm text-white/70">
                🕐 Seg - Sex: 8h às 18h
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/20 mt-8 pt-6 text-center">
          <p className="text-xs text-white/50">
            © 2024 Grupo Serpos. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
