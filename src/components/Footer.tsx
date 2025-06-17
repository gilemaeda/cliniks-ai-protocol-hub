
import { Button } from '@/components/ui/button';

const Footer = () => {
  return (
    <footer id="contact" className="bg-muted/50 py-12 border-t">
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
            <p className="text-muted-foreground mb-4 max-w-md">
              A plataforma completa para modernizar sua clínica estética com 
              inteligência artificial e ferramentas profissionais.
            </p>
            <div className="flex space-x-4">
              <Button variant="outline" size="sm">
                WhatsApp
              </Button>
              <Button variant="outline" size="sm">
                Email
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Produto</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Funcionalidades</a></li>
              <li><a href="#" className="hover:text-primary">Planos</a></li>
              <li><a href="#" className="hover:text-primary">API</a></li>
              <li><a href="#" className="hover:text-primary">Segurança</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Sobre nós</a></li>
              <li><a href="#" className="hover:text-primary">Blog</a></li>
              <li><a href="#" className="hover:text-primary">Carreiras</a></li>
              <li><a href="#" className="hover:text-primary">Contato</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Cliniks IA Portal. Todos os direitos reservados.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary">Termos</a>
            <a href="#" className="hover:text-primary">Privacidade</a>
            <a href="#" className="hover:text-primary">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
