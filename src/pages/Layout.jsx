
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Compass, Bell, User, Plus, Flame } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import GlobalMusicPlayer from "@/components/GlobalMusicPlayer";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['unread-notifications', user?.email],
    queryFn: () => user ? base44.entities.Notification.filter({ user_email: user.email, read: false }) : [],
    enabled: !!user,
    refetchInterval: 10000,
    initialData: []
  });

  const navItems = [
    { name: "Feed", url: createPageUrl("Feed"), icon: Home },
    { name: "Explorar", url: createPageUrl("Explore"), icon: Compass },
    { name: "Criar", url: createPageUrl("CreatePost"), icon: Plus },
    { name: "Notificações", url: createPageUrl("Notifications"), icon: Bell, badge: unreadNotifications.length },
    { name: "Perfil", url: createPageUrl("Profile"), icon: User }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 overflow-x-hidden">
      <style>{`
        :root {
          --primary: 270 70% 60%;
          --primary-glow: rgba(168, 85, 247, 0.4);
          --secondary: 330 70% 60%;
          --accent: 30 90% 60%;
        }
        
        * {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #a855f7;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9333ea;
        }
      `}</style>

      {/* Header - Desktop */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl("Feed")} className="flex items-center gap-2 group">
              <div className="bg-pink-500 rounded-xl w-10 h-10 from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all duration-300">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <span className="bg-clip-text text-pink-500 text-2xl font-bold capitalize from-purple-600 to-pink-600">Orbikut</span>
            </Link>

            {user && (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold text-purple-900">Nível {user.level || 1}</span>
                  <span className="text-sm text-purple-600">{user.points || 0} pts</span>
                </div>
                <GlobalMusicPlayer />
                <Link to={createPageUrl("Profile")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold shadow-lg">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      user.full_name?.[0]?.toUpperCase()
                    )}
                  </div>
                  <span className="font-medium text-gray-900">{user.full_name}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link to={createPageUrl("Feed")} className="flex items-center gap-2">
            <div className="bg-pink-500 rounded-lg w-8 h-8 from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="bg-clip-text text-pink-500 text-xl font-bold text-left capitalize from-purple-600 to-pink-600">Orbikut</span>
          </Link>
          {user && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                <Flame className="w-3 h-3 text-orange-500" />
                <span className="text-sm font-semibold text-purple-900">Nv {user.level || 1}</span>
              </div>
              <GlobalMusicPlayer />
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 md:pt-20 pb-20 md:pb-8">
        {children}
      </main>

      {/* Bottom Navigation - Mobile - CORRIGIDO: Todos ícones alinhados */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-purple-100">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.url;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.url}
                className={`flex flex-col items-center justify-center transition-all duration-300 relative ${
                  isActive ? "text-purple-600" : "text-gray-400 hover:text-purple-500"
                }`}
              >
                {item.name === "Criar" ? (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <div className="relative">
                    <Icon className={`w-6 h-6 ${isActive ? "scale-110" : ""} transition-transform`} />
                    {item.badge > 0 && (
                      <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center bg-gradient-to-br from-pink-500 to-red-500 border-2 border-white text-[10px]">
                        {item.badge > 9 ? '9+' : item.badge}
                      </Badge>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Navigation - Com nomes */}
      <nav className="hidden md:block fixed top-20 left-0 bottom-0 w-64 p-6">
        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.url;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.url}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative ${
                  isActive
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                    : "text-gray-700 hover:bg-purple-50"
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="font-medium">{item.name}</span>
                {item.badge > 0 && (
                  <Badge className="ml-auto bg-gradient-to-br from-pink-500 to-red-500 border-0">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
