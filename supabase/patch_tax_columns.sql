-- ==============================================================================
-- AGREGAR COLUMNAS FISCALES PARA LIBRO IVA COMPRAS
-- Ejecutar en Supabase Dashboard -> SQL Editor (si se desea tener columnas dedicadas)
-- ==============================================================================

ALTER TABLE movimientos ADD COLUMN IF NOT EXISTS tipo_comprobante VARCHAR(50);
ALTER TABLE movimientos ADD COLUMN IF NOT EXISTS neto_gravado NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE movimientos ADD COLUMN IF NOT EXISTS alicuota_iva NUMERIC(5, 2) DEFAULT 21;
ALTER TABLE movimientos ADD COLUMN IF NOT EXISTS iva_importe NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE movimientos ADD COLUMN IF NOT EXISTS iva_no_gravado NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE movimientos ADD COLUMN IF NOT EXISTS percepciones NUMERIC(15, 2) DEFAULT 0;

-- Recargar la caché de esquema de PostgREST
NOTIFY pgrst, 'reload schema';
