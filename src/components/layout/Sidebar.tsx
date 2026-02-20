import {
    LayoutDashboard,
    Zap,
    BookOpen,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    CheckSquare,
    Calendar,
    BarChart3,
    Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/', roles: ['admin', 'editor', 'sales'] },
    { icon: Target, label: 'Pipeline', href: '/pipeline', roles: ['admin', 'sales'] },
    { icon: Users, label: 'Equipe', href: '/team', roles: ['admin'] },
    { icon: Zap, label: 'Operações', href: '/operations', roles: ['admin', 'editor'] },
    { icon: CheckSquare, label: 'Aprovações', href: '/approvals', roles: ['admin', 'editor'] },
    { icon: Calendar, label: 'Reuniões EOS', href: '/meetings', roles: ['admin', 'editor'] },
    { icon: BarChart3, label: 'Relatórios', href: '/reports', roles: ['admin'] },
    { icon: BookOpen, label: 'Processos', href: '/processes', roles: ['admin', 'editor', 'sales'] },
    { icon: Users, label: 'Clientes', href: '/clients', roles: ['admin', 'editor', 'sales'] },
];

const viewerNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Meu Portal', href: '/portal' },
];

export function Sidebar() {
    const location = useLocation();
    const { role, profile, logout, isViewer } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const navItems = isViewer ? viewerNavItems : mainNavItems;
    const filteredItems = navItems.filter(
        (item) => !item.roles || item.roles.includes(role)
    );

    const sidebarContent = (
        <div
            className={cn(
                'flex h-full flex-col border-r border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-300',
                collapsed ? 'w-[72px]' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
                {!collapsed && (
                    <h1 className="text-lg font-bold gradient-text">Agência Turbo</h1>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors lg:block"
                >
                    <ChevronLeft
                        className={cn(
                            'h-4 w-4 transition-transform duration-300',
                            collapsed && 'rotate-180'
                        )}
                    />
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-3">
                    {filteredItems.map((item) => {
                        const isActive =
                            item.href === '/'
                                ? location.pathname === '/'
                                : location.pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        'h-5 w-5 flex-shrink-0 transition-colors',
                                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                                    )}
                                />
                                {!collapsed && (
                                    <span className="truncate">{item.label}</span>
                                )}
                                {!collapsed && item.badge && item.badge > 0 && (
                                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Footer */}
            <div className="border-t border-border/50 p-3">
                <Link
                    to="/settings"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                    <Settings className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>Configurações</span>}
                </Link>
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>Sair</span>}
                </button>

                {!collapsed && profile && (
                    <div className="mt-3 flex items-center gap-3 rounded-xl bg-accent/50 px-3 py-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-xs font-bold text-white">
                            {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 truncate">
                            <p className="text-xs font-medium text-foreground truncate">
                                {profile.full_name}
                            </p>
                            <p className="text-[10px] text-muted-foreground capitalize">
                                {role}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed left-4 top-4 z-50 rounded-xl bg-card/80 p-2 shadow-lg backdrop-blur-xl border border-border/50 lg:hidden"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile sidebar */}
            <div
                className={cn(
                    'fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="relative">
                    {sidebarContent}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="absolute right-2 top-4 rounded-lg p-1 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:block">{sidebarContent}</div>
        </>
    );
}
