import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast, Toaster } from "sonner";
import { Plus, Download, LogOut, Users, FileText, Trash2, Copy, CalendarDays, CheckCircle2, Clock, UserPlus, Shield, ShieldCheck, Pencil, ClipboardList } from "lucide-react";
import { getClients, createClient, deleteClient, getAllSubmissions, getSubmissionById, updateSubmissionFields } from "@/server/admin.functions";
import { getMyRole, listAdmins, createAdminUser, updateAdminPermissions, deleteAdminUser } from "@/server/admin-management.functions";
import { ExpedienteEditor } from "@/components/ExpedienteEditor";
import { ExpedienteSheet } from "@/components/ExpedienteSheet";
import logoUvie from "@/assets/logo-uvie.jpeg";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type AdminInfo = Awaited<ReturnType<typeof listAdmins>>[number];

function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"dashboard" | "clients" | "submissions" | "admins" | "expediente">("dashboard");
  const [clients, setClients] = useState<Awaited<ReturnType<typeof getClients>> | null>(null);
  const [submissions, setSubmissions] = useState<Awaited<ReturnType<typeof getAllSubmissions>> | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());

  // Role state
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [myPermissions, setMyPermissions] = useState<Record<string, boolean> | null>(null);

  // New client form
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newPass, setNewPass] = useState("");
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Admin management
  const [admins, setAdmins] = useState<AdminInfo[]>([]);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState<AdminInfo | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({
    email: "", password: "", displayName: "",
    canManageClients: true, canViewSubmissions: true,
    canDownloadSubmissions: false, canDeleteClients: false,
  });
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Expediente editor
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Record<string, unknown> | null>(null);
  const [loadingExpediente, setLoadingExpediente] = useState(false);

  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("No session");
    return { headers: { Authorization: `Bearer ${session.access_token}` } };
  }, []);

  const loadData = useCallback(async () => {
    try {
      const auth = await getAuthHeaders();
      const [c, s, roleInfo] = await Promise.all([
        getClients(auth),
        getAllSubmissions(auth),
        getMyRole(auth),
      ]);
      setClients(c);
      setSubmissions(s);
      setIsSuperAdmin(roleInfo.isSuperAdmin);
      if (roleInfo.permissions) {
        setMyPermissions({
          can_manage_clients: roleInfo.permissions.can_manage_clients ?? false,
          can_view_submissions: roleInfo.permissions.can_view_submissions ?? false,
          can_download_submissions: roleInfo.permissions.can_download_submissions ?? false,
          can_delete_clients: roleInfo.permissions.can_delete_clients ?? false,
        });
      } else if (roleInfo.isSuperAdmin) {
        setMyPermissions(null); // super admin has all perms
      }
    } catch {
      toast.error("Error cargando datos. Verifica que tienes permisos de administrador.");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const loadAdmins = useCallback(async () => {
    try {
      const auth = await getAuthHeaders();
      const data = await listAdmins(auth);
      setAdmins(data);
    } catch {
      // not super admin, ignore
    }
  }, [getAuthHeaders]);

  const loadExpediente = useCallback(async (subId: string) => {
    setLoadingExpediente(true);
    try {
      const auth = await getAuthHeaders();
      const sub = await getSubmissionById({ ...auth, data: { id: subId } });
      setSelectedSubmission(sub as Record<string, unknown>);
    } catch {
      toast.error("Error cargando expediente");
    } finally {
      setLoadingExpediente(false);
    }
  }, [getAuthHeaders]);

  const saveExpedienteField = useCallback(async (id: string, field: string, value: unknown) => {
    const auth = await getAuthHeaders();
    await updateSubmissionFields({ ...auth, data: { id, fields: { [field]: value } } });
    // Update sheet row in main submissions list too
    setSubmissions((prev) => {
      if (!Array.isArray(prev)) return prev;
      return prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)) as typeof prev;
    });
    toast.success("Guardado", { duration: 1200 });
  }, [getAuthHeaders]);

  useEffect(() => {
    if (selectedSubmissionId) loadExpediente(selectedSubmissionId);
  }, [selectedSubmissionId, loadExpediente]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate({ to: "/" });
      else loadData();
    });
  }, [navigate, loadData]);

  useEffect(() => {
    if (isSuperAdmin && tab === "admins") loadAdmins();
  }, [isSuperAdmin, tab, loadAdmins]);

  const clientList = useMemo(() => (Array.isArray(clients) ? clients : []), [clients]);
  const submissionList = useMemo(() => (Array.isArray(submissions) ? submissions : []), [submissions]);

  const hasPerm = (perm: string) => isSuperAdmin || myPermissions?.[perm] === true;

  // Stats
  const stats = useMemo(() => {
    const totalClients = clientList.length;
    const totalSubmissions = submissionList.length;
    const submitted = submissionList.filter(s => s.status === "submitted").length;
    const drafts = submissionList.filter(s => s.status === "draft").length;
    const clientsWithSubmission = new Set(submissionList.map(s => s.client_access_id)).size;
    const clientsWithoutForm = totalClients - clientsWithSubmission;
    return { totalClients, totalSubmissions, submitted, drafts, clientsWithoutForm };
  }, [clientList, submissionList]);

  const submissionDates = useMemo(() => {
    return submissionList
      .filter(s => s.submitted_at)
      .map(s => new Date(s.submitted_at!));
  }, [submissionList]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCode || !newPass) return;
    setCreating(true);
    try {
      const auth = await getAuthHeaders();
      await createClient({ ...auth, data: { clientName: newName, accessCode: newCode, accessPassword: newPass } });
      toast.success("Cliente creado");
      setDialogOpen(false);
      setNewName(""); setNewCode(""); setNewPass("");
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al crear cliente");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este cliente y todos sus datos?")) return;
    try {
      const auth = await getAuthHeaders();
      await deleteClient({ ...auth, data: { id } });
      toast.success("Cliente eliminado");
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/?code=${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Liga copiada al portapapeles");
  };

  const handleDownloadExcel = async (submissionId: string) => {
    try {
      const auth = await getAuthHeaders();
      const sub = await getSubmissionById({ ...auth, data: { id: submissionId } });
      if (!sub) { toast.error("No se encontró la información"); return; }
      const fields = Object.entries(sub)
        .filter(([k]) => !["id", "client_access_id", "created_at", "updated_at", "client_access"].includes(k));
      const headers = fields.map(([k]) => k);
      const values = fields.map(([, v]) => {
        if (v === null) return "";
        if (typeof v === "object") return JSON.stringify(v);
        return String(v);
      });
      const csv = [headers.join(","), values.map(v => `"${v.replace(/"/g, '""')}"`).join(",")].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sediver_${(sub as Record<string, unknown>).expediente || submissionId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Archivo descargado");
    } catch {
      toast.error("Error al descargar");
    }
  };

  // Admin management handlers
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAdmin(true);
    try {
      const auth = await getAuthHeaders();
      await createAdminUser({ ...auth, data: adminForm });
      toast.success("Administrador creado exitosamente");
      setAdminDialogOpen(false);
      setAdminForm({ email: "", password: "", displayName: "", canManageClients: true, canViewSubmissions: true, canDownloadSubmissions: false, canDeleteClients: false });
      loadAdmins();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al crear administrador");
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!editAdmin) return;
    try {
      const auth = await getAuthHeaders();
      await updateAdminPermissions({
        ...auth,
        data: {
          userId: editAdmin.user_id,
          displayName: editAdmin.permissions?.display_name ?? editAdmin.email,
          canManageClients: editAdmin.permissions?.can_manage_clients ?? false,
          canViewSubmissions: editAdmin.permissions?.can_view_submissions ?? false,
          canDownloadSubmissions: editAdmin.permissions?.can_download_submissions ?? false,
          canDeleteClients: editAdmin.permissions?.can_delete_clients ?? false,
        },
      });
      toast.success("Permisos actualizados");
      setEditDialogOpen(false);
      setEditAdmin(null);
      loadAdmins();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  const handleDeleteAdmin = async (userId: string) => {
    if (!confirm("¿Eliminar este administrador? Se eliminará su cuenta y todos sus permisos.")) return;
    try {
      const auth = await getAuthHeaders();
      await deleteAdminUser({ ...auth, data: { userId } });
      toast.success("Administrador eliminado");
      loadAdmins();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Cargando...</p></div>;
  }

  const today = new Date();
  const formattedDate = today.toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="border-b bg-card px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src={logoUvie} alt="UVIE" className="h-10 w-10 rounded-lg object-contain bg-white p-0.5" />
          <div>
            <h1 className="font-bold text-lg">Panel de Administración</h1>
            <p className="text-xs text-muted-foreground capitalize">{formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <Badge variant="outline" className="gap-1 text-xs border-primary text-primary">
              <ShieldCheck className="h-3 w-3" /> Super Admin
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="h-4 w-4 mr-1" /> Cerrar sesión</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          <Button variant={tab === "dashboard" ? "default" : "outline"} onClick={() => setTab("dashboard")}>
            <CalendarDays className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          {hasPerm("can_manage_clients") && (
            <Button variant={tab === "clients" ? "default" : "outline"} onClick={() => setTab("clients")}>
              <Users className="h-4 w-4 mr-1" /> Clientes ({stats.totalClients})
            </Button>
          )}
          {hasPerm("can_view_submissions") && (
            <Button variant={tab === "submissions" ? "default" : "outline"} onClick={() => setTab("submissions")}>
              <FileText className="h-4 w-4 mr-1" /> Formularios ({stats.totalSubmissions})
            </Button>
          )}
          {isSuperAdmin && (
            <Button variant={tab === "admins" ? "default" : "outline"} onClick={() => setTab("admins")}>
              <Shield className="h-4 w-4 mr-1" /> Administradores
            </Button>
          )}
          {hasPerm("can_view_submissions") && (
            <Button variant={tab === "expediente" ? "default" : "outline"} onClick={() => setTab("expediente")}>
              <ClipboardList className="h-4 w-4 mr-1" /> Expediente
            </Button>
          )}
        </div>

        {/* ====== DASHBOARD TAB ====== */}
        {tab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Clientes Activos" value={stats.totalClients} icon={<Users className="h-5 w-5 text-primary" />} color="bg-primary/10" />
              <StatCard title="Formularios Enviados" value={stats.submitted} icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} color="bg-emerald-500/10" />
              <StatCard title="Borradores" value={stats.drafts} icon={<Clock className="h-5 w-5 text-amber-600" />} color="bg-amber-500/10" />
              <StatCard title="Sin Formulario" value={stats.clientsWithoutForm} icon={<FileText className="h-5 w-5 text-rose-600" />} color="bg-rose-500/10" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> Calendario
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={calendarDate}
                    onSelect={setCalendarDate}
                    modifiers={{ hasSubmission: submissionDates }}
                    modifiersClassNames={{ hasSubmission: "bg-primary/20 font-bold text-primary" }}
                    className="rounded-md border pointer-events-auto"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserPlus className="h-4 w-4" /> Acciones Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasPerm("can_manage_clients") && (
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full gap-2" size="lg">
                          <Plus className="h-4 w-4" /> Crear Nuevo Cliente
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Crear nuevo cliente</DialogTitle></DialogHeader>
                        <form onSubmit={handleCreateClient} className="space-y-4">
                          <div className="space-y-2">
                            <Label>Nombre del cliente</Label>
                            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Empresa ABC" />
                          </div>
                          <div className="space-y-2">
                            <Label>Código de acceso (sin espacios)</Label>
                            <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="EMPRESA-ABC" />
                          </div>
                          <div className="space-y-2">
                            <Label>Contraseña</Label>
                            <Input value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="pass1234" />
                          </div>
                          <Button type="submit" className="w-full" disabled={creating}>
                            {creating ? "Creando..." : "Crear cliente"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}

                  <Button variant="outline" className="w-full gap-2" size="lg" onClick={() => setTab("clients")}>
                    <Users className="h-4 w-4" /> Ver todos los clientes
                  </Button>
                  <Button variant="outline" className="w-full gap-2" size="lg" onClick={() => setTab("submissions")}>
                    <FileText className="h-4 w-4" /> Ver formularios
                  </Button>

                  <div className="pt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Actividad Reciente</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {submissionList.slice(0, 5).map(s => (
                        <div key={s.id} className="flex items-center justify-between text-xs bg-muted/50 rounded-lg px-3 py-2">
                          <span className="font-medium truncate">
                            {(s.client_access as { client_name: string } | null)?.client_name || "—"}
                          </span>
                          <Badge variant={s.status === "submitted" ? "default" : "secondary"} className="text-[10px] h-5">
                            {s.status === "submitted" ? "Enviado" : "Borrador"}
                          </Badge>
                        </div>
                      ))}
                      {submissionList.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">Sin actividad reciente</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ====== CLIENTS TAB ====== */}
        {tab === "clients" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Clientes</CardTitle>
              {hasPerm("can_manage_clients") && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo cliente</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Crear nuevo cliente</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreateClient} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nombre del cliente</Label>
                        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Empresa ABC" />
                      </div>
                      <div className="space-y-2">
                        <Label>Código de acceso (sin espacios)</Label>
                        <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="EMPRESA-ABC" />
                      </div>
                      <div className="space-y-2">
                        <Label>Contraseña</Label>
                        <Input value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="pass1234" />
                      </div>
                      <Button type="submit" className="w-full" disabled={creating}>
                        {creating ? "Creando..." : "Crear cliente"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Contraseña</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientList.map((c) => {
                    const sub = (c.sediver_submissions as Array<{ status: string }> | null)?.[0];
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.client_name}</TableCell>
                        <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.access_code}</code></TableCell>
                        <TableCell><code className="text-xs">{c.access_password}</code></TableCell>
                        <TableCell>
                          {sub?.status === "submitted" ? (
                            <Badge className="bg-success text-success-foreground">Enviado</Badge>
                          ) : sub ? (
                            <Badge variant="secondary">Borrador</Badge>
                          ) : (
                            <Badge variant="outline">Sin llenar</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => copyLink(c.access_code)} title="Copiar liga">
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            {hasPerm("can_delete_clients") && (
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} title="Eliminar">
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* ====== SUBMISSIONS TAB ====== */}
        {tab === "submissions" && (
          <Card>
            <CardHeader><CardTitle>Formularios Enviados</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Expediente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Envío</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissionList.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{(s.client_access as { client_name: string } | null)?.client_name}</TableCell>
                      <TableCell>{s.expediente || "—"}</TableCell>
                      <TableCell>
                        {s.status === "submitted" ? (
                          <Badge className="bg-success text-success-foreground">Enviado</Badge>
                        ) : (
                          <Badge variant="secondary">Borrador</Badge>
                        )}
                      </TableCell>
                      <TableCell>{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString("es-MX") : "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {hasPerm("can_download_submissions") && (
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadExcel(s.id)} title="Descargar CSV">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* ====== ADMINS TAB (Super Admin Only) ====== */}
        {tab === "admins" && isSuperAdmin && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" /> Gestión de Administradores
                </CardTitle>
                <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Plus className="h-4 w-4" /> Nuevo Administrador
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Crear nuevo administrador</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreateAdmin} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input value={adminForm.displayName} onChange={(e) => setAdminForm(f => ({ ...f, displayName: e.target.value }))} placeholder="Juan Pérez" />
                      </div>
                      <div className="space-y-2">
                        <Label>Correo electrónico</Label>
                        <Input type="email" value={adminForm.email} onChange={(e) => setAdminForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@ejemplo.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Contraseña</Label>
                        <Input type="password" value={adminForm.password} onChange={(e) => setAdminForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" />
                      </div>
                      <div className="space-y-3 pt-2">
                        <Label className="text-sm font-semibold">Permisos</Label>
                        <PermCheckbox label="Gestionar clientes" description="Crear y editar clientes" checked={adminForm.canManageClients} onCheckedChange={(v) => setAdminForm(f => ({ ...f, canManageClients: !!v }))} />
                        <PermCheckbox label="Ver formularios" description="Ver todos los formularios enviados" checked={adminForm.canViewSubmissions} onCheckedChange={(v) => setAdminForm(f => ({ ...f, canViewSubmissions: !!v }))} />
                        <PermCheckbox label="Descargar formularios" description="Exportar formularios a CSV" checked={adminForm.canDownloadSubmissions} onCheckedChange={(v) => setAdminForm(f => ({ ...f, canDownloadSubmissions: !!v }))} />
                        <PermCheckbox label="Eliminar clientes" description="Eliminar clientes y sus datos" checked={adminForm.canDeleteClients} onCheckedChange={(v) => setAdminForm(f => ({ ...f, canDeleteClients: !!v }))} />
                      </div>
                      <Button type="submit" className="w-full" disabled={creatingAdmin}>
                        {creatingAdmin ? "Creando..." : "Crear administrador"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Permisos</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => {
                      const isSA = admin.roles.includes("super_admin");
                      return (
                        <TableRow key={admin.user_id}>
                          <TableCell className="font-medium">{admin.display_name || admin.email.split("@")[0]}</TableCell>
                          <TableCell className="text-sm">{admin.email}</TableCell>
                          <TableCell>
                            {isSA ? (
                              <Badge className="gap-1 bg-primary"><ShieldCheck className="h-3 w-3" /> Super Admin</Badge>
                            ) : (
                              <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" /> Admin</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {isSA ? (
                              <span className="text-xs text-muted-foreground">Todos los permisos</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {admin.permissions?.can_manage_clients && <Badge variant="outline" className="text-[10px]">Clientes</Badge>}
                                {admin.permissions?.can_view_submissions && <Badge variant="outline" className="text-[10px]">Ver formularios</Badge>}
                                {admin.permissions?.can_download_submissions && <Badge variant="outline" className="text-[10px]">Descargar</Badge>}
                                {admin.permissions?.can_delete_clients && <Badge variant="outline" className="text-[10px]">Eliminar</Badge>}
                                {!admin.permissions?.can_manage_clients && !admin.permissions?.can_view_submissions && !admin.permissions?.can_download_submissions && !admin.permissions?.can_delete_clients && (
                                  <span className="text-xs text-muted-foreground">Sin permisos</span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {!isSA && (
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" title="Editar permisos" onClick={() => { setEditAdmin(admin); setEditDialogOpen(true); }}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" title="Eliminar" onClick={() => handleDeleteAdmin(admin.user_id)}>
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {admins.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No hay administradores registrados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Edit permissions dialog */}
            <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditAdmin(null); }}>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Editar permisos — {editAdmin?.display_name || editAdmin?.email}</DialogTitle></DialogHeader>
                {editAdmin && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <PermCheckbox label="Gestionar clientes" description="Crear y editar clientes" checked={editAdmin.permissions?.can_manage_clients ?? false} onCheckedChange={(v) => setEditAdmin(prev => prev ? { ...prev, permissions: { ...(prev.permissions ?? { id: "", user_id: prev.user_id, email: prev.email, display_name: null, can_manage_clients: false, can_view_submissions: false, can_download_submissions: false, can_delete_clients: false, created_at: "", updated_at: "" }), can_manage_clients: !!v } } : null)} />
                      <PermCheckbox label="Ver formularios" description="Ver todos los formularios enviados" checked={editAdmin.permissions?.can_view_submissions ?? false} onCheckedChange={(v) => setEditAdmin(prev => prev ? { ...prev, permissions: { ...(prev.permissions ?? { id: "", user_id: prev.user_id, email: prev.email, display_name: null, can_manage_clients: false, can_view_submissions: false, can_download_submissions: false, can_delete_clients: false, created_at: "", updated_at: "" }), can_view_submissions: !!v } } : null)} />
                      <PermCheckbox label="Descargar formularios" description="Exportar formularios a CSV" checked={editAdmin.permissions?.can_download_submissions ?? false} onCheckedChange={(v) => setEditAdmin(prev => prev ? { ...prev, permissions: { ...(prev.permissions ?? { id: "", user_id: prev.user_id, email: prev.email, display_name: null, can_manage_clients: false, can_view_submissions: false, can_download_submissions: false, can_delete_clients: false, created_at: "", updated_at: "" }), can_download_submissions: !!v } } : null)} />
                      <PermCheckbox label="Eliminar clientes" description="Eliminar clientes y sus datos" checked={editAdmin.permissions?.can_delete_clients ?? false} onCheckedChange={(v) => setEditAdmin(prev => prev ? { ...prev, permissions: { ...(prev.permissions ?? { id: "", user_id: prev.user_id, email: prev.email, display_name: null, can_manage_clients: false, can_view_submissions: false, can_download_submissions: false, can_delete_clients: false, created_at: "", updated_at: "" }), can_delete_clients: !!v } } : null)} />
                    </div>
                    <Button className="w-full" onClick={handleUpdatePermissions}>Guardar cambios</Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* ====== EXPEDIENTE TAB ====== */}
        {tab === "expediente" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="h-5 w-5" /> Expediente SEDIVER — Hoja de Cálculo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ExpedienteSheet
                  rows={submissionList as unknown as Record<string, unknown>[]}
                  saveField={saveExpedienteField}
                  onLocalUpdate={(id, field, value) => {
                    setSubmissions((prev) => {
                      if (!Array.isArray(prev)) return prev;
                      return prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)) as typeof prev;
                    });
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5" /> Vista Detallada (Formulario)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-w-md">
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Seleccionar formulario</Label>
                  <Select
                    value={selectedSubmissionId ?? ""}
                    onValueChange={(v) => setSelectedSubmissionId(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar un expediente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {submissionList.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {(s.client_access as { client_name?: string } | null)?.client_name || "Sin nombre"} — {s.expediente || s.id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {loadingExpediente && <p className="text-sm text-muted-foreground">Cargando expediente...</p>}

                {selectedSubmission && !loadingExpediente && (
                  <ExpedienteEditor
                    submission={selectedSubmission}
                    onFieldSaved={(field, value) => {
                      setSelectedSubmission(prev => prev ? { ...prev, [field]: value } : null);
                    }}
                    saveField={saveExpedienteField}
                  />
                )}

                {!selectedSubmissionId && !loadingExpediente && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Selecciona un formulario para ver el detalle
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function PermCheckbox({ label, description, checked, onCheckedChange }: { label: string; description: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} className="mt-0.5" />
      <div>
        <p className="text-sm font-medium leading-none">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
