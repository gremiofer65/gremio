const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://bktvvpsqjoibjyyuvhxi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdHZ2cHNxam9pYmp5eXV2aHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNDM5MTUsImV4cCI6MjEwMzYxOTkxNX0.GOG1b-BNOoBIYSKTm_rXjpltdJdnpjL9yy_-YJ7fAp8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectAllPending() {
  const { data: movs, error } = await supabase.from('movimientos').select('*').order('fecha', { ascending: true })
  if (error) {
    console.error('Error fetching Supabase:', error)
    return
  }

  const pending = movs.filter(m => !m.fecha_pago)
  console.log('TOTAL PENDIENTES EN SUPABASE:', pending.length)

  const grouped = {}
  pending.forEach(m => {
    const emp = m.empresa_concepto || 'SIN EMPRESA'
    if (!grouped[emp]) grouped[emp] = []
    grouped[emp].push(m)
  })

  let totalMontoPendiente = 0

  Object.entries(grouped).forEach(([empresa, list]) => {
    console.log('======================================================================')
    console.log('EMPRESA / PROFESIONAL:', empresa, `(${list.length} comprobantes pendientes)`)
    list.forEach(m => {
      const monto = m.rubro === 'MÉDICO' ? Number(m.neto_pagado_med || m.pagos_med || 0) : (m.rubro === 'INGRESOS' ? Number(m.total || 0) : Number(m.pagos_s || 0))
      totalMontoPendiente += monto
      console.log(`  * ID: ${m.id}`)
      console.log(`    Fecha: ${m.fecha} | Periodo: ${m.mes_periodo} | Rubro: ${m.rubro}`)
      console.log(`    Factura: ${m.factura_nro || 'S/N'} | Monto: $${monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`)
      console.log(`    Detalle: ${m.detalle || '-'}`)
      if (m.detalle_extenso) console.log(`    Detalle Extenso: ${m.detalle_extenso}`)
      if (m.cheque_operacion) console.log(`    Cheque / Operación: ${m.cheque_operacion}`)
      if (m.observaciones) console.log(`    Observaciones: ${m.observaciones}`)
      console.log('----------------------------------------------------------------------')
    })
  })

  console.log(`TOTAL MONTO PENDIENTE GLOBAL: $${totalMontoPendiente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`)
}

inspectAllPending()
