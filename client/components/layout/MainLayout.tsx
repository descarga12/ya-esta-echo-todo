import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Home, FileText, Users, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

function Brand() {
  return (
    <div className="inline-flex items-center gap-2">
      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-md flex items-center justify-center">
        <span className="text-white font-bold text-sm">QR</span>
      </div>
      <span className="font-bold tracking-tight text-lg hidden sm:inline">
        QR Inventario
      </span>
    </div>
  );
}

function NavItem({
  to,
  icon: Icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const active = location.pathname === to;
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-blue-600 text-white"
          : "text-slate-400 hover:text-slate-300 hover:bg-slate-700/50"
      )}
    >
      {Icon}
      <span className="hidden sm:inline">{children}</span>
    </button>
  );
}

export default function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between gap-4">
          <Brand />

          {/* Nav */}
          <nav className="flex items-center gap-1 flex-1 ml-8">
            <NavItem to="/" icon={<Home size={18} />}>
              Inicio
            </NavItem>
            <NavItem to="/reportes" icon={<FileText size={18} />}>
              Reportes
            </NavItem>
            {user?.rol === "admin" && (
              <NavItem to="/users" icon={<Users size={18} />}>
                Usuarios
              </NavItem>
            )}
          </nav>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-slate-300 hover:text-white"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold">
                    {user.nombre?.charAt(0) || "U"}
                  </div>
                  <span className="hidden sm:inline text-sm">
                    {user.nombre || user.username}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-slate-800 border-slate-700"
              >
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-white">{user.nombre}</p>
                  <p className="text-xs text-slate-400">@{user.username}</p>
                  <p className="text-xs text-slate-500 mt-1 capitalize">
                    Rol: {user.rol}
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem
                  onClick={() => window.location.href = "/account"}
                  className="cursor-pointer text-slate-300 hover:text-white focus:bg-slate-700"
                >
                  <User size={16} className="mr-2" />
                  Mi cuenta
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-400 hover:text-red-300 focus:bg-red-900/20"
                >
                  <LogOut size={16} className="mr-2" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} QR Inventario. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
