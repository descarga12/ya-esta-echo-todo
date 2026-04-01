import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut } from "lucide-react";

export default function Account() {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg text-slate-400">No autenticado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Mi Cuenta</h1>
          <p className="text-slate-400">Información de tu perfil</p>
        </div>

        {/* Profile Card */}
        <Card className="bg-slate-800 border-slate-700 p-8 mb-8">
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-700">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <div className="text-3xl font-bold">{user.nombre?.charAt(0) || "U"}</div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.nombre || "Usuario"}</h2>
              <p className="text-slate-400">@{user.username}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-sm text-slate-400 mb-1">Rol</p>
              <p className="text-lg font-semibold capitalize">
                <span className="inline-block bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                  {user.rol || "Sin rol"}
                </span>
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-1">Usuario</p>
              <p className="text-lg font-mono bg-slate-700 px-3 py-2 rounded">
                {user.username}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-1">Unidad Orgánica</p>
              <p className="text-lg">
                {user.unidad_organica || "No especificada"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-1">Cargo</p>
              <p className="text-lg">
                {user.cargo || "No especificado"}
              </p>
            </div>
          </div>

          {/* Created At */}
          {user.created_at && (
            <div className="text-sm text-slate-500 mb-8">
              Miembro desde{" "}
              {new Date(user.created_at).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}

          {/* Logout Button */}
          <Button
            onClick={logout}
            variant="destructive"
            className="w-full gap-2"
          >
            <LogOut size={18} />
            Cerrar sesión
          </Button>
        </Card>

        {/* Info Box */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <p className="text-sm text-slate-400">
            ℹ️ Para cambiar tus datos de perfil, contacta a un administrador.
          </p>
        </Card>
      </div>
    </div>
  );
}
