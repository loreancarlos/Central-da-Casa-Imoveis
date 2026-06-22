import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Home, Target } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/imoveis", label: "Imóveis", icon: Home },
    { href: "/matches", label: "Matches", icon: Target },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      <aside className="w-full md:w-64 bg-sidebar border-r border-sidebar-border shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-bold text-sidebar-foreground tracking-tight">Central da Casa</h1>
          <p className="text-xs text-sidebar-foreground/60 uppercase tracking-widest mt-1 font-semibold">Property Finder</p>
        </div>
        <nav className="flex flex-col gap-1 px-4">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-sm font-medium ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
