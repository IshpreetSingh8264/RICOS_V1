import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import FloatingSOSButton from '@/components/FloatingSOSButton';
import {
  Menu,
  X,
  Map,
  Home,
  LogOut,
  Users,
  Package,
  AlertTriangle,
  Heart,
  FileText,
  Bell,
  ChevronRight,
  Navigation,
  Newspaper,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Role badge colours
const ROLE_COLORS: Record<string, string> = {
  ngo: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  govt: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  volunteer: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  group: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  user: 'bg-slate-700 text-slate-400 border-slate-600',
};

const ROLE_LABELS: Record<string, string> = {
  ngo: 'NGO',
  govt: 'Government',
  volunteer: 'Volunteer',
  group: 'Field Team',
  user: 'Citizen',
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarItems = useMemo(() => {
    const type = user?.userType || user?.accountType;

    if (type === 'ngo' || type === 'volunteer') {
      return [
        { icon: Home, label: 'Dashboard', path: '/dashboard' },
        { icon: Map, label: 'Live Map', path: '/map' },
        { icon: AlertTriangle, label: 'Disasters', path: '/incidents' },
        { icon: Bell, label: 'SOS Reports', path: '/dashboard/sos-reports' },
        { icon: Users, label: 'Field Teams', path: '/groups' },
        { icon: Package, label: 'Inventory', path: '/inventory' },
        { icon: Heart, label: 'Donations', path: '/dashboard/donations' },
      ];
    }

    if (type === 'govt') {
      return [
        { icon: Home, label: 'Dashboard', path: '/dashboard' },
        { icon: Map, label: 'Live Map', path: '/map' },
        { icon: AlertTriangle, label: 'Disasters', path: '/incidents' },
        { icon: Bell, label: 'SOS Reports', path: '/dashboard/sos-reports' },
        { icon: Users, label: 'Field Teams', path: '/groups' },
        { icon: Heart, label: 'Donations', path: '/dashboard/donations' },
      ];
    }

    if (type === 'group') {
      return [
        { icon: Navigation, label: 'My Mission', path: '/dashboard/team' },
        { icon: Map, label: 'Live Map', path: '/map' },
      ];
    }

    // regular user
    return [
      { icon: Home, label: 'Dashboard', path: '/dashboard' },
      { icon: Map, label: 'Live Map', path: '/map' },
      { icon: Newspaper, label: 'News', path: '/news' },
      { icon: Heart, label: 'Donate', path: '/user/donate' },
      { icon: FileText, label: 'My Reports', path: '/user/my-reports' },
    ];
  }, [user]);

  // Breadcrumb — derive from current path
  const breadcrumbs = useMemo(() => {
    const crumbs: { label: string; path?: string }[] = [{ label: 'RICOS', path: '/' }];
    const matched = sidebarItems.find((i) => i.path === location.pathname);
    if (matched) {
      crumbs.push({ label: matched.label });
    } else {
      // Fallback: humanise last path segment
      const segment = location.pathname.split('/').filter(Boolean).pop() ?? '';
      if (segment) crumbs.push({ label: segment.replace(/-/g, ' ') });
    }
    return crumbs;
  }, [location.pathname, sidebarItems]);

  const roleType = (user?.userType || user?.accountType || 'user') as string;
  const roleColor = ROLE_COLORS[roleType] ?? ROLE_COLORS.user;
  const roleLabel = ROLE_LABELS[roleType] ?? roleType;
  const avatarInitial = (user?.name || user?.email || 'U')[0].toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-800 transition-all duration-300 z-40 flex flex-col ${
          sidebarOpen ? 'w-60' : 'w-[4.5rem] -translate-x-full lg:translate-x-0'
        } lg:translate-x-0`}
      >
        {/* Logo + toggle */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800 flex-shrink-0">
          {sidebarOpen ? (
            <img src="/images/logo.svg" alt="RICOS" className="w-16 h-16" />
          ) : (
            <img src="/images/logo.svg" alt="RICOS" className="w-12 h-12 mx-auto" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-primary" />
                )}
                <Icon size={18} className={isActive ? 'text-primary' : 'text-current'} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User pill */}
        <div className="flex-shrink-0 border-t border-slate-800 p-3">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                  {avatarInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.name || user?.email}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${roleColor}`}
                >
                  {roleLabel}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <LogOut size={13} className="mr-1" />
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors flex justify-center"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-60' : 'lg:ml-[4.5rem]'
        } flex flex-col h-screen`}
      >
        {/* Top bar */}
        <header className="flex-shrink-0 bg-slate-900/80 backdrop-blur border-b border-slate-800">
          <div className="flex items-center justify-between px-5 py-3">
            {/* Left: mobile menu + breadcrumbs */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <Menu size={18} />
              </button>

              {/* Breadcrumbs */}
              <nav className="flex items-center gap-1 text-sm">
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight size={13} className="text-slate-600" />}
                    {crumb.path && i < breadcrumbs.length - 1 ? (
                      <button
                        onClick={() => navigate(crumb.path!)}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span className={i === breadcrumbs.length - 1 ? 'text-white font-medium' : 'text-slate-400'}>
                        {crumb.label}
                      </span>
                    )}
                  </span>
                ))}
              </nav>
            </div>

            {/* Right: welcome */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400 hidden sm:inline">
                Welcome,{' '}
                <span className="text-white font-semibold">
                  {user?.name || user?.email || 'User'}
                </span>
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      <FloatingSOSButton />
    </div>
  );
};

export default DashboardLayout;
