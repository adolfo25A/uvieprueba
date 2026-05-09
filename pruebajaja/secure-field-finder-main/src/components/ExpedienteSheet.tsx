import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Row = Record<string, unknown>;

interface Column {
  key: string;
  label: string;
  type?: "text" | "date" | "number";
  width?: number;
  computed?: (row: Row) => string;
  group?: string;
}

const NUM_FIELDS = ["costo_uvie", "ajuste", "planos", "supervision", "otros_1", "otros_2", "pago_1", "pago_2", "pago_3", "pago_4", "pago_5"];

// Column definition mirrors the SEDIVER excel sheet, in order
const COLUMNS: Column[] = [
  { key: "expediente", label: "Expediente", group: "ID" },
  { key: "folio", label: "Folio UVIE", group: "ID" },
  { key: "dictamen", label: "Folio Dictamen", group: "ID" },
  { key: "fecha_solicitud", label: "Fecha Solicitud", type: "date", group: "ID" },
  { key: "fecha_contrato", label: "Fecha Contrato", type: "date", group: "ID" },
  { key: "nombre_razon_social", label: "Nombre o Razón Social", width: 280, group: "Cliente" },
  { key: "anio", label: "Año", type: "number", group: "ID" },
  { key: "tipo_identificacion", label: "Tipo Identificación", group: "Cliente" },
  { key: "folio_identificacion", label: "Folio Identificación", group: "Cliente" },
  { key: "telefono", label: "Teléfono", group: "Cliente" },
  { key: "celular", label: "Celular", group: "Cliente" },
  { key: "correo_electronico", label: "Correo", width: 220, group: "Cliente" },
  { key: "calle", label: "Calle", width: 200, group: "Dirección" },
  { key: "numero_exterior", label: "Núm. Ext.", group: "Dirección" },
  { key: "numero_interior", label: "Núm. Int.", group: "Dirección" },
  { key: "entre_calle", label: "Entre Calle", group: "Dirección" },
  { key: "y_calle", label: "Y Calle", group: "Dirección" },
  { key: "cp", label: "CP", group: "Dirección" },
  { key: "entidad_federativa", label: "Entidad Fed.", group: "Dirección" },
  { key: "ciudad", label: "Ciudad", group: "Dirección" },
  { key: "municipio_alcaldia", label: "Municipio/Alcaldía", group: "Dirección" },
  { key: "colonia", label: "Colonia", group: "Dirección" },
  { key: "giro_instalacion", label: "Actividad Comercial", width: 180, group: "Cliente" },
  { key: "nombre_comercial", label: "Nombre Comercial", width: 200, group: "Cliente" },
  { key: "contrata_nombre", label: "Contrata - Nombre", group: "Contrata" },
  { key: "contrata_apellido_paterno", label: "Contrata - Ap. Paterno", group: "Contrata" },
  { key: "contrata_apellido_materno", label: "Contrata - Ap. Materno", group: "Contrata" },
  { key: "contrata_telefono", label: "Contrata - Tel", group: "Contrata" },
  { key: "contrata_celular", label: "Contrata - Cel", group: "Contrata" },
  { key: "contrata_correo", label: "Contrata - Correo", width: 220, group: "Contrata" },
  { key: "contrata_nacionalidad", label: "Contrata - Nacionalidad", group: "Contrata" },
  { key: "contrata_tipo_identificacion", label: "Contrata - Tipo ID", group: "Contrata" },
  { key: "contrata_curp", label: "Contrata - Identificación", group: "Contrata" },
  { key: "atiende_cargo", label: "Puesto", group: "Atiende" },
  { key: "atiende_nombre", label: "Atiende - Nombre", group: "Atiende" },
  { key: "atiende_apellido_paterno", label: "Atiende - Ap. Paterno", group: "Atiende" },
  { key: "atiende_apellido_materno", label: "Atiende - Ap. Materno", group: "Atiende" },
  { key: "atiende_telefono", label: "Atiende - Tel", group: "Atiende" },
  { key: "atiende_celular", label: "Atiende - Cel", group: "Atiende" },
  { key: "atiende_correo", label: "Atiende - Correo", width: 220, group: "Atiende" },
  { key: "atiende_nacionalidad", label: "Atiende - Nacionalidad", group: "Atiende" },
  { key: "atiende_tipo_identificacion", label: "Atiende - Tipo ID", group: "Atiende" },
  { key: "atiende_curp", label: "Atiende - Identificación", group: "Atiende" },
  { key: "representante_nombre", label: "Representante - Nombre", group: "Representante" },
  { key: "representante_apellido_paterno", label: "Representante - Ap. Paterno", group: "Representante" },
  { key: "representante_apellido_materno", label: "Representante - Ap. Materno", group: "Representante" },
  { key: "representante_telefono", label: "Representante - Tel", group: "Representante" },
  { key: "representante_celular", label: "Representante - Cel", group: "Representante" },
  { key: "representante_correo", label: "Representante - Correo", width: 220, group: "Representante" },
  { key: "representante_nacionalidad", label: "Representante - Nacionalidad", group: "Representante" },
  { key: "representante_tipo_identificacion", label: "Representante - Tipo ID", group: "Representante" },
  { key: "representante_curp", label: "Representante - Identificación", group: "Representante" },
  { key: "tension", label: "Tensión Suministro", group: "Instalación" },
  { key: "cap_subestacion_kva", label: "Cap. Subestación", group: "Instalación" },
  { key: "carga_instalada_kw", label: "Carga Instalada", group: "Instalación" },
  { key: "tipo_instalacion", label: "Tipo Instalación", width: 200, group: "Instalación" },
  { key: "alcance_verificacion_kw", label: "Alcance Verificación", group: "Instalación" },
  { key: "tipo_verificacion", label: "Tipo Verificación", width: 200, group: "Instalación" },
  { key: "num_servicio", label: "Núm. Servicio", group: "Servicio" },
  { key: "metros_cuadrados", label: "M²", group: "Servicio" },
  { key: "num_visitas", label: "Núm. Máx. Visitas", group: "Servicio" },
  { key: "costo_uvie", label: "Costo Verificación", type: "number", group: "Costos" },
  { key: "ajuste", label: "Ajuste", type: "number", group: "Costos" },
  { key: "planos", label: "Planos", type: "number", group: "Costos" },
  { key: "supervision", label: "Supervisión", type: "number", group: "Costos" },
  { key: "otros_1", label: "Otro 1", type: "number", group: "Costos" },
  { key: "otros_2", label: "Otro 2", type: "number", group: "Costos" },
  {
    key: "_total_cobrado", label: "Total Cobrado", group: "Costos",
    computed: (r) => money(num(r, "costo_uvie") + num(r, "ajuste") + num(r, "planos") + num(r, "supervision") + num(r, "otros_1") + num(r, "otros_2")),
  },
  {
    key: "_iva_cobrado", label: "IVA", group: "Costos",
    computed: (r) => money((num(r, "costo_uvie") + num(r, "ajuste") + num(r, "planos") + num(r, "supervision") + num(r, "otros_1") + num(r, "otros_2")) * 0.16),
  },
  {
    key: "_total_con_iva_cobrado", label: "Total c/IVA", group: "Costos",
    computed: (r) => money((num(r, "costo_uvie") + num(r, "ajuste") + num(r, "planos") + num(r, "supervision") + num(r, "otros_1") + num(r, "otros_2")) * 1.16),
  },
  { key: "pago_1", label: "Pago 1", type: "number", group: "Pagos" },
  { key: "pago_2", label: "Pago 2", type: "number", group: "Pagos" },
  { key: "pago_3", label: "Pago 3", type: "number", group: "Pagos" },
  { key: "pago_4", label: "Pago 4", type: "number", group: "Pagos" },
  { key: "pago_5", label: "Pago 5", type: "number", group: "Pagos" },
  {
    key: "_total_pagado", label: "Total Pagado", group: "Pagos",
    computed: (r) => money(num(r, "pago_1") + num(r, "pago_2") + num(r, "pago_3") + num(r, "pago_4") + num(r, "pago_5")),
  },
  {
    key: "_iva_pagado", label: "IVA Pagado", group: "Pagos",
    computed: (r) => money((num(r, "pago_1") + num(r, "pago_2") + num(r, "pago_3") + num(r, "pago_4") + num(r, "pago_5")) * 0.16),
  },
  {
    key: "_total_con_iva_pagado", label: "Total Pagado c/IVA", group: "Pagos",
    computed: (r) => money((num(r, "pago_1") + num(r, "pago_2") + num(r, "pago_3") + num(r, "pago_4") + num(r, "pago_5")) * 1.16),
  },
  { key: "comentarios", label: "Comentarios", width: 220, group: "Seguimiento" },
  { key: "oficio_cfe", label: "Oficio CFE", group: "Seguimiento" },
  { key: "dias", label: "Días", group: "Seguimiento" },
  { key: "area_clasificada", label: "Áreas Clasificadas", group: "Seguimiento" },
  { key: "primera_visita", label: "Primera Visita", type: "date", group: "Seguimiento" },
  { key: "segunda_visita", label: "Segunda Visita", type: "date", group: "Seguimiento" },
  { key: "tercera_visita", label: "Tercera Visita", type: "date", group: "Seguimiento" },
  { key: "fecha_dictamen", label: "Fecha Dictamen", type: "date", group: "Seguimiento" },
];

function num(r: Row, k: string): number {
  return Number(r[k] ?? 0) || 0;
}
function money(v: number): string {
  return v.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 });
}
function fmtDate(v: unknown): string {
  if (!v) return "";
  const s = String(v);
  return s.includes("T") ? s.split("T")[0] : s;
}
function fmt(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

interface CellProps {
  value: string;
  type: "text" | "date" | "number";
  onSave: (value: string) => Promise<void>;
}
function Cell({ value, type, onSave }: CellProps) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocal(value); }, [value]);
  useEffect(() => { if (editing) { ref.current?.focus(); ref.current?.select(); } }, [editing]);

  const commit = async () => {
    if (local === value) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(local);
      setEditing(false);
    } catch {
      toast.error("Error al guardar");
      setLocal(value);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={ref}
        type={type}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          else if (e.key === "Escape") { setLocal(value); setEditing(false); }
        }}
        className="w-full h-full px-1.5 py-0.5 text-[11px] outline-none ring-2 ring-primary bg-background"
        disabled={saving}
      />
    );
  }
  return (
    <div
      onClick={() => setEditing(true)}
      onDoubleClick={() => setEditing(true)}
      className="px-1.5 py-1 text-[11px] cursor-text hover:bg-primary/5 truncate min-h-[24px]"
      title={value || "Click para editar"}
    >
      {value || <span className="text-muted-foreground">—</span>}
    </div>
  );
}

interface ExpedienteSheetProps {
  rows: Row[];
  saveField: (id: string, field: string, value: unknown) => Promise<void>;
  onLocalUpdate: (id: string, field: string, value: unknown) => void;
}

export function ExpedienteSheet({ rows, saveField, onLocalUpdate }: ExpedienteSheetProps) {
  const [filter, setFilter] = useState("");

  const handleSave = useCallback(async (id: string, field: string, raw: string) => {
    let saveValue: unknown = raw;
    if (NUM_FIELDS.includes(field)) saveValue = raw === "" ? 0 : Number(raw);
    else if (field === "anio") saveValue = raw === "" ? null : Number(raw);
    else if (raw === "") saveValue = null;
    await saveField(id, field, saveValue);
    onLocalUpdate(id, field, saveValue);
  }, [saveField, onLocalUpdate]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return rows;
    const f = filter.toLowerCase();
    return rows.filter((r) =>
      COLUMNS.some((c) => String(r[c.key] ?? "").toLowerCase().includes(f))
    );
  }, [rows, filter]);

  // group columns to render two-row header (group + label) like Excel
  const groupSpans = useMemo(() => {
    const result: { name: string; span: number }[] = [];
    let cur: { name: string; span: number } | null = null;
    for (const c of COLUMNS) {
      const g = c.group ?? "";
      if (cur && cur.name === g) cur.span += 1;
      else { cur = { name: g, span: 1 }; result.push(cur); }
    }
    return result;
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar en la hoja..."
          className="h-8 px-2 text-xs border rounded-md w-64 bg-background"
        />
        <span className="text-xs text-muted-foreground">
          {filtered.length} expediente{filtered.length === 1 ? "" : "s"} · {COLUMNS.length} columnas · click en una celda para editar
        </span>
      </div>

      <div className="border rounded-md overflow-auto max-h-[70vh] relative" style={{ resize: "vertical" }}>
        <table className="border-collapse text-[11px]" style={{ minWidth: "100%" }}>
          <thead className="sticky top-0 z-20">
            <tr className="bg-primary/15">
              <th className="sticky left-0 z-30 bg-primary/20 border border-border px-2 py-1 font-bold text-[10px] uppercase w-10">#</th>
              {groupSpans.map((g, i) => (
                <th
                  key={i}
                  colSpan={g.span}
                  className="border border-border px-2 py-1 font-bold text-[10px] uppercase bg-primary/15 text-primary"
                >
                  {g.name}
                </th>
              ))}
            </tr>
            <tr className="bg-muted">
              <th className="sticky left-0 z-30 bg-muted border border-border px-2 py-1 font-semibold text-[10px] w-10">Fila</th>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className="border border-border px-1.5 py-1 font-semibold text-[10px] text-left whitespace-nowrap"
                  style={{ minWidth: c.width ?? 120 }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="text-center py-8 text-muted-foreground">
                  No hay expedientes
                </td>
              </tr>
            )}
            {filtered.map((row, rowIdx) => {
              const id = row.id as string;
              return (
                <tr key={id} className="hover:bg-accent/10">
                  <td className="sticky left-0 z-10 bg-muted/60 border border-border text-center font-semibold text-[10px] text-muted-foreground">
                    {rowIdx + 1}
                  </td>
                  {COLUMNS.map((c) => {
                    if (c.computed) {
                      return (
                        <td key={c.key} className="border border-border bg-accent/10 px-1.5 py-1 text-[11px] font-medium whitespace-nowrap">
                          {c.computed(row)}
                        </td>
                      );
                    }
                    const t = c.type ?? "text";
                    const display = t === "date" ? fmtDate(row[c.key]) : fmt(row[c.key]);
                    return (
                      <td key={c.key} className="border border-border p-0 align-top">
                        <Cell
                          value={display}
                          type={t}
                          onSave={(v) => handleSave(id, c.key, v)}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
