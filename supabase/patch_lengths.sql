-- Aumentar longitud de columnas para admitir textos largos
ALTER TABLE movimientos ALTER COLUMN cheque_operacion TYPE TEXT;
ALTER TABLE movimientos ALTER COLUMN realizado_en TYPE TEXT;
ALTER TABLE movimientos ALTER COLUMN detalle TYPE TEXT;
ALTER TABLE movimientos ALTER COLUMN factura_nro TYPE TEXT;