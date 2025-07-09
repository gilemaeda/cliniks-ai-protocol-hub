import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth/authContext';
import { useClinic } from '@/hooks/useClinic';
import { Moon, Sun, Play, Pause, ChevronLeft, ChevronRight, Users, FileText, Clipboard, MessageSquare, Stethoscope, Camera } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ToolCard {
  title: string;
  image: string;
  route: string;
  section: string;
}

const NetflixStyleDashboard = () => {
  const { user } = useAuth();
  const { clinic } = useClinic();
  const { theme, setTheme } = useTheme();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [carouselImages, setCarouselImages] = useState<string[]>(['/placeholder.svg']);

  const stats = [
    { icon: Users, label: 'Pacientes', value: 850, color: 'text-purple-400' },
    { icon: FileText, label: 'Protocolos', value: 120, color: 'text-pink-400' },
    { icon: Clipboard, label: 'Avaliações', value: 250, color: 'text-purple-400' },
    { icon: MessageSquare, label: 'Anamneses', value: 40, color: 'text-pink-400' },
    { icon: Stethoscope, label: 'Profissionais', value: 18, color: 'text-purple-400' },
    { icon: Camera, label: 'Fotos', value: 670, color: 'text-pink-400' },
  ];

  // Função para carregar imagens do carrossel da clínica
  const loadCarouselImages = async () => {
    if (!clinic?.id) return;

    try {
      const images: string[] = [];
      
      // Adicionar banner da clínica se existir
      if (clinic.banner_url) {
        images.push(clinic.banner_url);
      }

      // Buscar imagens adicionais do carrossel
      const { data: carouselData } = await supabase
        .from('clinic_carousel_images')
        .select('image_url')
        .eq('clinic_id', clinic.id)
        .order('sort_order', { ascending: true });

      if (carouselData && carouselData.length > 0) {
        const additionalImages = carouselData.map(item => item.image_url);
        images.push(...additionalImages);
      }

      // Se não houver imagens, usar placeholder
      if (images.length === 0) {
        images.push('/placeholder.svg');
      }

      setCarouselImages(images);
    } catch (error) {
      console.error('Erro ao carregar imagens do carrossel:', error);
      setCarouselImages(['/placeholder.svg']);
    }
  };

  // Carregar imagens quando a clínica estiver disponível
  useEffect(() => {
    loadCarouselImages();
  }, [clinic?.id]);

  const toolSections = [
    {
      title: 'Inteligência Artificial',
      color: 'text-purple-400',
      tools: [
        { title: 'Avaliação Facial', image: '/placeholder.svg', route: '/avaliacao-facial', section: 'ai' },
        { title: 'Avaliação Corporal', image: '/placeholder.svg', route: '/avaliacao-corporal', section: 'ai' },
        { title: 'Avaliação Capilar', image: '/placeholder.svg', route: '/avaliacao-capilar', section: 'ai' },
        { title: 'Protocolos Personalizados', image: '/placeholder.svg', route: '/protocolos', section: 'ai' },
      ]
    },
    {
      title: 'Gerenciamento da Clínica',
      color: 'text-pink-400',
      tools: [
        { title: 'Histórico de Avaliações', image: '/placeholder.svg', route: '/historico-avaliacoes', section: 'management' },
        { title: 'Recursos', image: '/placeholder.svg', route: '/recursos', section: 'management' },
        { title: 'Pacientes', image: '/placeholder.svg', route: '/pacientes', section: 'management' },
        { title: 'Anamneses', image: '/placeholder.svg', route: '/anamneses', section: 'management' },
        { title: 'Galeria de Fotos', image: '/placeholder.svg', route: '/galeria', section: 'management' },
      ]
    },
    {
      title: 'Configurações e Suporte',
      color: 'text-teal-400',
      tools: [
        { title: 'Portal Cliniks', image: '/placeholder.svg', route: '/portal', section: 'settings' },
        { title: 'Configurações da Clínica', image: '/placeholder.svg', route: '/configuracao-clinica', section: 'settings' },
        { title: 'Assinaturas e Planos', image: '/placeholder.svg', route: '/assinaturas', section: 'settings' },
      ]
    }
  ];

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCarouselIndex((prev) => (prev + 1) % carouselImages.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, carouselImages.length]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const navigateCarousel = (direction: 'left' | 'right') => {
    setCarouselIndex((prev) => {
      if (direction === 'left') {
        return prev === 0 ? carouselImages.length - 1 : prev - 1;
      } else {
        return (prev + 1) % carouselImages.length;
      }
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-6 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center space-x-4">
          <img 
            src="/lovable-uploads/d2f2cf36-d805-46d2-8805-9f5753c736cb.png" 
            alt="Cliniks IA" 
            className="h-12 w-auto object-contain"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        {/* Stats and Carousel Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Statistics */}
          <div className="lg:col-span-1">
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300">
                  <CardContent className="p-4 flex items-center space-x-3">
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Carousel */}
          <div className="lg:col-span-2">
            <div className="relative rounded-lg overflow-hidden aspect-video bg-card/30 backdrop-blur-sm">
              <img 
                src={carouselImages[carouselIndex]}
                alt="Banner"
                className="w-full h-full object-cover"
              />
              
              {/* Carousel Controls */}
              <div className="absolute top-4 right-4 flex space-x-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-black/50 hover:bg-black/70 text-white"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => navigateCarousel('left')}
                  className="bg-black/50 hover:bg-black/70 text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => navigateCarousel('right')}
                  className="bg-black/50 hover:bg-black/70 text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Carousel Indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {carouselImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCarouselIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === carouselIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tool Sections */}
        {toolSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${section.color}`}>
                {section.title}
              </h2>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
              {section.tools.map((tool, toolIndex) => (
                <Link key={toolIndex} to={tool.route}>
                  <Card className="flex-shrink-0 w-64 h-36 bg-card/50 backdrop-blur-sm border-border/50 hover:scale-105 hover:bg-card/70 transition-all duration-300 cursor-pointer group">
                    <CardContent className="p-0 h-full relative rounded-lg overflow-hidden">
                      <img 
                        src={tool.image}
                        alt={tool.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-semibold text-lg">{tool.title}</h3>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default NetflixStyleDashboard;