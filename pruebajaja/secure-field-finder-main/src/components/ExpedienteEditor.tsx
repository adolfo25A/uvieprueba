import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

type Submission = Record<string, unknown>;

interface EditableCellProps {
  value: string;
  field: string;
  onSave: (field: string, value: string) => Promise<void>;
  type?: "text" | "date" | "number";
  className?: string;
}

function EditableCell({ value, field, onSave, type = "text", className = "" }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocalVal(value); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const handleSave = async () => {
    if (localVal === value) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(field, localVal);
      setEditing(false);
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="relative">
        <Input
          ref={inputRef}
          type={type}
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setLocalVal(value); setEditing(false); } }}
          className={`h-7 text-xs px-1.5 py-0 ${className}`}
          disabled={saving}
        />
        {saving && <Loader2 className="absolute right-1 top-1.5 h-3 w-3 animate-spin text-muted-foreground" />}
      </div>
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className={`min-h-[28px] px-1.5 py-1 text-xs cursor-pointer hover:bg-primary/5 rounded border border-transparent hover:border-primary/20 transition-colors ${className}`}
      title="Click para editar"
    >
      {value || <span className="text-muted-foreground italic">—</span>}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-md">
      <h3 className="text-xs font-bold text-primary uppercase tracking-wide">{title}</h3>
    </div>
  );
}

function LabelCell({ children }: { children: React.ReactNode }) {
  return <td className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide py-1 px-1.5 whitespace-nowrap bg-muted/30">{children}</td>;
}

function ValueCell({ children, colSpan = 1 }: { children: React.ReactNode; colSpan?: number }) {
  return <td colSpan={colSpan} className="py-0.5 px-0.5">{children}</td>;
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString().split("T")[0];
  return String(v);
}

function fmtDate(v: unknown): string {
  if (!v) return "";
  const s = String(v);
  if (s.includes("T")) return s.split("T")[0];
  return s;
}

interface ExpedienteEditorProps {
  submission: Submission;
  onFieldSaved: (field: string, value: string) => void;
  saveField: (id: string, field: string, value: unknown) => Promise<void>;
}

export function ExpedienteEditor({ submission, onFieldSaved, saveField }: ExpedienteEditorProps) {
  const id = submission.id as string;

  const handleSave = useCallback(async (field: string, value: string) => {
    let saveValue: unknown = value;
    if (["costo_uvie", "ajuste", "planos", "supervision", "otros_1", "otros_2", "pago_1", "pago_2", "pago_3", "pago_4", "pago_5"].includes(field)) {
      saveValue = value === "" ? 0 : Number(value);
    }
    if (["anio"].includes(field)) {
      saveValue = value === "" ? null : Number(value);
    }
    await saveField(id, field, saveValue as string);
    onFieldSaved(field, value);
  }, [id, saveField, onFieldSaved]);

  const E = useCallback(({ field, type }: { field: string; type?: "text" | "date" | "number" }) => {
    const raw = type === "date" ? fmtDate(submission[field]) : fmt(submission[field]);
    return <EditableCell value={raw} field={field} onSave={handleSave} type={type} />;
  }, [submission, handleSave]);

  const num = (k: string) => Number(submission[k] ?? 0) || 0;
  const totalCobrado = num("costo_uvie") + num("ajuste") + num("planos") + num("supervision") + num("otros_1") + num("otros_2");
  const ivaCobrado = totalCobrado * 0.16;
  const totalConIvaCobrado = totalCobrado + ivaCobrado;
  const totalPagado = num("pago_1") + num("pago_2") + num("pago_3") + num("pago_4") + num("pago_5");
  const ivaPagado = totalPagado * 0.16;
  const totalConIvaPagado = totalPagado + ivaPagado;
  const money = (v: number) => v.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

  const clientName = (submission.client_access as { client_name?: string } | null)?.client_name || "";

  return (
    <div className="space-y-3 text-xs">
      {/* Status badge */}
      <div className="flex items-center gap-2">
        <Badge variant={submission.status === "submitted" ? "default" : "secondary"}>
          {submission.status === "submitted" ? "Enviado" : "Borrador"}
        </Badge>
        <span className="text-muted-foreground">Cliente: <strong>{clientName}</strong></span>
        <Badge variant="outline" className="gap-1 text-[10px]"><Save className="h-3 w-3" /> Autoguardado al editar</Badge>
      </div>

      {/* Header info - like SEDIVER sheet rows 2-4 */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            <tr className="border-b bg-muted/20">
              <LabelCell>Expediente</LabelCell>
              <ValueCell><E field="expediente" /></ValueCell>
              <LabelCell>Folio</LabelCell>
              <ValueCell><E field="folio" /></ValueCell>
              <LabelCell>Año</LabelCell>
              <ValueCell><E field="anio" type="number" /></ValueCell>
            </tr>
            <tr className="border-b bg-muted/20">
              <LabelCell>Fecha de Solicitud</LabelCell>
              <ValueCell><E field="fecha_solicitud" type="date" /></ValueCell>
              <LabelCell>Folio SEDIVER</LabelCell>
              <ValueCell colSpan={3}><E field="folio_sediver" /></ValueCell>
            </tr>
            <tr className="border-b bg-muted/20">
              <LabelCell>Fecha de Contrato</LabelCell>
              <ValueCell><E field="fecha_contrato" type="date" /></ValueCell>
              <LabelCell>Dictamen</LabelCell>
              <ValueCell><E field="dictamen" /></ValueCell>
              <LabelCell>Fecha Dictamen</LabelCell>
              <ValueCell><E field="fecha_dictamen" type="date" /></ValueCell>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Row 5: Nombre o razón social */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            <tr className="bg-muted/20">
              <LabelCell>Nombre o Razón Social</LabelCell>
              <td colSpan={5} className="py-0.5 px-0.5"><E field="nombre_razon_social" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tipo persona + identificación */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            <tr className="border-b bg-muted/20">
              <LabelCell>Tipo de Persona</LabelCell>
              <ValueCell><E field="tipo_persona" /></ValueCell>
              <LabelCell>Tipo de Identificación</LabelCell>
              <ValueCell><E field="tipo_identificacion" /></ValueCell>
            </tr>
            <tr className="border-b bg-muted/20">
              <LabelCell>Folio Identificación</LabelCell>
              <ValueCell><E field="folio_identificacion" /></ValueCell>
              <LabelCell>Teléfono</LabelCell>
              <ValueCell><E field="telefono" /></ValueCell>
            </tr>
            <tr className="border-b bg-muted/20">
              <LabelCell>Celular</LabelCell>
              <ValueCell><E field="celular" /></ValueCell>
              <LabelCell>Correo Electrónico</LabelCell>
              <ValueCell><E field="correo_electronico" /></ValueCell>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Dirección */}
      <SectionHeader title="Dirección" />
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            <tr className="border-b bg-muted/20">
              <LabelCell>Calle</LabelCell>
              <ValueCell colSpan={3}><E field="calle" /></ValueCell>
              <LabelCell>Núm. Ext.</LabelCell>
              <ValueCell><E field="numero_exterior" /></ValueCell>
              <LabelCell>Núm. Int.</LabelCell>
              <ValueCell><E field="numero_interior" /></ValueCell>
            </tr>
            <tr className="border-b bg-muted/20">
              <LabelCell>Entre la calle</LabelCell>
              <ValueCell><E field="entre_calle" /></ValueCell>
              <LabelCell>Y la calle</LabelCell>
              <ValueCell><E field="y_calle" /></ValueCell>
              <LabelCell>CP</LabelCell>
              <ValueCell><E field="cp" /></ValueCell>
              <LabelCell>Entidad Fed.</LabelCell>
              <ValueCell><E field="entidad_federativa" /></ValueCell>
            </tr>
            <tr className="bg-muted/20">
              <LabelCell>Ciudad</LabelCell>
              <ValueCell><E field="ciudad" /></ValueCell>
              <LabelCell>Municipio/Alcaldía</LabelCell>
              <ValueCell><E field="municipio_alcaldia" /></ValueCell>
              <LabelCell>Colonia</LabelCell>
              <ValueCell colSpan={3}><E field="colonia" /></ValueCell>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Giro */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            <tr className="bg-muted/20">
              <LabelCell>Giro de la Instalación</LabelCell>
              <ValueCell colSpan={2}><E field="giro_instalacion" /></ValueCell>
              <LabelCell>Nombre Comercial</LabelCell>
              <ValueCell colSpan={2}><E field="nombre_comercial" /></ValueCell>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Persona que contrata */}
      <SectionHeader title="Persona que contrata a la Unidad de Verificación" />
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            <tr className="border-b bg-muted/20">
              <LabelCell>Nombre</LabelCell>
              <ValueCell><E field="contrata_nombre" /></ValueCell>
              <LabelCell>Apellido Paterno</LabelCell>
              <ValueCell><E field="contrata_apellido_paterno" /></ValueCell>
              <LabelCell>Apellido Materno</LabelCell>
              <ValueCell><E field="contrata_apellido_materno" /></ValueCell>
            </tr>
            <tr className="border-b bg-muted/20">
              <LabelCell>Teléfono</LabelCell>
              <ValueCell><E field="contrata_telefono" /></ValueCell>
              <LabelCell>Celular</LabelCell>
              <ValueCell><E field="contrata_celular" /></ValueCell>
              <LabelCell>Correo</LabelCell>
              <ValueCell><E field="contrata_correo" /></ValueCell>
            </tr>
            <tr className="bg-muted/20">
              <LabelCell>Nacionalidad</LabelCell>
              <ValueCell><E field="contrata_nacionalidad" /></ValueCell>
              <LabelCell>Tipo de ID</LabelCell>
              <ValueCell><E field="contrata_tipo_identificacion" /></ValueCell>
              <LabelCell>Folio / CURP</LabelCell>
              <ValueCell><E field="contrata_curp" /></ValueCell>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Persona que atiende */}
      <SectionHeader title="Persona que atiende la visita de la Unidad de Verificación" />
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            <tr className="border-b bg-muted/20">
              <LabelCell>Nombre</LabelCell>
              <ValueCell><E field="atiende_nombre" /></ValueCell>
              <LabelCell>Apellido Paterno</LabelCell>
              <ValueCell><E field="atiende_apellido_paterno" /></ValueCell>
              <LabelCell>Apellido Materno</LabelCell>
              <ValueCell><E field="atiende_apellido_materno" /></ValueCell>
            </tr>
            <tr className="border-b bg-muted/20">
              <LabelCell>Teléfono</LabelCell>
              <ValueCell><E field="atiende_telefono" /></ValueCell>
              <LabelCell>Celular</LabelCell>
              <ValueCell><E field="atiende_celular" /></ValueCell>
              <LabelCell>Correo</LabelCell>
              <ValueCell><E field="atiende_correo" /></ValueCell>
            </tr>
            <tr className="bg-muted/20">
              <LabelCell>Nacionalidad</LabelCell>
              <ValueCell><E field="atiende_nacionalidad" /></ValueCell>
              <LabelCell>Tipo de ID</LabelCell>
              <ValueCell><E field="atiende_tipo_identificacion" /></ValueCell>
              <LabelCell>Folio / CURP</LabelCell>
              <ValueCell><E field="atiende_curp" /></ValueCell>
            </tr>
            <tr className="bg-muted/20 border-t">
              <LabelCell>Cargo</LabelCell>
              <ValueCell colSpan={5}><E field="atiende_cargo" /></ValueCell>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Representante */}
      <SectionHeader title="Representante que firmará el contrato ante la Cía. Suministradora" />
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            <tr className="border-b bg-muted/20">
              <LabelCell>Nombre</LabelCell>
              <ValueCell><E field="representante_nombre" /></ValueCell>
              <LabelCell>Apellido Paterno</LabelCell>
              <ValueCell><E field="representante_apellido_paterno" /></ValueCell>
              <LabelCell>Apellido Materno</LabelCell>
              <ValueCell><E field="representante_apellido_materno" /></ValueCell>
            </tr>
            <tr className="border-b bg-muted/20">
              <LabelCell>Teléfono</LabelCell>
              <ValueCell><E field="representante_telefono" /></ValueCell>
              <LabelCell>Celular</LabelCell>
              <ValueCell><E field="representante_celular" /></ValueCell>
              <LabelCell>Correo</LabelCell>
              <ValueCell><E field="representante_correo" /></ValueCell>
            </tr>
            <tr className="bg-muted/20">
              <LabelCell>Nacionalidad</LabelCell>
              <ValueCell><E field="representante_nacionalidad" /></ValueCell>
              <LabelCell>Tipo de ID</LabelCell>
              <ValueCell><E field="representante_tipo_identificacion" /></ValueCell>
              <LabelCell>Folio / CURP</LabelCell>
              <ValueCell><E field="representante_curp" /></ValueCell>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Características de la instalación */}
      <SectionHeader title="Características de la Instalación a Verificar" />
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            <tr className="border-b bg-muted/20">
              <LabelCell>Tensión (V)</LabelCell>
              <ValueCell><E field="tension" /></ValueCell>
              <LabelCell>Cap. Subestación kVA</LabelCell>
              <ValueCell><E field="cap_subestacion_kva" /></ValueCell>
              <LabelCell>Carga Instalada kW</LabelCell>
              <ValueCell><E field="carga_instalada_kw" /></ValueCell>
              <LabelCell>Alcance Verif. kW</LabelCell>
              <ValueCell><E field="alcance_verificacion_kw" /></ValueCell>
            </tr>
            <tr className="border-b bg-muted/20">
              <LabelCell>Tipo Instalación</LabelCell>
              <ValueCell colSpan={3}><E field="tipo_instalacion" /></ValueCell>
              <LabelCell>Tipo Verificación</LabelCell>
              <ValueCell colSpan={3}><E field="tipo_verificacion" /></ValueCell>
            </tr>
            <tr className="bg-muted/20">
              <LabelCell>Área Clasificada</LabelCell>
              <ValueCell><E field="area_clasificada" /></ValueCell>
              <LabelCell>Otro Tipo Instalación</LabelCell>
              <ValueCell colSpan={5}><E field="otro_tipo_instalacion" /></ValueCell>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Otra información */}
      <SectionHeader title="Otra Información" />
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            <tr className="border-b bg-muted/20">
              <LabelCell>Núm. de Servicio</LabelCell>
              <ValueCell><E field="num_servicio" /></ValueCell>
              <LabelCell>Núm. Visitas</LabelCell>
              <ValueCell><E field="num_visitas" /></ValueCell>
              <LabelCell>Metros Cuadrados</LabelCell>
              <ValueCell><E field="metros_cuadrados" /></ValueCell>
              <LabelCell>Carga Alumbrado</LabelCell>
              <ValueCell><E field="carga_alumbrado" /></ValueCell>
            </tr>
            <tr className="border-b bg-muted/20">
              <LabelCell>Tipo Concentración</LabelCell>
              <ValueCell><E field="tipo_concentracion" /></ValueCell>
              <LabelCell>Subestación kVA</LabelCell>
              <ValueCell><E field="subestacion_kva" /></ValueCell>
              <LabelCell>Subestación Compartida</LabelCell>
              <ValueCell colSpan={3}><E field="subestacion_compartida" /></ValueCell>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Visitas / Seguimiento CFE */}
      <SectionHeader title="Visitas y Seguimiento" />
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            <tr className="border-b bg-muted/20">
              <LabelCell>Primera Visita</LabelCell>
              <ValueCell><E field="primera_visita" type="date" /></ValueCell>
              <LabelCell>Segunda Visita</LabelCell>
              <ValueCell><E field="segunda_visita" type="date" /></ValueCell>
              <LabelCell>Tercera Visita</LabelCell>
              <ValueCell><E field="tercera_visita" type="date" /></ValueCell>
            </tr>
            <tr className="bg-muted/20">
              <LabelCell>Oficio CFE</LabelCell>
              <ValueCell><E field="oficio_cfe" /></ValueCell>
              <LabelCell>Días</LabelCell>
              <ValueCell><E field="dias" /></ValueCell>
              <LabelCell>Comentarios</LabelCell>
              <ValueCell><E field="comentarios" /></ValueCell>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Costos */}
      <SectionHeader title="Costos y Pagos" />
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            <tr className="border-b bg-muted/20">
              <LabelCell>Costo UVIE</LabelCell>
              <ValueCell><E field="costo_uvie" type="number" /></ValueCell>
              <LabelCell>Ajuste</LabelCell>
              <ValueCell><E field="ajuste" type="number" /></ValueCell>
              <LabelCell>Planos</LabelCell>
              <ValueCell><E field="planos" type="number" /></ValueCell>
              <LabelCell>Supervisión</LabelCell>
              <ValueCell><E field="supervision" type="number" /></ValueCell>
            </tr>
            <tr className="border-b bg-muted/20">
              <LabelCell>Otros 1</LabelCell>
              <ValueCell><E field="otros_1" type="number" /></ValueCell>
              <LabelCell>Otros 2</LabelCell>
              <ValueCell colSpan={5}><E field="otros_2" type="number" /></ValueCell>
            </tr>
            <tr className="border-b bg-accent/20 font-semibold">
              <LabelCell>Total Cobrado</LabelCell>
              <td className="px-1.5 py-1 text-xs">{money(totalCobrado)}</td>
              <LabelCell>IVA (16%)</LabelCell>
              <td className="px-1.5 py-1 text-xs">{money(ivaCobrado)}</td>
              <LabelCell>Total con IVA</LabelCell>
              <td colSpan={3} className="px-1.5 py-1 text-xs">{money(totalConIvaCobrado)}</td>
            </tr>
            <tr className="border-b bg-primary/5">
              <LabelCell>Pago 1</LabelCell>
              <ValueCell><E field="pago_1" type="number" /></ValueCell>
              <LabelCell>Pago 2</LabelCell>
              <ValueCell><E field="pago_2" type="number" /></ValueCell>
              <LabelCell>Pago 3</LabelCell>
              <ValueCell><E field="pago_3" type="number" /></ValueCell>
              <LabelCell>Pago 4</LabelCell>
              <ValueCell><E field="pago_4" type="number" /></ValueCell>
            </tr>
            <tr className="border-b bg-primary/5">
              <LabelCell>Pago 5</LabelCell>
              <ValueCell colSpan={7}><E field="pago_5" type="number" /></ValueCell>
            </tr>
            <tr className="bg-accent/20 font-semibold">
              <LabelCell>Total Pagado</LabelCell>
              <td className="px-1.5 py-1 text-xs">{money(totalPagado)}</td>
              <LabelCell>IVA (16%)</LabelCell>
              <td className="px-1.5 py-1 text-xs">{money(ivaPagado)}</td>
              <LabelCell>Total con IVA</LabelCell>
              <td colSpan={3} className="px-1.5 py-1 text-xs">{money(totalConIvaPagado)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notas */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            <tr className="bg-muted/20">
              <LabelCell>Notas</LabelCell>
              <td colSpan={7} className="py-0.5 px-0.5"><E field="notas" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
