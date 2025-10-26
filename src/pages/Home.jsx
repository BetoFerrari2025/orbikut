import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Users, Flame, Trophy, TrendingUp, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Traduções
const translations = {
  pt: {
    newEra: "A nova era das redes sociais",
    title: "Orbikut",
    subtitle: "Compartilhe momentos, ganhe pontos, evolua e conecte-se com pessoas incríveis!",
    startNow: "Começar Agora",
    learnMore: "Saber Mais",
    login: "Entrar",
    signUp: "Cadastrar-se",
    stats1: "Usuários Ativos",
    stats2: "Posts Compartilhados",
    stats3: "Conexões Criadas",
    whyTitle: "Por que escolher o Orbikut?",
    whySubtitle: "Uma plataforma completa para você se expressar, conectar e evoluir",
    feature1Title: "Compartilhe Momentos",
    feature1Desc: "Publique fotos, vídeos e músicas. Expresse-se como nunca!",
    feature2Title: "Conecte-se",
    feature2Desc: "Faça amizades, siga pessoas incríveis e construa sua comunidade",
    feature3Title: "Sistema de Níveis",
    feature3Desc: "Ganhe pontos, suba de nível e desbloqueie conquistas",
    feature4Title: "Conquistas",
    feature4Desc: "Complete desafios e ganhe badges exclusivas",
    ctaTitle: "Pronto para começar?",
    ctaSubtitle: "Junte-se a milhões de usuários e comece a compartilhar seus melhores momentos agora mesmo!",
    createAccount: "Criar Conta Grátis",
    terms: "Termos",
    privacy: "Privacidade",
    contact: "Contato",
    copyright: "© 2025 Orbikut. Todos os direitos reservados."
  },
  en: {
    newEra: "The new era of social networks",
    title: "Orbikut",
    subtitle: "Share moments, earn points, evolve and connect with amazing people!",
    startNow: "Start Now",
    learnMore: "Learn More",
    login: "Login",
    signUp: "Sign Up",
    stats1: "Active Users",
    stats2: "Shared Posts",
    stats3: "Connections Created",
    whyTitle: "Why choose Orbikut?",
    whySubtitle: "A complete platform for you to express yourself, connect and evolve",
    feature1Title: "Share Moments",
    feature1Desc: "Post photos, videos and music. Express yourself like never before!",
    feature2Title: "Connect",
    feature2Desc: "Make friends, follow amazing people and build your community",
    feature3Title: "Level System",
    feature3Desc: "Earn points, level up and unlock achievements",
    feature4Title: "Achievements",
    feature4Desc: "Complete challenges and earn exclusive badges",
    ctaTitle: "Ready to start?",
    ctaSubtitle: "Join millions of users and start sharing your best moments right now!",
    createAccount: "Create Free Account",
    terms: "Terms",
    privacy: "Privacy",
    contact: "Contact",
    copyright: "© 2025 Orbikut. All rights reserved."
  },
  es: {
    newEra: "La nueva era de las redes sociales",
    title: "Orbikut",
    subtitle: "¡Comparte momentos, gana puntos, evoluciona y conéctate con personas increíbles!",
    startNow: "Empezar Ahora",
    learnMore: "Saber Más",
    login: "Entrar",
    signUp: "Registrarse",
    stats1: "Usuarios Activos",
    stats2: "Posts Compartidos",
    stats3: "Conexiones Creadas",
    whyTitle: "¿Por qué elegir Orbikut?",
    whySubtitle: "Una plataforma completa para expresarte, conectar y evolucionar",
    feature1Title: "Comparte Momentos",
    feature1Desc: "Publica fotos, videos y música. ¡Exprésate como nunca!",
    feature2Title: "Conéctate",
    feature2Desc: "Haz amigos, sigue personas increíbles y construye tu comunidad",
    feature3Title: "Sistema de Niveles",
    feature3Desc: "Gana puntos, sube de nivel y desbloquea logros",
    feature4Title: "Logros",
    feature4Desc: "Completa desafíos y gana insignias exclusivas",
    ctaTitle: "¿Listo para empezar?",
    ctaSubtitle: "¡Únete a millones de usuarios y comienza a compartir tus mejores momentos ahora mismo!",
    createAccount: "Crear Cuenta Gratis",
    terms: "Términos",
    privacy: "Privacidad",
    contact: "Contacto",
    copyright: "© 2025 Orbikut. Todos los derechos reservados."
  }
};

// Detectar idioma do navegador
const detectLanguage = () => {
  const browserLang = navigator.language || navigator.userLanguage;
  
  if (browserLang.startsWith('pt')) return 'pt';
  if (browserLang.startsWith('es')) return 'es';
  return 'en'; // inglês como padrão
};

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState(detectLanguage());
  const t = translations[lang];

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) {
        base44.auth.me().then(u => {
          setUser(u);
          navigate(createPageUrl("Feed"));
        }).catch(() => {});
      }
    });
  }, [navigate]);

  const { data: activeVideo } = useQuery({
    queryKey: ['home-video'],
    queryFn: async () => {
      const videos = await base44.entities.HomeVideo.filter({ is_active: true });
      return videos[0] || null;
    },
    initialData: null,
  });

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl("Feed"));
  };

  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: t.feature1Title,
      description: t.feature1Desc
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: t.feature2Title,
      description: t.feature2Desc
    },
    {
      icon: <Flame className="w-8 h-8" />,
      title: t.feature3Title,
      description: t.feature3Desc
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: t.feature4Title,
      description: t.feature4Desc
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f7d36476cc6caa340c6550/22c35e41c_Orbikut-3.png" 
                alt="Orbikut" 
                className="h-10 w-auto"
              />
            </div>
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="px-3 py-2 rounded-lg border border-purple-200 bg-white text-sm font-medium text-gray-700 hover:bg-purple-50 transition-colors cursor-pointer"
              >
                <option value="pt">🇧🇷 PT</option>
                <option value="en">🇺🇸 EN</option>
                <option value="es">🇪🇸 ES</option>
              </select>
              
              <Button
                onClick={handleLogin}
                variant="ghost"
                className="rounded-xl font-semibold hover:bg-purple-50"
              >
                {t.login}
              </Button>
              <Button
                onClick={handleLogin}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-semibold shadow-lg"
              >
                {t.signUp}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-6">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-purple-900">{t.newEra}</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                  {t.title}
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
                {t.subtitle}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={handleLogin}
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl font-bold text-lg px-8 py-6 shadow-2xl shadow-purple-500/30 hover:scale-105 transition-transform"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {t.startNow}
                </Button>
                
                <Button
                  onClick={handleLogin}
                  size="lg"
                  variant="outline"
                  className="rounded-2xl font-bold text-lg px-8 py-6 border-2 border-purple-200 hover:bg-purple-50"
                >
                  {t.learnMore}
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12">
                <div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">1M+</p>
                  <p className="text-gray-600 text-sm">{t.stats1}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">5M+</p>
                  <p className="text-gray-600 text-sm">{t.stats2}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">10M+</p>
                  <p className="text-gray-600 text-sm">{t.stats3}</p>
                </div>
              </div>
            </motion.div>

            {/* Right Content - Video or Image */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              {activeVideo ? (
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <video
                    src={activeVideo.video_url}
                    controls
                    poster="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f7d36476cc6caa340c6550/21f0f9d04_Orbikut-31.png"
                    className="w-full h-auto"
                  />
                </div>
              ) : (
                <div className="relative">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f7d36476cc6caa340c6550/21f0f9d04_Orbikut-31.png" 
                    alt="Orbikut Preview" 
                    className="w-full h-auto rounded-3xl shadow-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent rounded-3xl" />
                </div>
              )}
              
              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl opacity-60"
              />
              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full blur-3xl opacity-60"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t.whyTitle}
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t.whySubtitle}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-purple-100"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-3xl p-12 text-center text-white shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                {t.ctaTitle}
              </h2>
              <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                {t.ctaSubtitle}
              </p>
              <Button
                onClick={handleLogin}
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 rounded-2xl font-bold text-lg px-12 py-6 shadow-xl hover:scale-105 transition-transform"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {t.createAccount}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-purple-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f7d36476cc6caa340c6550/22c35e41c_Orbikut-3.png" 
                alt="Orbikut" 
                className="h-8 w-auto"
              />
              <span className="text-gray-600">{t.copyright}</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">{t.terms}</a>
              <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">{t.privacy}</a>
              <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">{t.contact}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}