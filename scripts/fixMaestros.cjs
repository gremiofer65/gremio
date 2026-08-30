const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('https://bktvvpsqjoibjyyuvhxi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdHZ2cHNxam9pYmp5eXV2aHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNDM5MTUsImV4cCI6MjEwMzYxOTkxNX0.GOG1b-BNOoBIYSKTm_rXjpltdJdnpjL9yy_-YJ7fAp8')

async function fix() {
  console.log('Limpiando maestros incorrectos en sedes e impuestos...')
  // Eliminar sedes que en realidad eran impuestos
  await supabase.from('maestros').delete().match({ categoria: 'sedes' })
  await supabase.from('maestros').delete().match({ categoria: 'rubros' })
  await supabase.from('maestros').delete().match({ categoria: 'impuestos' })

  // 1. Sedes Reales
  const sedesReales = [
    'Sede Social',
    'Policlinica AMOS',
    'Centro Cultural',
    'Campo Deportes',
    'Salon Fiesta',
    'Natatorio / Campo'
  ]
  const sedesRows = sedesReales.map(nombre => ({ categoria: 'sedes', nombre, activo: true }))
  await supabase.from('maestros').insert(sedesRows)

  // 2. Rubros Oficiales
  const rubrosReales = [
    'PROVEEDOR',
    'MÉDICO',
    'EMPLEADOS',
    'IMPUESTO',
    'SEGUROS',
    'INGRESOS'
  ]
  const rubrosRows = rubrosReales.map(nombre => ({ categoria: 'rubros', nombre, activo: true }))
  await supabase.from('maestros').insert(rubrosRows)

  // 3. Impuestos y Organismos Reales
  const impuestosReales = [
    'ARBA',
    'ARCA Vep 931',
    'FAECyS',
    'IAM SEGURO',
    'La Estrella Seg de Retiro',
    'Sind.U de Guardavidas',
    'Municipalidad de Chivilcoy'
  ]
  const impuestosRows = impuestosReales.map(nombre => ({ categoria: 'impuestos', nombre, activo: true }))
  await supabase.from('maestros').insert(impuestosRows)

  console.log('✓ Tablas Maestras corregidas y sincronizadas en Supabase!')
}

fix()