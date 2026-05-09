import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, ArrowLeft } from "lucide-react";
import logoUvie from "@/assets/logo-uvie.jpeg";

export const Route = createFileRoute("/login-admin")({
  component: LoginAdminPage,
});

function LoginAdminPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/admin" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Top section – logo fills this area */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-[40vh]">
        <img
          src={logoUvie}
          alt="UVIE 652-A"
          className="max-h-[35vh] w-auto object-contain"
        />
      </div>
      {/* Bottom section – glassmorphism card */}
      <div className="relative z-10 flex flex-col items-center gap-4 pb-8 px-4 -mt-8">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border border-white/20 bg-white/30 backdrop-blur-xl rounded-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 backdrop-blur-sm">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Administrador</CardTitle>
              <CardDescription>Panel de gestión de clientes y formularios</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Correo electrónico</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@ejemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label>Contraseña</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Ingresando..." : "Iniciar sesión"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Volver al acceso de cliente
        </Link>
      </div>
    </div>
  );
}
