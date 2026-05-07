import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE_URL, getApiHeaders } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users as UsersIcon, 
  Key, 
  UserPlus, 
  Shield, 
  Trash2, 
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";

interface DBUser {
  id: number;
  username: string;
  nombre: string;
  cargo: string;
  rol: string;
  estado: number;
  unidad_organica: string;
}

export default function Users() {
  const { user: currentUserSession, isAdmin } = useAuth();
  const [users, setUsers] = useState<DBUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<DBUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Redirigir si no es admin
  if (!isAdmin) return <Navigate to="/" />;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/usuarios`, {
        headers: getApiHeaders()
      });
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) return;
    
    setIsChangingPass(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/usuarios/password`, {
        method: 'PUT',
        headers: { 
          ...getApiHeaders(),
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ id: selectedUser.id, newPassword })
      });
      
      if (res.ok) {
        setMsg({ type: 'success', text: `Contraseña de @${selectedUser.username} actualizada.` });
        setNewPassword("");
        setSelectedUser(null);
      } else {
        setMsg({ type: 'error', text: 'Error al cambiar la contraseña.' });
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/usuarios/${id}`, {
        method: "DELETE",
        headers: getApiHeaders()
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-20">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link to="/" className="flex items-center text-slate-500 hover:text-white transition-colors text-sm mb-2 group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Volver al Inventario
            </Link>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <UsersIcon className="w-10 h-10 text-blue-500" />
              Gestión de Usuarios
            </h1>
            <p className="text-slate-500 font-medium">Panel administrativo para control de accesos y seguridad</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <Input 
                placeholder="Buscar personal..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-900 border-slate-800 rounded-2xl pl-11 h-12 w-full md:w-64 focus-visible:ring-blue-500/50"
              />
            </div>
            <Button className="bg-blue-600 hover:bg-blue-500 h-12 rounded-2xl px-6 font-bold">
              <UserPlus className="w-4 h-4 mr-2" /> Nuevo Usuario
            </Button>
          </div>
        </div>

        {/* Mensajes de feedback */}
        {msg && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 border animate-in fade-in slide-in-from-top-4 duration-300 ${
            msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-bold uppercase tracking-wider">{msg.text}</span>
            <button onClick={() => setMsg(null)} className="ml-auto hover:opacity-70">✕</button>
          </div>
        )}

        {/* Tabla de Usuarios */}
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-3xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800">
                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest">Personal</th>
                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest">Usuario</th>
                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest">Rol / Cargo</th>
                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest">Estado</th>
                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center text-slate-500 animate-pulse">Cargando base de datos de personal...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-slate-500">No se encontraron usuarios</td></tr>
              ) : filteredUsers.map(u => (
                <tr key={u.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-blue-900/20">
                        {u.nombre.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200">{u.nombre}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-tighter font-black">{u.unidad_organica}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="text-sm font-mono text-blue-400 bg-blue-400/10 px-2 py-1 rounded-lg">@{u.username}</span>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-black uppercase tracking-widest mb-1 px-2 py-0.5 rounded-full w-fit ${
                        u.rol?.toUpperCase() === 'ADMINISTRADOR' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {u.rol || 'USUARIO'}
                      </span>
                      <span className="text-xs text-slate-400">{u.cargo}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${u.estado === 1 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                      <span className="text-[10px] font-bold uppercase text-slate-400">{u.estado === 1 ? 'Activo' : 'Inactivo'}</span>
                    </div>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedUser(u)}
                            className="h-9 px-3 rounded-xl bg-slate-800/50 hover:bg-amber-500/10 hover:text-amber-500 transition-all gap-2"
                          >
                            <Key className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Pass</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-3xl max-w-sm">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Cambiar Contraseña</DialogTitle>
                            <DialogDescription className="text-slate-500">
                              Actualizar credenciales para @{u.username}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nueva Contraseña</Label>
                              <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                <Input 
                                  type="password"
                                  placeholder="••••••••"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  className="bg-slate-950 border-slate-800 rounded-xl h-12 pl-11 focus-visible:ring-blue-500/50"
                                />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              onClick={handleChangePassword}
                              disabled={!newPassword || isChangingPass}
                              className="w-full bg-blue-600 hover:bg-blue-500 h-12 font-black rounded-xl"
                            >
                              {isChangingPass ? "Actualizando..." : "Guardar Cambios"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(u.id)}
                        className="h-9 w-9 rounded-xl text-slate-600 hover:text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
