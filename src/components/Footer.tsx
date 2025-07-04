
import { Button } from '@/components/ui/button';

const Footer = () => {
  return (
    <footer id="contact" className="bg-[#424242]/5 py-12 border-t">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-cliniks flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-heading font-bold text-xl gradient-text">
                Cliniks IA Portal
              </span>
            </div>
            <p className="text-[#424242]/80 mb-4 max-w-md">
            O Cliniks IA é um portal completo que oferece ferramentas de inteligência artificial 
            para avaliações inteligentes, criação de protocolos personalizados e suporte integral aos profissionais de estética em sua rotina clínica.
            </p>
            <div className="flex space-x-4">
              <Button variant="outline" size="sm" className="border-[#7f00fa] text-[#7f00fa] hover:bg-[#7f00fa]/10">
                WhatsApp
              </Button>
              <Button variant="outline" size="sm" className="border-[#fb0082] text-[#fb0082] hover:bg-[#fb0082]/10">
                Email
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-[#424242]">Produto</h3>
            <ul className="space-y-2 text-sm text-[#424242]/80">
              <li><a href="#" className="hover:text-[#7f00fa]">Funcionalidades</a></li>
              <li><a href="#" className="hover:text-[#7f00fa]">Planos</a></li>
              <li><a href="#" className="hover:text-[#7f00fa]">API</a></li>
              <li><a href="#" className="hover:text-[#7f00fa]">Segurança</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-[#424242]">Empresa</h3>
            <ul className="space-y-2 text-sm text-[#424242]/80">
              <li><a href="#" className="hover:text-[#7f00fa]">Sobre nós</a></li>
              <li><a href="#" className="hover:text-[#7f00fa]">Blog</a></li>
              <li><a href="#" className="hover:text-[#7f00fa]">Carreiras</a></li>
              <li><a href="#" className="hover:text-[#7f00fa]">Contato</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-[#424242]/80">
            © 2024 Cliniks IA Portal. Todos os direitos reservados.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0 text-sm text-[#424242]/80">
            <a href="#" className="hover:text-[#7f00fa]">Termos</a>
            <a href="#" className="hover:text-[#7f00fa]">Privacidade</a>
            <a href="#" className="hover:text-[#7f00fa]">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
