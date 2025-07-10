import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth/authContext';
import { useClinic } from '@/hooks/useClinic';
import { Moon, Sun, Play, Pause, ChevronLeft, ChevronRight, Users, FileText, Clipboard, MessageSquare, Stethoscope, Camera, Brain, Building2, Wrench } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Importar imagens padrão
import avaliacaoFacialImg from '@/assets/avaliacao-facial.jpg';
import avaliacaoCorporalImg from '@/assets/avaliacao-corporal.jpg';
import avaliacaoCapilarImg from '@/assets/avaliacao-capilar.jpg'; 
import protocolosImg from '@/assets/protocolos.jpg';
import historicoAvaliacoesImg from '@/assets/historico-avaliacoes.jpg';
import recursosImg from '@/assets/recursos.jpg';

interface ToolCard {
  title: string;
  image: string;
  route: string;
  section: string;
  id: string;
}

interface ClinicStatistics {
  assessments: number;
  professionals: number;
  patients: number;
  photos: number;
  protocols: number;
  resources: number;
}

const NetflixStyleDashboard = () => {
  const { user, profile } = useAuth();
  const { clinic } = useClinic();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [carouselImages, setCarouselImages] = useState<string[]>(['/placeholder.svg']);
  const [toolImages, setToolImages] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<ClinicStatistics>({
    assessments: 0,
    professionals: 0,
    patients: 0,
    photos: 0,
    protocols: 0,
    resources: 0
  });
  const [loading, setLoading] = useState(true);

  // Configuração dos cards de estatísticas
  const statCards = [
    {
      title: 'Pacientes',
      value: stats.patients,
      icon: Building2,
      color: 'text-purple-400',
      description: 'Pacientes cadastrados'
    },
    {
      title: 'Protocolos',
      value: stats.protocols,
      icon: FileText,
      color: 'text-pink-400',
      description: 'Protocolos criados'
    },
    {
      title: 'Avaliações',
      value: stats.assessments,
      icon: Brain,
      color: 'text-purple-400',
      description: 'Avaliações realizadas'
    },
    {
      title: 'Profissionais',
      value: stats.professionals,
      icon: Users,
      color: 'text-pink-400',
      description: 'Profissionais ativos'
    },
    {
      title: 'Recursos',
      value: stats.resources,
      icon: Wrench,
      color: 'text-purple-400',
      description: 'Equipamentos e produtos'
    },
    {
      title: 'Fotos',
      value: stats.photos,
      icon: Camera,
      color: 'text-pink-400',
      description: 'Fotos no sistema'
    }
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

  // Imagens padrão das ferramentas
  const defaultToolImages: Record<string, string> = {
    'avaliacao-facial': avaliacaoFacialImg,
    'avaliacao-corporal': avaliacaoCorporalImg,
    'avaliacao-capilar': avaliacaoCapilarImg,
    'protocolos': protocolosImg,
    'historico-avaliacoes': historicoAvaliacoesImg,
    'recursos': recursosImg,
    'pacientes': '/placeholder.svg',
    'anamneses': '/placeholder.svg',
    'galeria': '/placeholder.svg',
    'portal': '/placeholder.svg',
    'configuracao-clinica': '/placeholder.svg',
    'assinaturas': '/placeholder.svg'
  };

  // Função para carregar imagens customizadas das ferramentas
  const loadToolImages = async () => {
    if (!clinic?.id) return;

    try {
      const { data } = await supabase
        .from('dashboard_card_images')
        .select('card_id, image_url')
        .eq('clinic_id', clinic.id);

      if (data && data.length > 0) {
        const customImages: Record<string, string> = {};
        data.forEach(item => {
          customImages[item.card_id] = item.image_url;
        });
        setToolImages({ ...defaultToolImages, ...customImages });
      } else {
        setToolImages(defaultToolImages);
      }
    } catch (error) {
      console.error('Erro ao carregar imagens das ferramentas:', error);
      setToolImages(defaultToolImages);
    }
  };

  // Função para buscar estatísticas da clínica
  const fetchStatistics = async () => {
    if (!user || !profile || !profile.clinic_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_clinic_statistics');

      if (error) {
        console.error('Erro ao chamar função get_clinic_statistics:', error);
      } else if (data) {
        setStats(data as any);
      }
    } catch (error) {
      console.error('Erro inesperado ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados quando a clínica estiver disponível
  useEffect(() => {
    loadCarouselImages();
    loadToolImages();
    if (profile) {
      fetchStatistics();
    }
  }, [clinic?.id, profile]);

  const toolSections = [
    {
      title: 'Inteligência Artificial',
      color: 'text-purple-400',
      tools: [
        { title: 'Avaliação Facial', image: toolImages['avaliacao-facial'] || '/placeholder.svg', route: '/avaliacao-ia', section: 'ai', id: 'avaliacao-facial' },
        { title: 'Avaliação Corporal', image: toolImages['avaliacao-corporal'] || '/placeholder.svg', route: '/avaliacao-ia', section: 'ai', id: 'avaliacao-corporal' },
        { title: 'Avaliação Capilar', image: toolImages['avaliacao-capilar'] || '/placeholder.svg', route: '/avaliacao-ia', section: 'ai', id: 'avaliacao-capilar' },
        { title: 'Protocolos Personalizados', image: toolImages['protocolos'] || '/placeholder.svg', route: '/protocolos-personalizados', section: 'ai', id: 'protocolos' },
      ]
    },
    {
      title: 'Gerenciamento da Clínica',
      color: 'text-pink-400',
      tools: [
        { title: 'Estatísticas da Clínica', image: toolImages['historico-avaliacoes'] || '/placeholder.svg', route: '/estatisticas-clinica', section: 'management', id: 'estatisticas-clinica' },
        { title: 'Recursos da Clínica', image: toolImages['recursos'] || '/placeholder.svg', route: '/central-recursos', section: 'management', id: 'recursos' },
        { title: 'Pacientes', image: toolImages['pacientes'] || '/placeholder.svg', route: '/patients', section: 'management', id: 'pacientes' },
        { title: 'Anamneses', image: toolImages['anamneses'] || '/placeholder.svg', route: '/anamneses', section: 'management', id: 'anamneses' },
        { title: 'Galeria de Fotos', image: toolImages['galeria'] || '/placeholder.svg', route: '/galeria-fotos', section: 'management', id: 'galeria' },
      ]
    },
    {
      title: 'Configurações e Suporte',
      color: 'text-teal-400',
      tools: [
        { title: 'Chat IA', image: toolImages['portal'] || '/placeholder.svg', route: '/chat-ia', section: 'settings', id: 'chat-ia' },
        { title: 'Configurações da Clínica', image: toolImages['configuracao-clinica'] || '/placeholder.svg', route: '/configuracao-clinica', section: 'settings', id: 'configuracao-clinica' },
        { title: 'Assinaturas e Planos', image: toolImages['assinaturas'] || '/placeholder.svg', route: '/assinaturas', section: 'settings', id: 'assinaturas' },
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
          <button 
            onClick={() => {
              if (profile?.role === 'clinic_owner') {
                navigate('/configuracao-clinica');
              } else {
                navigate('/configuracao-profissional');
              }
            }}
            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-105 transition-transform"
            title="Configurações do perfil"
          >
            <img 
              src={clinic?.logo_url || "/lovable-uploads/ed86d62a-a928-44f7-8e5f-ec4200aedbb3.png"} 
              alt="Logo da Clínica" 
              className="w-8 h-8 rounded-full object-contain"
            />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        {/* Stats and Carousel Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Statistics */}
          <div className="lg:col-span-1">
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {statCards.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300">
                      <CardContent className="p-4 flex items-center space-x-3">
                        <IconComponent className={`h-6 w-6 ${stat.color}`} />
                        <div>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-sm text-muted-foreground">{stat.title}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Carousel */}
          <div className="lg:col-span-2">
            <div className="relative rounded-lg overflow-hidden aspect-[16/7] bg-card/30 backdrop-blur-sm">
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
                  <Card className="flex-shrink-0 w-72 h-40 bg-card/50 backdrop-blur-sm border-border/50 hover:scale-105 hover:bg-card/70 transition-all duration-300 cursor-pointer group">
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