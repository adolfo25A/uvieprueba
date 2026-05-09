import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/FormField";
import { FormSelect } from "@/components/FormSelect";
import { toast, Toaster } from "sonner";
import { Save, Send, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import {
  ENTIDADES_FEDERATIVAS, TIPO_INSTALACION, TIPO_VERIFICACION, SI_NO,
  TIPO_PERSONA, TIPO_IDENTIFICACION, TIPO_CONCENTRACION, TENSIONES,
  CARGOS, NACIONALIDADES,
} from "@/lib/form-options";
import { saveSubmission, submitForm, getSubmission } from "@/server/submissions.functions";
import logoUvie from "@/assets/logo-uvie.jpeg";

export const Route = createFileRoute("/formulario")({
  component: FormularioPage,
});

function FormularioPage() {
  const navigate = useNavigate();
  const [clientAccess, setClientAccess] = useState<{ id: string; client_name: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // Form state
  const [form, setForm] = useState<Record<string, string>>({});

  const set = (key: string) => (val: string) => setForm((prev) => ({ ...prev, [key]: val }));
  const get = (key: string) => form[key] || "";

  useEffect(() => {
    const stored = sessionStorage.getItem("client_access");
    if (!stored) {
      navigate({ to: "/" });
      return;
    }
    const client = JSON.parse(stored);
    setClientAccess(client);

    // Load existing submission
    getSubmission({ data: { clientAccessId: client.id } }).then((sub) => {
      if (sub) {
        const formData: Record<string, string> = {};
        for (const [key, val] of Object.entries(sub)) {
          if (val !== null && typeof val === "string") formData[key] = val;
          if (val !== null && typeof val === "number") formData[key] = String(val);
        }
        setForm(formData);
        if (sub.status === "submitted") setIsSubmitted(true);
      }
    });
  }, [navigate]);

  const handleSave = async () => {
    if (!clientAccess) return;
    setSaving(true);
    try {
      await saveSubmission({ data: { clientAccessId: clientAccess.id, formData: form } });
      toast.success("Formulario guardado correctamente");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!clientAccess) return;
    setSubmitting(true);
    try {
      await submitForm({ data: { clientAccessId: clientAccess.id, formData: form } });
      setIsSubmitted(true);
      toast.success("Formulario enviado correctamente");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setSubmitting(false);
    }
  };

  if (!clientAccess) return null;

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <div className="w-full max-w-lg text-center space-y-8">
          {/* Logo */}
          <div className="relative mx-auto w-48 h-48 rounded-2xl overflow-hidden shadow-2xl border-2 border-primary/20">
            <img
              src={logoUvie}
              alt="UVIE 652-A"
              className="w-full h-full object-contain bg-white p-2"
            />
          </div>

          {/* Welcome Card */}
          <Card className="shadow-2xl border border-primary/10 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">¡Bienvenido!</CardTitle>
              <p className="text-muted-foreground text-sm mt-1">
                {clientAccess.client_name}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2">
                <p className="text-sm text-foreground/80">
                  Estás a punto de llenar el <span className="font-semibold text-foreground">Formulario de Verificación SEDIVER</span>. 
                  Por favor ten a la mano la siguiente información:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Datos de identificación del solicitante</li>
                  <li>Dirección completa de la instalación</li>
                  <li>Características técnicas de la instalación eléctrica</li>
                  <li>Información de personas de contacto</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                Puedes guardar tu progreso en cualquier momento y regresar después.
              </p>
              <Button
                className="w-full gap-2"
                size="lg"
                onClick={() => setShowWelcome(false)}
              >
                Comenzar formulario <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            SEDIVER — Sistema de Verificación de Instalaciones Eléctricas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Salir
          </Button>
          <img src={logoUvie} alt="UVIE" className="h-8 w-8 rounded object-contain bg-white" />
          <div>
            <h1 className="font-semibold text-sm">Formulario SEDIVER</h1>
            <p className="text-xs text-muted-foreground">{clientAccess.client_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving || isSubmitted}>
            <Save className="h-4 w-4 mr-1" /> {saving ? "Guardando..." : "Guardar borrador"}
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting || isSubmitted}>
            <Send className="h-4 w-4 mr-1" /> {submitting ? "Enviando..." : isSubmitted ? "Enviado ✓" : "Enviar formulario"}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
        {isSubmitted && (
          <div className="bg-success/10 border border-success/30 rounded-lg p-4 text-center text-sm text-success">
            Este formulario ya fue enviado. Los datos son de solo lectura.
          </div>
        )}

        {/* Header Info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Datos del Expediente</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormField label="Expediente" value={get("expediente")} onChange={set("expediente")} />
            <FormField label="Folio" value={get("folio")} onChange={set("folio")} />
            <FormField label="Fecha de Solicitud" value={get("fecha_solicitud")} onChange={set("fecha_solicitud")} type="date" />
            <FormField label="Folio SEDIVER" value={get("folio_sediver")} onChange={set("folio_sediver")} />
            <FormField label="Año" value={get("anio")} onChange={set("anio")} />
            <FormField label="Fecha de Contrato" value={get("fecha_contrato")} onChange={set("fecha_contrato")} type="date" />
            <FormField label="Dictamen" value={get("dictamen")} onChange={set("dictamen")} />
            <FormField label="Fecha de Dictamen" value={get("fecha_dictamen")} onChange={set("fecha_dictamen")} type="date" />
          </CardContent>
        </Card>

        {/* Datos del Solicitante */}
        <Card>
          <CardHeader><CardTitle className="text-base">Datos del Solicitante</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <FormField label="Nombre o razón social" value={get("nombre_razon_social")} onChange={set("nombre_razon_social")} />
            </div>
            <FormSelect label="Tipo de Persona" value={get("tipo_persona")} onValueChange={set("tipo_persona")} options={TIPO_PERSONA} />
            <FormSelect label="Tipo de Identificación" value={get("tipo_identificacion")} onValueChange={set("tipo_identificacion")} options={TIPO_IDENTIFICACION} />
            <FormField label="Folio Identificación" value={get("folio_identificacion")} onChange={set("folio_identificacion")} />
            <FormField label="Teléfono" value={get("telefono")} onChange={set("telefono")} />
            <FormField label="Celular" value={get("celular")} onChange={set("celular")} />
            <FormField label="Correo Electrónico" value={get("correo_electronico")} onChange={set("correo_electronico")} type="email" />
          </CardContent>
        </Card>

        {/* Dirección */}
        <Card>
          <CardHeader><CardTitle className="text-base">Dirección</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Calle" value={get("calle")} onChange={set("calle")} />
            <FormField label="Número Exterior" value={get("numero_exterior")} onChange={set("numero_exterior")} />
            <FormField label="Número Interior" value={get("numero_interior")} onChange={set("numero_interior")} />
            <FormField label="Entre la calle" value={get("entre_calle")} onChange={set("entre_calle")} />
            <FormField label="Y la calle" value={get("y_calle")} onChange={set("y_calle")} />
            <FormField label="Código Postal" value={get("cp")} onChange={set("cp")} />
            <FormSelect label="Entidad Federativa" value={get("entidad_federativa")} onValueChange={set("entidad_federativa")} options={ENTIDADES_FEDERATIVAS} />
            <FormField label="Ciudad" value={get("ciudad")} onChange={set("ciudad")} />
            <FormField label="Municipio o Alcaldía" value={get("municipio_alcaldia")} onChange={set("municipio_alcaldia")} />
            <FormField label="Colonia" value={get("colonia")} onChange={set("colonia")} />
          </CardContent>
        </Card>

        {/* Giro */}
        <Card>
          <CardHeader><CardTitle className="text-base">Giro de la Instalación</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Giro de la Instalación" value={get("giro_instalacion")} onChange={set("giro_instalacion")} />
            <FormField label="Nombre Comercial" value={get("nombre_comercial")} onChange={set("nombre_comercial")} />
          </CardContent>
        </Card>

        {/* Persona que contrata */}
        <PersonSection title="Persona que Contrata a la Unidad de Verificación" prefix="contrata" get={get} set={set} showCargo={false} />
        
        {/* Persona que atiende */}
        <PersonSection title="Persona que Atiende la Visita" prefix="atiende" get={get} set={set} showCargo={true} />
        
        {/* Representante */}
        <PersonSection title="Representante que Firmará el Contrato" prefix="representante" get={get} set={set} showCargo={false} />

        {/* Características de la Instalación */}
        <Card>
          <CardHeader><CardTitle className="text-base">Características de la Instalación</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect label="Tensión" value={get("tension")} onValueChange={set("tension")} options={TENSIONES} />
            <FormField label="Cap. de la Subestación (kVA)" value={get("cap_subestacion_kva")} onChange={set("cap_subestacion_kva")} />
            <FormField label="Carga Instalada (kW)" value={get("carga_instalada_kw")} onChange={set("carga_instalada_kw")} />
            <FormField label="Alcance de la Verificación (kW)" value={get("alcance_verificacion_kw")} onChange={set("alcance_verificacion_kw")} />
            <FormSelect label="Tipo de Instalación" value={get("tipo_instalacion")} onValueChange={set("tipo_instalacion")} options={TIPO_INSTALACION} />
            <FormSelect label="Tipo de Verificación" value={get("tipo_verificacion")} onValueChange={set("tipo_verificacion")} options={TIPO_VERIFICACION} />
            <FormSelect label="Área Clasificada (S/N)" value={get("area_clasificada")} onValueChange={set("area_clasificada")} options={SI_NO} />
            <FormSelect label="Si es otro tipo, definir" value={get("otro_tipo_instalacion")} onValueChange={set("otro_tipo_instalacion")} options={TIPO_CONCENTRACION} />
          </CardContent>
        </Card>

        {/* Otra Información */}
        <Card>
          <CardHeader><CardTitle className="text-base">Otra Información</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Núm. Visitas" value={get("num_visitas")} onChange={set("num_visitas")} />
            <FormField label="Metros Cuadrados" value={get("metros_cuadrados")} onChange={set("metros_cuadrados")} />
            <FormSelect label="Carga de Alumbrado > 3kW" value={get("carga_alumbrado")} onValueChange={set("carga_alumbrado")} options={SI_NO} />
            <FormSelect label="Tipo de Concentración" value={get("tipo_concentracion")} onValueChange={set("tipo_concentracion")} options={TIPO_CONCENTRACION} />
          </CardContent>
        </Card>

        {/* Costos */}
        <Card>
          <CardHeader><CardTitle className="text-base">Costos</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormField label="Costo de la UVIE" value={get("costo_uvie")} onChange={set("costo_uvie")} type="number" />
            <FormField label="Ajuste" value={get("ajuste")} onChange={set("ajuste")} type="number" />
            <FormField label="Planos" value={get("planos")} onChange={set("planos")} type="number" />
            <FormField label="Supervisión" value={get("supervision")} onChange={set("supervision")} type="number" />
            <FormField label="Otros 1" value={get("otros_1")} onChange={set("otros_1")} type="number" />
            <FormField label="Otros 2" value={get("otros_2")} onChange={set("otros_2")} type="number" />
          </CardContent>
        </Card>

        {/* Pagos */}
        <Card>
          <CardHeader><CardTitle className="text-base">Pagos</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <FormField label="Pago 1" value={get("pago_1")} onChange={set("pago_1")} type="number" />
            <FormField label="Pago 2" value={get("pago_2")} onChange={set("pago_2")} type="number" />
            <FormField label="Pago 3" value={get("pago_3")} onChange={set("pago_3")} type="number" />
            <FormField label="Pago 4" value={get("pago_4")} onChange={set("pago_4")} type="number" />
            <FormField label="Pago 5" value={get("pago_5")} onChange={set("pago_5")} type="number" />
          </CardContent>
        </Card>

        {/* Equipos */}
        <Card>
          <CardHeader><CardTitle className="text-base">Subestación y Equipos</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Subestación Compartida" value={get("subestacion_compartida")} onChange={set("subestacion_compartida")} />
            <FormField label="KVA" value={get("subestacion_kva")} onChange={set("subestacion_kva")} />
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader><CardTitle className="text-base">Notas</CardTitle></CardHeader>
          <CardContent>
            <textarea
              className="w-full min-h-[100px] rounded-md border border-input bg-background p-3 text-sm"
              value={get("notas")}
              onChange={(e) => set("notas")(e.target.value)}
              placeholder="Notas adicionales..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PersonSection({
  title, prefix, get, set, showCargo
}: {
  title: string;
  prefix: string;
  get: (k: string) => string;
  set: (k: string) => (v: string) => void;
  showCargo: boolean;
}) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Nombre" value={get(`${prefix}_nombre`)} onChange={set(`${prefix}_nombre`)} />
        <FormField label="Apellido Paterno" value={get(`${prefix}_apellido_paterno`)} onChange={set(`${prefix}_apellido_paterno`)} />
        <FormField label="Apellido Materno" value={get(`${prefix}_apellido_materno`)} onChange={set(`${prefix}_apellido_materno`)} />
        {showCargo && <FormSelect label="Cargo" value={get(`${prefix}_cargo`)} onValueChange={set(`${prefix}_cargo`)} options={CARGOS} />}
        <FormField label="Teléfono" value={get(`${prefix}_telefono`)} onChange={set(`${prefix}_telefono`)} />
        <FormField label="Celular" value={get(`${prefix}_celular`)} onChange={set(`${prefix}_celular`)} />
        <FormField label="Correo" value={get(`${prefix}_correo`)} onChange={set(`${prefix}_correo`)} type="email" />
        <FormSelect label="Nacionalidad" value={get(`${prefix}_nacionalidad`)} onValueChange={set(`${prefix}_nacionalidad`)} options={NACIONALIDADES} />
        <FormSelect label="Tipo de Identificación" value={get(`${prefix}_tipo_identificacion`)} onValueChange={set(`${prefix}_tipo_identificacion`)} options={TIPO_IDENTIFICACION} />
        <FormField label="Folio" value={get(`${prefix}_folio`)} onChange={set(`${prefix}_folio`)} />
        <FormField label="CURP" value={get(`${prefix}_curp`)} onChange={set(`${prefix}_curp`)} />
      </CardContent>
    </Card>
  );
}
