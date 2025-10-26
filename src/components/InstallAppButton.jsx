import React, { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const checkMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(checkMobile);

    const checkIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsIOS(checkIOS);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;

    const bannerDismissed = localStorage.getItem('install-banner-dismissed');

    if (!isStandalone && !bannerDismissed) {
      if (checkIOS) {
        setTimeout(() => {
          setShowInstallBanner(true);
        }, 3000);
      }
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (checkMobile && !checkIOS) {
      setTimeout(() => {
        if (!deferredPrompt && !isStandalone && !bannerDismissed) {
          setShowInstallBanner(true);
        }
      }, 5000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setShowInstallBanner(false);
          localStorage.setItem('install-banner-dismissed', 'true');
        }
      } catch (error) {
        console.error('Error installing app:', error);
      }
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('install-banner-dismissed', 'true');
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-24 md:bottom-8 left-4 right-4 md:left-auto md:right-8 z-50 md:max-w-sm">
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-2xl p-4 backdrop-blur-xl border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">📱</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-lg mb-1">
              Instalar Orbikut
            </h3>
            <p className="text-white/80 text-sm mb-3">
              {isIOS 
                ? "Adicione à tela inicial para acesso rápido!"
                : "Baixe o app e tenha acesso rápido sempre que quiser!"
              }
            </p>
            
            {isIOS ? (
              <div className="bg-white/20 rounded-xl p-3 mb-3 text-white text-xs">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <Share className="w-4 h-4" />
                  Como instalar:
                </p>
                <ol className="space-y-1 pl-4 list-decimal">
                  <li>Toque no ícone de compartilhar no Safari</li>
                  <li>Role e toque em "Adicionar à Tela Inicial"</li>
                  <li>Toque em "Adicionar"</li>
                </ol>
              </div>
            ) : null}

            <div className="flex gap-2">
              {deferredPrompt ? (
                <Button
                  onClick={handleInstallClick}
                  className="bg-white text-purple-600 hover:bg-white/90 rounded-xl font-semibold"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Instalar
                </Button>
              ) : (
                !isIOS && (
                  <Button
                    onClick={handleDismiss}
                    className="bg-white text-purple-600 hover:bg-white/90 rounded-xl font-semibold"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Entendi
                  </Button>
                )
              )}
              <Button
                onClick={handleDismiss}
                variant="ghost"
                className="text-white hover:bg-white/20 rounded-xl"
                size="sm"
              >
                {isIOS ? "Fechar" : "Agora não"}
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}