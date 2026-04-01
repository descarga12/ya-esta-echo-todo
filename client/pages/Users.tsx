import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit2, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Usuario {
  id: number;
  username: string;
  nombre: string;
  unidad_organica: string;
  cargo: string;
  rol: string;
  estado: number;
}

export default function Users() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    nombre: "",
    unidad_organica: "",
    cargo: "",
    rol: "registrar",
  });
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.rol === "admin";

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/usuarios");
      if (!response.ok) throw new Error("Error al cargar usuarios");
      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      username: "",
      password: "",
      nombre: "",
      unidad_organica: "",
      cargo: "",
      rol: "registrar",
    });
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  const handleEdit = (u: Usuario) => {
    setForm({
      username: u.username,
      password: "",
      nombre: u.nombre,
      unidad_organica: u.unidad_organica,
      cargo: u.cargo,
      rol: u.rol,
    });
    setEditingId(u.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar usuario");
      }

      toast({
        title: "Éxito",
        description: "Usuario eliminado correctamente",
      });
      setDeleteId(null);
      loadUsers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const submit = async (e: any) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (!form.username || !form.nombre) {
        setError("Usuario y nombre son requeridos");
        return;
      }

      if (editingId) {
        // Actualizar usuario
        const response = await fetch(`/api/usuarios/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: form.username.trim(),
            password: form.password || undefined,
            nombre: form.nombre,
            unidad_organica: form.unidad_organica,
            cargo: form.cargo,
            rol: form.rol,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Error al actualizar usuario");
        }

        toast({
          title: "Éxito",
          description: "Usuario actualizado correctamente",
        });
      } else {
        // Crear usuario
        if (!form.password) {
          setError("Contraseña es requerida para nuevos usuarios");
          return;
        }

        const response = await fetch("/api/usuarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: form.username.trim(),
            password: form.password,
            nombre: form.nombre,
            unidad_organica: form.unidad_organica,
            cargo: form.cargo,
            rol: form.rol,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Error al crear usuario");
        }

        toast({
          title: "Éxito",
          description: "Usuario creado correctamente",
        });
      }

      resetForm();
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Error al guardar usuario");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Acceso denegado</h2>
          <p className="text-slate-400">
            Solo los administradores pueden gestionar usuarios
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Gestión de usuarios</h1>
            <p className="text-slate-400 mt-1">
              Crea usuarios que podrán registrar artículos
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Plus size={18} />
            Crear usuario
          </Button>
        </div>

        {/* Form Card */}
        {showForm && (
          <Card className="bg-slate-800 border-slate-700 p-8">
            <h2 className="text-2xl font-bold mb-6">
              {editingId ? "Editar usuario" : "Crear nuevo usuario"}
            </h2>

            <form onSubmit={submit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Usuario
                  </label>
                  <Input
                    placeholder="usuario"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    disabled={loading}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nombre completo
                  </label>
                  <Input
                    placeholder="Nombre"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    disabled={loading}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Contraseña{editingId && " (dejar en blanco para no cambiar)"}
                  </label>
                  <Input
                    placeholder="Contraseña"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    disabled={loading}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Unidad orgánica
                  </label>
                  <Input
                    placeholder="Unidad orgánica"
                    value={form.unidad_organica}
                    onChange={(e) =>
                      setForm({ ...form, unidad_organica: e.target.value })
                    }
                    disabled={loading}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cargo
                  </label>
                  <Input
                    placeholder="Cargo"
                    value={form.cargo}
                    onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                    disabled={loading}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Rol</label>
                  <select
                    value={form.rol}
                    onChange={(e) => setForm({ ...form, rol: e.target.value })}
                    disabled={loading}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white"
                  >
                    <option value="registrar">Registrar (puede agregar artículos)</option>
                    <option value="viewer">Visualizador (solo ver)</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Guardando..." : "Guardar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={loading}
                  className="border-slate-600 hover:bg-slate-700"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Users Table */}
        <Card className="bg-slate-800 border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold">Usuarios registrados</h2>
          </div>

          {loading && !users.length ? (
            <div className="p-8 text-center text-slate-400">
              Cargando usuarios...
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-400 mb-2">Error al cargar usuarios:</p>
              <p className="text-slate-400 text-sm">{error}</p>
              <Button onClick={loadUsers} variant="outline" className="mt-4 border-slate-600">
                Reintentar
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No hay usuarios registrados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Descripción del Bien
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Unidad Orgánica
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Cargo
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-700/30">
                      <td className="px-6 py-4">
                        <span className="font-mono bg-slate-700 px-2 py-1 rounded">
                          @{u.username}
                        </span>
                      </td>
                      <td className="px-6 py-4">{u.nombre}</td>
                      <td className="px-6 py-4 text-slate-400">
                        {u.unidad_organica || "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {u.cargo || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block capitalize bg-slate-700 px-3 py-1 rounded-full text-sm">
                          {u.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(u)}
                            className="hover:bg-slate-700"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteId(u.id)}
                            className="text-red-400 hover:bg-red-900/20"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel className="border-slate-600 hover:bg-slate-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

