export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          can_delete_clients: boolean
          can_download_submissions: boolean
          can_manage_clients: boolean
          can_view_submissions: boolean
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_delete_clients?: boolean
          can_download_submissions?: boolean
          can_manage_clients?: boolean
          can_view_submissions?: boolean
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_delete_clients?: boolean
          can_download_submissions?: boolean
          can_manage_clients?: boolean
          can_view_submissions?: boolean
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_access: {
        Row: {
          access_code: string
          access_password: string
          client_name: string
          created_at: string
          created_by: string | null
          id: string
        }
        Insert: {
          access_code: string
          access_password: string
          client_name: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Update: {
          access_code?: string
          access_password?: string
          client_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Relationships: []
      }
      sediver_submissions: {
        Row: {
          ajuste: number | null
          alcance_verificacion_kw: string | null
          anio: number | null
          area_clasificada: string | null
          atiende_apellido_materno: string | null
          atiende_apellido_paterno: string | null
          atiende_cargo: string | null
          atiende_celular: string | null
          atiende_correo: string | null
          atiende_curp: string | null
          atiende_folio: string | null
          atiende_nacionalidad: string | null
          atiende_nombre: string | null
          atiende_telefono: string | null
          atiende_tipo_identificacion: string | null
          calle: string | null
          cap_subestacion_kva: string | null
          carga_alumbrado: string | null
          carga_instalada_kw: string | null
          celular: string | null
          ciudad: string | null
          client_access_id: string
          colonia: string | null
          comentarios: string | null
          contrata_apellido_materno: string | null
          contrata_apellido_paterno: string | null
          contrata_celular: string | null
          contrata_correo: string | null
          contrata_curp: string | null
          contrata_folio: string | null
          contrata_nacionalidad: string | null
          contrata_nombre: string | null
          contrata_telefono: string | null
          contrata_tipo_identificacion: string | null
          correo_electronico: string | null
          costo_uvie: number | null
          cp: string | null
          created_at: string
          dias: string | null
          dictamen: string | null
          entidad_federativa: string | null
          entre_calle: string | null
          expediente: string | null
          fecha_contrato: string | null
          fecha_dictamen: string | null
          fecha_solicitud: string | null
          folio: string | null
          folio_identificacion: string | null
          folio_sediver: string | null
          giro_instalacion: string | null
          id: string
          inversores: Json | null
          metros_cuadrados: string | null
          modulos: Json | null
          municipio_alcaldia: string | null
          nombre_comercial: string | null
          nombre_razon_social: string | null
          notas: string | null
          num_servicio: string | null
          num_visitas: string | null
          numero_exterior: string | null
          numero_interior: string | null
          oficio_cfe: string | null
          otro_tipo_instalacion: string | null
          otros_1: number | null
          otros_2: number | null
          pago_1: number | null
          pago_2: number | null
          pago_3: number | null
          pago_4: number | null
          pago_5: number | null
          planos: number | null
          primera_visita: string | null
          representante_apellido_materno: string | null
          representante_apellido_paterno: string | null
          representante_celular: string | null
          representante_correo: string | null
          representante_curp: string | null
          representante_folio: string | null
          representante_nacionalidad: string | null
          representante_nombre: string | null
          representante_telefono: string | null
          representante_tipo_identificacion: string | null
          segunda_visita: string | null
          status: string
          subestacion_compartida: string | null
          subestacion_kva: string | null
          submitted_at: string | null
          supervision: number | null
          telefono: string | null
          tension: string | null
          tercera_visita: string | null
          tipo_concentracion: string | null
          tipo_identificacion: string | null
          tipo_instalacion: string | null
          tipo_persona: string | null
          tipo_verificacion: string | null
          updated_at: string
          y_calle: string | null
        }
        Insert: {
          ajuste?: number | null
          alcance_verificacion_kw?: string | null
          anio?: number | null
          area_clasificada?: string | null
          atiende_apellido_materno?: string | null
          atiende_apellido_paterno?: string | null
          atiende_cargo?: string | null
          atiende_celular?: string | null
          atiende_correo?: string | null
          atiende_curp?: string | null
          atiende_folio?: string | null
          atiende_nacionalidad?: string | null
          atiende_nombre?: string | null
          atiende_telefono?: string | null
          atiende_tipo_identificacion?: string | null
          calle?: string | null
          cap_subestacion_kva?: string | null
          carga_alumbrado?: string | null
          carga_instalada_kw?: string | null
          celular?: string | null
          ciudad?: string | null
          client_access_id: string
          colonia?: string | null
          comentarios?: string | null
          contrata_apellido_materno?: string | null
          contrata_apellido_paterno?: string | null
          contrata_celular?: string | null
          contrata_correo?: string | null
          contrata_curp?: string | null
          contrata_folio?: string | null
          contrata_nacionalidad?: string | null
          contrata_nombre?: string | null
          contrata_telefono?: string | null
          contrata_tipo_identificacion?: string | null
          correo_electronico?: string | null
          costo_uvie?: number | null
          cp?: string | null
          created_at?: string
          dias?: string | null
          dictamen?: string | null
          entidad_federativa?: string | null
          entre_calle?: string | null
          expediente?: string | null
          fecha_contrato?: string | null
          fecha_dictamen?: string | null
          fecha_solicitud?: string | null
          folio?: string | null
          folio_identificacion?: string | null
          folio_sediver?: string | null
          giro_instalacion?: string | null
          id?: string
          inversores?: Json | null
          metros_cuadrados?: string | null
          modulos?: Json | null
          municipio_alcaldia?: string | null
          nombre_comercial?: string | null
          nombre_razon_social?: string | null
          notas?: string | null
          num_servicio?: string | null
          num_visitas?: string | null
          numero_exterior?: string | null
          numero_interior?: string | null
          oficio_cfe?: string | null
          otro_tipo_instalacion?: string | null
          otros_1?: number | null
          otros_2?: number | null
          pago_1?: number | null
          pago_2?: number | null
          pago_3?: number | null
          pago_4?: number | null
          pago_5?: number | null
          planos?: number | null
          primera_visita?: string | null
          representante_apellido_materno?: string | null
          representante_apellido_paterno?: string | null
          representante_celular?: string | null
          representante_correo?: string | null
          representante_curp?: string | null
          representante_folio?: string | null
          representante_nacionalidad?: string | null
          representante_nombre?: string | null
          representante_telefono?: string | null
          representante_tipo_identificacion?: string | null
          segunda_visita?: string | null
          status?: string
          subestacion_compartida?: string | null
          subestacion_kva?: string | null
          submitted_at?: string | null
          supervision?: number | null
          telefono?: string | null
          tension?: string | null
          tercera_visita?: string | null
          tipo_concentracion?: string | null
          tipo_identificacion?: string | null
          tipo_instalacion?: string | null
          tipo_persona?: string | null
          tipo_verificacion?: string | null
          updated_at?: string
          y_calle?: string | null
        }
        Update: {
          ajuste?: number | null
          alcance_verificacion_kw?: string | null
          anio?: number | null
          area_clasificada?: string | null
          atiende_apellido_materno?: string | null
          atiende_apellido_paterno?: string | null
          atiende_cargo?: string | null
          atiende_celular?: string | null
          atiende_correo?: string | null
          atiende_curp?: string | null
          atiende_folio?: string | null
          atiende_nacionalidad?: string | null
          atiende_nombre?: string | null
          atiende_telefono?: string | null
          atiende_tipo_identificacion?: string | null
          calle?: string | null
          cap_subestacion_kva?: string | null
          carga_alumbrado?: string | null
          carga_instalada_kw?: string | null
          celular?: string | null
          ciudad?: string | null
          client_access_id?: string
          colonia?: string | null
          comentarios?: string | null
          contrata_apellido_materno?: string | null
          contrata_apellido_paterno?: string | null
          contrata_celular?: string | null
          contrata_correo?: string | null
          contrata_curp?: string | null
          contrata_folio?: string | null
          contrata_nacionalidad?: string | null
          contrata_nombre?: string | null
          contrata_telefono?: string | null
          contrata_tipo_identificacion?: string | null
          correo_electronico?: string | null
          costo_uvie?: number | null
          cp?: string | null
          created_at?: string
          dias?: string | null
          dictamen?: string | null
          entidad_federativa?: string | null
          entre_calle?: string | null
          expediente?: string | null
          fecha_contrato?: string | null
          fecha_dictamen?: string | null
          fecha_solicitud?: string | null
          folio?: string | null
          folio_identificacion?: string | null
          folio_sediver?: string | null
          giro_instalacion?: string | null
          id?: string
          inversores?: Json | null
          metros_cuadrados?: string | null
          modulos?: Json | null
          municipio_alcaldia?: string | null
          nombre_comercial?: string | null
          nombre_razon_social?: string | null
          notas?: string | null
          num_servicio?: string | null
          num_visitas?: string | null
          numero_exterior?: string | null
          numero_interior?: string | null
          oficio_cfe?: string | null
          otro_tipo_instalacion?: string | null
          otros_1?: number | null
          otros_2?: number | null
          pago_1?: number | null
          pago_2?: number | null
          pago_3?: number | null
          pago_4?: number | null
          pago_5?: number | null
          planos?: number | null
          primera_visita?: string | null
          representante_apellido_materno?: string | null
          representante_apellido_paterno?: string | null
          representante_celular?: string | null
          representante_correo?: string | null
          representante_curp?: string | null
          representante_folio?: string | null
          representante_nacionalidad?: string | null
          representante_nombre?: string | null
          representante_telefono?: string | null
          representante_tipo_identificacion?: string | null
          segunda_visita?: string | null
          status?: string
          subestacion_compartida?: string | null
          subestacion_kva?: string | null
          submitted_at?: string | null
          supervision?: number | null
          telefono?: string | null
          tension?: string | null
          tercera_visita?: string | null
          tipo_concentracion?: string | null
          tipo_identificacion?: string | null
          tipo_instalacion?: string | null
          tipo_persona?: string | null
          tipo_verificacion?: string | null
          updated_at?: string
          y_calle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sediver_submissions_client_access_id_fkey"
            columns: ["client_access_id"]
            isOneToOne: false
            referencedRelation: "client_access"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "super_admin"],
    },
  },
} as const
