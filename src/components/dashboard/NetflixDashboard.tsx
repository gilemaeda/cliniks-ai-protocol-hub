import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/authContext';
import { useClinic } from '@/hooks/useClinic';
import { useTheme } from 'next-themes';
import { 
  Users, FileText, Brain, Camera, Calendar, Settings, 
  Sun, Moon, Play, Pause, ChevronLeft, ChevronRight,
  BarChart3, Stethoscope, Image
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

const NetflixDashboard = () => {
  const { user, profile } = useAuth();
  const { clinic } = useClinic();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [clinicCarouselImages, setClinicCarouselImages] = useState<string[]>([]);

  // Fallback carousel images
  const fallbackImages = [
    '/lovable-uploads/photo-1605810230434-7631ac76ec81.jpg',
    '/lovable-uploads/photo-1487058792275-0ad4aaf24ca7.jpg',
    '/lovable-uploads/photo-1526374965328-7f61d4dc18c5.jpg'
  ];

  // Load clinic carousel images
  useEffect(() => {
    async function loadClinicCarouselImages() {
      if (!clinic?.id) return;

      const { data: carouselData } = await supabase
        .from('clinic_carousel_images')
        .select('image_url')
        .eq('clinic_id', clinic.id)
        .order('sort_order', { ascending: true });

      if (carouselData && carouselData.length > 0) {
        setClinicCarouselImages(carouselData.map(item => item.image_url));
      } else if (clinic.banner_url) {
        // Se não há carrossel, mas tem banner, usar o banner
        setClinicCarouselImages([clinic.banner_url]);
      } else {
        // Usar imagens fallback
        setClinicCarouselImages(fallbackImages);
      }
    }

    loadClinicCarouselImages();
  }, [clinic?.id, clinic?.banner_url]);

  const carouselImages = clinicCarouselImages.length > 0 ? clinicCarouselImages : fallbackImages;

  // Statistics data
  const stats = [
    { icon: Users, label: 'Pacientes', value: '850', color: 'text-primary' },
    { icon: FileText, label: 'Protocolos', value: '120', color: 'text-secondary' },
    { icon: Brain, label: 'Avaliações', value: '250', color: 'text-accent' },
    { icon: Stethoscope, label: 'Anamneses', value: '40', color: 'text-primary' },
    { icon: Users, label: 'Profissionais', value: '18', color: 'text-secondary' },
    { icon: Image, label: 'Fotos', value: '670', color: 'text-accent' }
  ];

  // Dashboard sections
  const sections = [
    {
      title: 'Inteligência Artificial',
      tools: [
        { title: 'Avaliação Facial', path: '/avaliacao-ia/facial', image: 'https://sarahbrasildermato.com.br/wp-content/uploads/2023/07/Paciente-injetando-bioestimuladores-de-colageno-numa-clinica-de-estetica-corporal-e-facial.jpeg' },
        { title: 'Avaliação Corporal', path: '/avaliacao-ia/corporal', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0KJ2jnhibR57rzU4-aJzwbqaUoVdT-GXe_Q&s' },
        { title: 'Avaliação Capilar', path: '/avaliacao-ia/capilar', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQU5qGWaB3gCyA9yrBWcEDICtvH817pErZuAA&s' },
        { title: 'Protocolos Personalizados', path: '/protocolos-personalizados', image: '/placeholder.svg' }
      ]
    },
    {
      title: 'Gerenciamento da Clínica',
      tools: [
        { title: 'Histórico de Avaliações', path: '/historico-avaliacoes', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUA70O31ZSVOQ_I-sg-a6jzaZ_ZzBYPlmsMQ&s' },
        { title: 'Recursos', path: '/recursos', image: 'https://cdn.getmidnight.com/a4bab3ce420ea5342f99b468206738eb/2024/05/Iluminacao-de-uma-Clinica-Estetica-de-Luxo.webp' },
        { title: 'Pacientes', path: '/patients', image: 'https://www.hidoctor.com.br/fmfiles/index.asp/::places::/hidoctorblog/9-dicas-para-aproveitar-ao-maximo-o-prontuario-eletronico-e-otimizar-o-atendimento.jpg' },
        { title: 'Anamneses', path: '/anamneses', image: 'https://fullfaceacademy.com.br/wp-content/webp-express/webp-images/uploads/2023/08/Capa-Fichas-Premium-Harmonizacao-Facial-8Download-Termo-de-Consentimento-para-BotoxDownload-Ficha-de-AnamneseFormularios-de-Consentimento-Estetico-1024x1024.jpg.webp' },
        { title: 'Galeria de Fotos', path: '/galeria-fotos', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR43mY97JSHW5eogkOXWVUGUnoycJ0r5Wa_4w&s' }
      ]
    },
    {
      title: 'Configurações e Suporte',
      tools: [
        { title: 'Portal Cliniks', path: 'https://cliniks.com.br/', image: 'https://rpfrmclsraiidjlfeonj.supabase.co/storage/v1/object/public/clinic-assets//CLINIKS.COM.BR.jpg' },
        { title: 'Configurações da Clínica', path: '/configuracao-clinica', image: 'https://png.pngtree.com/png-vector/20190214/ourmid/pngtree-vector-settings-icon-png-image_508256.jpg' },
        { title: 'Assinaturas e Planos', path: '/assinaturas', image: 'https://aspin.com.br/wp-content/uploads/2022/11/IMAGENS_01-600x250-1.jpg' }
      ]
    }
  ];

  // Auto-advance carousel
  useEffect(() => {
    if (!carouselPaused) {
      const interval = setInterval(() => {
        setCarouselIndex((prev) => (prev + 1) % carouselImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [carouselPaused, carouselImages.length]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/ab2785a6-dc6c-4b32-8932-53d2d17f1361.png" 
            alt="Cliniks IA" 
            className="h-8 w-auto"
          />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Cliniks IA
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={clinic?.logo_url} />
            <AvatarFallback>{profile?.full_name?.[0]}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="flex gap-8 p-6">
        {/* Left: Statistics */}
        <div className="w-96 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Estatísticas</h2>
          <div className="grid grid-cols-4 gap-3">
            {stats.map((stat, index) => (
              <Card key={index} className="p-3 hover:shadow-lg transition-shadow">
                <div className="text-center">
                  <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: Carousel and Sections */}
        <div className="flex-1 space-y-8">
          {/* Carousel */}
          <div className="relative h-64 rounded-lg overflow-hidden">
            <img
              src={carouselImages[carouselIndex]}
              alt="Banner da clínica"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-4 right-4 flex space-x-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => setCarouselPaused(!carouselPaused)}
              >
                {carouselPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => setCarouselIndex((prev) => prev === 0 ? carouselImages.length - 1 : prev - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => setCarouselIndex((prev) => (prev + 1) % carouselImages.length)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Sections */}
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-4">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <div className="flex space-x-4 overflow-x-auto pb-4">
                {section.tools.map((tool, toolIndex) => (
                  <Card
                    key={toolIndex}
                    className="min-w-[200px] h-32 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => navigate(tool.path)}
                  >
                    <CardContent className="p-0 h-full relative">
                      <img
                        src={tool.image}
                        alt={tool.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent rounded-lg" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <h3 className="text-white font-medium text-sm">{tool.title}</h3>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NetflixDashboard;