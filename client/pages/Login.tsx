import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { ShieldCheck, Lock, User as UserIcon, Settings, Globe, Save, X } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Login() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const nav = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Configuración de URL dinámica
  const [customUrl, setCustomUrl] = useState(localStorage.getItem("custom_api_url") || "");
  const [showConfig, setShowConfig] = useState(false);

  const saveUrl = () => {
    if (customUrl) {
      localStorage.setItem("custom_api_url", customUrl.trim());
      window.location.reload();
    } else {
      localStorage.removeItem("custom_api_url");
      window.location.reload();
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      nav("/");
    }
  }, [isAuthenticated, nav]);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(username.trim(), password);
      nav("/");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Botón de configuración flotante */}
      <div className="absolute top-6 right-6 z-50">
        <Dialog open={showConfig} onOpenChange={setShowConfig}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white bg-slate-900/50 rounded-full w-12 h-12">
              <Settings size={24} />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe className="text-blue-500" />
                Configurar Servidor
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">

              <p className="text-sm text-slate-400">
                Si el servidor cambió de dirección (IP Local o ngrok), actualízala aquí para conectar el app.
              </p>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">URL del Servidor</label>
                <Input 
                  placeholder="https://tu-url.ngrok-free.app"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-blue-400 font-mono"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={saveUrl} className="w-full bg-blue-600 hover:bg-blue-500 font-bold gap-2">
                <Save size={18} /> Guardar y Reiniciar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/30 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white shadow-lg shadow-blue-500/10 mb-2 rotate-3 hover:rotate-0 transition-transform duration-300 overflow-hidden p-2">
            <img src="/logo.png" alt="Logo SBH" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">
              SBH <span className="text-blue-500">Huancayo</span>
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Gestión de activos inteligente</p>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Usuario
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <UserIcon size={18} />
                </div>
                <Input
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-950/50 border-slate-800 pl-10 h-12 text-white placeholder:text-slate-600 focus-visible:ring-blue-500/50 transition-all rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={18} />
                </div>
                <Input
                  placeholder="••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-950/50 border-slate-800 pl-10 h-12 text-white placeholder:text-slate-600 focus-visible:ring-blue-500/50 transition-all rounded-xl"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <ShieldCheck className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                "Acceder al Sistema"
              )}
            </Button>
          </form>

        </div>

        <p className="text-center text-slate-600 text-xs font-medium">
          &copy; {new Date().getFullYear()} QR Inventario &bull; Sistema Seguro
        </p>
      </div>
    </div>
  );
}
