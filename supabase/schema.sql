-- ==============================================================================
-- SISTEMA DE GESTIÓN CONTABLE Y FINANCIERA - SCHEMA SUPABASE
-- Proyecto: https://bktvvpsqjoibjyyuvhxi.supabase.co
-- ==============================================================================

-- 1. TABLA DE PERÍODOS CONTABLES
CREATE TABLE IF NOT EXISTS periodos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) UNIQUE NOT NULL, -- ej: "ENERO 26", "FEBRERO 26"
    anio VARCHAR(10) NOT NULL,
    mes VARCHAR(20) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA DE TABLAS MAESTRAS / CATÁLOGOS
CREATE TABLE IF NOT EXISTS maestros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria VARCHAR(50) NOT NULL, -- 'proveedores', 'medicos', 'empleados', 'sedes', 'impuestos', 'ingresosTipos', 'rubros'
    nombre VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(categoria, nombre)
);

-- 3. TABLA PRINCIPAL DE MOVIMIENTOS (LIBRO DIARIO & CUENTA CORRIENTE)
CREATE TABLE IF NOT EXISTS movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    factura_nro VARCHAR(100),
    rubro VARCHAR(50) NOT NULL, -- 'PROVEEDOR', 'MÉDICO', 'EMPLEADOS', 'IMPUESTO', 'SEGUROS', 'INGRESOS'
    empresa_concepto VARCHAR(255) NOT NULL,
    detalle VARCHAR(255),
    detalle_extenso TEXT,
    realizado_en VARCHAR(150),
    fecha_pago DATE,
    cheque_operacion VARCHAR(150),
    mes_periodo VARCHAR(50),

    -- Egresos Generales
    pagos_s NUMERIC(15, 2) DEFAULT 0,
    ingresos_s NUMERIC(15, 2) DEFAULT 0,

    -- Honorarios Médicos
    pagos_med NUMERIC(15, 2) DEFAULT 0,
    retenciones_med NUMERIC(15, 2) DEFAULT 0,
    neto_pagado_med NUMERIC(15, 2) DEFAULT 0,

    -- Desglose de Ingresos
    alquiler_cpo_salon NUMERIC(15, 2) DEFAULT 0,
    venta_cantina NUMERIC(15, 2) DEFAULT 0,
    uso_natatorio NUMERIC(15, 2) DEFAULT 0,
    alqui_consultorios NUMERIC(15, 2) DEFAULT 0,
    practicas NUMERIC(15, 2) DEFAULT 0,
    consultas NUMERIC(15, 2) DEFAULT 0,
    enfermeria NUMERIC(15, 2) DEFAULT 0,
    odontologia NUMERIC(15, 2) DEFAULT 0,
    ot_ingresos NUMERIC(15, 2) DEFAULT 0,
    compensaciones NUMERIC(15, 2) DEFAULT 0,
    total NUMERIC(15, 2) DEFAULT 0,

    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ÍNDICES DE ALTO RENDIMIENTO PARA BÚSQUEDAS RÁPIDAS
CREATE INDEX IF NOT EXISTS idx_movimientos_periodo ON movimientos(mes_periodo);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos(fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_empresa ON movimientos(empresa_concepto);
CREATE INDEX IF NOT EXISTS idx_movimientos_rubro ON movimientos(rubro);
CREATE INDEX IF NOT EXISTS idx_movimientos_factura ON movimientos(factura_nro);

-- 5. POLÍTICAS DE ACCESO RLS (Row Level Security)
ALTER TABLE periodos ENABLE ROW LEVEL SECURITY;
ALTER TABLE maestros ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura y escritura públicas/autenticadas
CREATE POLICY "Permitir lectura publica de periodos" ON periodos FOR SELECT USING (true);
CREATE POLICY "Permitir insercion/actualizacion de periodos" ON periodos FOR ALL USING (true);

CREATE POLICY "Permitir lectura publica de maestros" ON maestros FOR SELECT USING (true);
CREATE POLICY "Permitir insercion/actualizacion de maestros" ON maestros FOR ALL USING (true);

CREATE POLICY "Permitir lectura publica de movimientos" ON movimientos FOR SELECT USING (true);
CREATE POLICY "Permitir insercion/actualizacion de movimientos" ON movimientos FOR ALL USING (true);