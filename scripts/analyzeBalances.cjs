const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://bktvvpsqjoibjyyuvhxi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdHZ2cHNxam9pYmp5eXV2aHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNDM5MTUsImV4cCI6MjEwMzYxOTkxNX0.GOG1b-BNOoBIYSKTm_rXjpltdJdnpjL9yy_-YJ7fAp8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeCC() {
  const { data: movs, error } = await supabase.from('movimientos').select('*').order('fecha', { ascending: true })
  if (error) {
    console.error('Error:', error)
    return
  }

  const map = {}
  for (const m of movs) {
    const ent = m.empresa_concepto || 'SIN NOMBRE'
    if (!map[ent]) {
      map[ent] = {
        nombre: ent,
        rubro: m.rubro,
        totalDebito: 0,
        totalCredito: 0,
        movimientos: []
      }
    }
    let debito = 0
    let credito = 0

    if (m.rubro === 'MÉDICO') {
      debito = Number(m.neto_pagado_med || m.pagos_med || 0)
      credito = m.fecha_pago ? debito : 0
    } else if (m.rubro === 'INGRESOS') {
      debito = Number(m.total || 0)
      credito = m.fecha_pago ? debito : 0
    } else {
      const monto = Number(m.pagos_s || 0)
      debito = monto
      credito = m.fecha_pago ? monto : 0
    }

    map[ent].totalDebito += debito
    map[ent].totalCredito += credito
    map[ent].movimientos.push({
      id: m.id,
      fecha: m.fecha,
      periodo: m.mes_periodo,
      factura: m.factura_nro,
      detalle: m.detalle,
      detalle_extenso: m.detalle_extenso,
      debito,
      fecha_pago: m.fecha_pago,
      cheque: m.cheque_operacion,
      observaciones: m.observaciones
    })
  }

  const conSaldo = Object.values(map)
    .map(e => ({ ...e, saldo: e.totalDebito - e.totalCredito }))
    .filter(e => Math.abs(e.saldo) > 0.01)
    .sort((a, b) => b.saldo - a.saldo)

  console.log(`=== TOTAL DE CUENTAS CORRIENTES CON SALDO PENDIENTE: ${conSaldo.length} ===\n`)
  conSaldo.forEach(e => {
    console.log(`----------------------------------------------------------------------`)
    console.log(`CUENTA: [${e.rubro}] ${e.nombre}`)
    console.log(`Total Facturado/Débito: $${e.totalDebito.toFixed(2)} | Total Pagado: $${e.totalCredito.toFixed(2)} | SALDO: $${e.saldo.toFixed(2)}`)
    console.log(`Movimientos Pendientes (${e.movimientos.filter(m => !m.fecha_pago).length}):`)
    e.movimientos.filter(m => !m.fecha_pago).forEach(m => {
      console.log(`  - [ID: ${m.id}] Fecha: ${m.fecha} | Periodo: ${m.periodo} | Factura: ${m.factura || 'S/N'} | Monto: $${m.debito.toFixed(2)} | Detalle: ${m.detalle || '-'} ${m.detalle_extenso ? '[' + m.detalle_extenso + ']' : ''} | Cheque/Ref: ${m.cheque || '-'} | Obs: ${m.observaciones || '-'}`)
    })
  })
}

analyzeCC()
