
-- Table for client access tokens (link + password for each client)
CREATE TABLE public.client_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  access_code TEXT NOT NULL UNIQUE,
  access_password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Main form submissions table
CREATE TABLE public.sediver_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_access_id UUID REFERENCES public.client_access(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Header
  expediente TEXT,
  folio TEXT,
  fecha_solicitud DATE,
  folio_sediver TEXT,
  anio INTEGER DEFAULT 2026,
  fecha_contrato DATE,
  dictamen TEXT,
  fecha_dictamen DATE,
  
  -- Datos del solicitante
  nombre_razon_social TEXT,
  tipo_persona TEXT,
  tipo_identificacion TEXT,
  folio_identificacion TEXT,
  telefono TEXT,
  celular TEXT,
  correo_electronico TEXT,
  
  -- Dirección
  calle TEXT,
  numero_exterior TEXT,
  numero_interior TEXT,
  entre_calle TEXT,
  y_calle TEXT,
  cp TEXT,
  entidad_federativa TEXT,
  ciudad TEXT,
  municipio_alcaldia TEXT,
  colonia TEXT,
  
  -- Giro
  giro_instalacion TEXT,
  nombre_comercial TEXT,
  
  -- Persona que contrata
  contrata_nombre TEXT,
  contrata_apellido_paterno TEXT,
  contrata_apellido_materno TEXT,
  contrata_telefono TEXT,
  contrata_celular TEXT,
  contrata_correo TEXT,
  contrata_nacionalidad TEXT DEFAULT 'MEXICANA',
  contrata_tipo_identificacion TEXT,
  contrata_folio TEXT,
  contrata_curp TEXT,
  
  -- Persona que atiende visita
  atiende_nombre TEXT,
  atiende_apellido_paterno TEXT,
  atiende_apellido_materno TEXT,
  atiende_cargo TEXT,
  atiende_telefono TEXT,
  atiende_celular TEXT,
  atiende_correo TEXT,
  atiende_nacionalidad TEXT DEFAULT 'MEXICANA',
  atiende_tipo_identificacion TEXT,
  atiende_folio TEXT,
  atiende_curp TEXT,
  
  -- Representante que firma contrato
  representante_nombre TEXT,
  representante_apellido_paterno TEXT,
  representante_apellido_materno TEXT,
  representante_telefono TEXT,
  representante_celular TEXT,
  representante_correo TEXT,
  representante_nacionalidad TEXT DEFAULT 'MEXICANA',
  representante_tipo_identificacion TEXT,
  representante_folio TEXT,
  representante_curp TEXT,
  
  -- Características de la instalación
  tension TEXT,
  cap_subestacion_kva TEXT,
  carga_instalada_kw TEXT,
  alcance_verificacion_kw TEXT,
  tipo_instalacion TEXT,
  tipo_verificacion TEXT,
  area_clasificada TEXT,
  otro_tipo_instalacion TEXT,
  
  -- Otra información
  num_visitas TEXT,
  metros_cuadrados TEXT,
  carga_alumbrado TEXT,
  tipo_concentracion TEXT,
  
  -- Costos
  costo_uvie NUMERIC DEFAULT 0,
  ajuste NUMERIC DEFAULT 0,
  planos NUMERIC DEFAULT 0,
  supervision NUMERIC DEFAULT 0,
  otros_1 NUMERIC DEFAULT 0,
  otros_2 NUMERIC DEFAULT 0,
  
  -- Pagos
  pago_1 NUMERIC DEFAULT 0,
  pago_2 NUMERIC DEFAULT 0,
  pago_3 NUMERIC DEFAULT 0,
  pago_4 NUMERIC DEFAULT 0,
  pago_5 NUMERIC DEFAULT 0,
  
  -- Subestación y equipos
  subestacion_compartida TEXT,
  subestacion_kva TEXT,
  modulos JSONB DEFAULT '[]'::jsonb,
  inversores JSONB DEFAULT '[]'::jsonb,
  
  notas TEXT
);

-- Admin role table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sediver_submissions ENABLE ROW LEVEL SECURITY;

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Admins can view roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS for client_access - admins can manage
CREATE POLICY "Admins can manage client_access"
ON public.client_access FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS for submissions - admins can view all
CREATE POLICY "Admins can manage submissions"
ON public.sediver_submissions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Anonymous users can insert/update submissions via access code (handled by server functions)
CREATE POLICY "Anon can insert submissions"
ON public.sediver_submissions FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Anon can update own submissions"
ON public.sediver_submissions FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Anon can select own submissions"
ON public.sediver_submissions FOR SELECT
TO anon
USING (true);

-- Anon can read client_access to verify codes
CREATE POLICY "Anon can verify access codes"
ON public.client_access FOR SELECT
TO anon
USING (true);
