import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Usuario {
  id: number;
  username: string;
  nombre: string;
  unidad_organica: string;
  cargo: string;
  rol: string;
  estado: number;
  created_at?: string;
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    nombre: "",
    unidad_organica: "",
    cargo: "",
    rol: "registrar",
  });

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/usuarios");
      if (!res.ok) throw new Error("Error al cargar usuarios");
      const data = await res.json();
      setUsuarios(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const filtered = usuarios.filter((u) => {
    const q = query.toLowerCase();
    return (
      u.nombre?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.unidad_organica?.toLowerCase().includes(q) ||
      u.cargo?.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async () => {
    if (!formData.username || !formData.nombre) return;

    try {
      const url = editingUser ? `/api/usuarios/${editingUser.id}` : "/api/usuarios";
      const method = editingUser ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al guardar usuario");
      }

      setOpen(false);
      setEditingUser(null);
      setFormData({
        username: "",
        password: "",
        nombre: "",
        unidad_organica: "",
        cargo: "",
        rol: "registrar",
      });
      await fetchUsuarios();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    try {
      const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      await fetchUsuarios();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEdit = (user: Usuario) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "",
      nombre: user.nombre,
      unidad_organica: user.unidad_organica || "",
      cargo: user.cargo || "",
      rol: user.rol || "registrar",
    });
    setOpen(true);
  };

  const openCreate = () => {
    setEditingUser(null);
    setFormData({
      username: "",
      password: "",
      nombre: "",
      unidad_organica: "",
      cargo: "",
      rol: "registrar",
    });
    setOpen(true);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestión de usuarios del sistema
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>Nuevo Usuario</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              </DialogTitle>
              <DialogDescription>
                Completa los datos del usuario
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, username: e.target.value }))
                  }
                  disabled={!!editingUser}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, nombre: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unidad">Unidad Orgánica</Label>
                <Input
                  id="unidad"
                  value={formData.unidad_organica}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, unidad_organica: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={formData.cargo}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, cargo: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rol">Rol</Label>
                  <select
                    id="rol"
                    value={formData.rol}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, rol: e.target.value }))
                    }
                    className="border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="admin">Administrador</option>
                    <option value="registrar">Registrador</option>
                    <option value="viewer">Visualizador</option>
                  </select>
                </div>
              </div>
              {!editingUser && (
                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, password: e.target.value }))
                    }
                  />
                </div>
              )}
              {editingUser && (
                <div className="grid gap-2">
                  <Label htmlFor="password">
                    Nueva Contraseña (dejar vacío para no cambiar)
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, password: e.target.value }))
                    }
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Usuarios ({usuarios.length})</CardTitle>
            <Input
              className="w-64"
              placeholder="Buscar usuario..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground py-6">
              Cargando usuarios...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6">
              No hay usuarios registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium">Usuario</th>
                    <th className="text-left py-3 px-4 font-medium">Unidad Orgánica</th>
                    <th className="text-left py-3 px-4 font-medium">Cargo</th>
                    <th className="text-left py-3 px-4 font-medium">Rol</th>
                    <th className="text-right py-3 px-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{u.nombre}</td>
                      <td className="py-3 px-4 text-muted-foreground">{u.username}</td>
                      <td className="py-3 px-4">{u.unidad_organica || "-"}</td>
                      <td className="py-3 px-4">{u.cargo || "-"}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            u.rol === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : u.rol === "registrar"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {u.rol}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(u)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(u.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
