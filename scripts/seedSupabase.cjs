const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://bktvvpsqjoibjyyuvhxi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdHZ2cHNxam9pYmp5eXV2aHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNDM5MTUsImV4cCI6MjEwMzYxOTkxNX0.GOG1b-BNOoBIYSKTm_rXjpltdJdnpjL9yy_-YJ7fAp8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  console.log('Iniciando carga inicial a Supabase...')
  const raw = fs.readFileSync('./src/initialData.json', 'utf8')
  const data = JSON.parse(raw)

  // 1. Periodos
  const meses = data.meses || []
  console.log(`Cargando ${meses.length} períodos...`)
  const periodosData = meses.map(m => {
    const parts = m.trim().split(' ')
    const yearShort = parts[parts.length - 1]
    const yearFull = yearShort.length === 2 ? `20${yearShort}` : yearShort
    const month = parts.slice(0, parts.length - 1).join(' ')
    return { nombre: m.trim(), anio: yearFull, mes: month, activo: true }
  })
  
  const { error: errPeriodos } = await supabase.from('periodos').upsert(periodosData, { onConflict: 'nombre' })
  if (errPeriodos) console.error('Error cargando periodos:', errPeriodos.message)
  else console.log('✓ Períodos sincronizados.')

  // 2. Maestros
  console.log('Cargando tablas maestras...')
  const maestros = data.maestros || {}
  const maestrosRows = []
  for (const [cat, list] of Object.entries(maestros)) {
    if (Array.isArray(list)) {
      list.forEach(nombre => {
        if (nombre && String(nombre).trim()) {
          maestrosRows.push({ categoria: cat, nombre: String(nombre).trim(), activo: true })
        }
      })
    }
  }
  
  // Batch insert maestros in chunks of 500
  for (let i = 0; i < maestrosRows.length; i += 500) {
    const chunk = maestrosRows.slice(i, i + 500)
    const { error: errM } = await supabase.from('maestros').upsert(chunk, { onConflict: 'categoria,nombre' })
    if (errM) console.error(`Error en maestros lote ${i}:`, errM.message)
  }
  console.log(`✓ ${maestrosRows.length} registros de tablas maestras sincronizados.`)

  // 3. Movimientos
  const movs = data.movimientos || data.movimientosEnero || []
  console.log(`Cargando ${movs.length} movimientos en lotes...`)
  
  const mappedMovs = movs.map((m, idx) => ({
    fecha: m.fecha || '2026-01-01',
    factura_nro: m.facturaNro || null,
    rubro: m.rubro || 'PROVEEDOR',
    empresa_concepto: m.empresaConcepto || 'Sin Nombre',
    detalle: m.detalle || null,
    detalle_extenso: m.detalleExtenso || null,
    realizado_en: m.realizadoEn || null,
    fecha_pago: m.fechaPago || null,
    cheque_operacion: m.chequeOperacion || null,
    mes_periodo: m.mesPeriodo || 'ENERO 26',
    pagos_s: Number(m.pagosS || 0),
    ingresos_s: Number(m.ingresosS || 0),
    pagos_med: Number(m.pagosMed || 0),
    retenciones_med: Number(m.retencionesMed || 0),
    neto_pagado_med: Number(m.netoPagadoMed || 0),
    alquiler_cpo_salon: Number(m.alquilerCpoSalon || 0),
    venta_cantina: Number(m.ventaCantina || 0),
    uso_natatorio: Number(m.usoNatatorio || 0),
    alqui_consultorios: Number(m.alquiConsultorios || 0),
    practicas: Number(m.practicas || 0),
    consultas: Number(m.consultas || 0),
    enfermeria: Number(m.enfermeria || 0),
    odontologia: Number(m.odontologia || 0),
    ot_ingresos: Number(m.otIngresos || 0),
    compensaciones: Number(m.compensaciones || 0),
    total: Number(m.total || 0),
    observaciones: m.observaciones || null
  }))

  for (let i = 0; i < mappedMovs.length; i += 300) {
    const chunk = mappedMovs.slice(i, i + 300)
    const { error: errMov } = await supabase.from('movimientos').insert(chunk)
    if (errMov) console.error(`Error en movimientos lote ${i}:`, errMov.message)
    else console.log(`✓ Insertados ${i + chunk.length} de ${mappedMovs.length} movimientos...`)
  }

  console.log('¡Sincronización inicial completada con éxito!')
}

seed().catch(console.error)