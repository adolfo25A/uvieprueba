import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Shield } from "lucide-react";
import logoUvie from "@/assets/logo-uvie.jpeg";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
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
      {/* Bottom section – glassmorphism card overlapping slightly */}
      <div className="relative z-10 flex flex-col items-center gap-4 pb-8 px-4 -mt-8">
        <div className="w-full max-w-md">
          <ClientAccessCard />
        </div>
        <Link to="/login-admin" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
          <Shield className="h-4 w-4" />
          Acceso Administrador
        </Link>
      </div>
    </div>
  );
}

function ClientAccessCard() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !password.trim()) return;
    setLoading(true);
    try {
      const { verifyClientAccess } = await import("@/server/submissions.functions");
      const client = await verifyClientAccess({ data: { accessCode: code.trim(), accessPassword: password.trim() } });
      sessionStorage.setItem("client_access", JSON.stringify(client));
      navigate({ to: "/formulario" });
    } catch {
      toast.error("Código o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-2xl border border-white/20 bg-white/30 backdrop-blur-xl rounded-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Acceso de Cliente</CardTitle>
        <CardDescription>Ingrese su código y contraseña para llenar el formulario SEDIVER</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAccess} className="space-y-4">
          <div className="space-y-2">
            <Label>Código de acceso</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ej: CLIENTE-001" />
          </div>
          <div className="space-y-2">
            <Label>Contraseña</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verificando..." : "Acceder al formulario"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
