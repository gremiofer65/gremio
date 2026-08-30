const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('https://bktvvpsqjoibjyyuvhxi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdHZ2cHNxam9pYmp5eXV2aHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNDM5MTUsImV4cCI6MjEwMzYxOTkxNX0.GOG1b-BNOoBIYSKTm_rXjpltdJdnpjL9yy_-YJ7fAp8')

async function fixAll() {
  console.log('Restructurando maestros de forma 100% correcta...')
  await supabase.from('maestros').delete().neq('categoria', 'dummy')

  // 1. Sedes Reales
  const sedes = [
    'Sede Social',
    'Policlinica AMOS',
    'Centro Cultural',
    'Campo Deportes',
    'Salon Fiesta',
    'Natatorio'
  ]

  // 2. Rubros
  const rubros = [
    'PROVEEDOR',
    'MÉDICO',
    'EMPLEADOS',
    'IMPUESTO',
    'SEGUROS',
    'INGRESOS'
  ]

  // 3. Empleados reales (los que estaban guardados bajo impuestos erróneamente)
  const empleados = [
    "ACOSTA ROMINA ALEJANDRA",
    "BARBELLA CARINA ROSANA",
    "BORRE SABRINA",
    "BRUNO PAMELA",
    "Bruno Pamela Soledad",
    "CHILLI ESTELA GLADYS (T)",
    "COMUNELLI NESTOR JORGE",
    "DEFINA CECILIA",
    "DIRENZO MARISOL YANINA",
    "FARIAS RICARDO (T)",
    "GIRIBUELA MARISA IRENE (T)",
    "HEREDIA ROBERTO ALCIDES",
    "LARROSA JOSE LUIS",
    "Lopardo Franco Ezequiel",
    "MATO CARINA SOLEDAD",
    "ORLANDI MARIA RITA",
    "PALERMO BERNARDO",
    "PALOMEQUE WALTER (T)",
    "RAMIREZ ROBERTO VICTOR",
    "ROMANELLI FELIPE (T)",
    "SARTORELLI ALBERTO OSCAR (T)",
    "SILVA MARTIN OSCAR (T)",
    "STANZU PATRICIA",
    "UGARTE MICAELA SOLEDAD (T)",
    "URGA EDUARDO DOMINGO",
    "URGAREGUI PAULA ROMINA",
    "ZAPATA GUILLERMO OSCAR",
    "Casas Ana Maria \"Martin Silva\"",
    "Soave Tatiana \"Martin Silva\""
  ]

  // 4. Impuestos & Organismos reales (los que estaban guardados bajo sedes erróneamente)
  const impuestos = [
    'ARBA',
    'ARCA Vep 931',
    'FAECyS',
    'IAM SEGURO',
    'La Estrella Seg de Retiro',
    'Sind.U de Guardavidas',
    'Municipalidad de Chivilcoy'
  ]

  // 5. Conceptos de Ingreso (los que estaban guardados bajo empleados erróneamente)
  const ingresosTipos = [
    "Alquiler Consultorios",
    "Locación Campo Deportes / Salón",
    "Uso Natatorio",
    "Venta Cantina",
    "Consultas y Prácticas",
    "Odontología"
  ]

  // Insertar cada lista
  const rows = []
  sedes.forEach(n => rows.push({ categoria: 'sedes', nombre: n, activo: true }))
  rubros.forEach(n => rows.push({ categoria: 'rubros', nombre: n, activo: true }))
  empleados.forEach(n => rows.push({ categoria: 'empleados', nombre: n, activo: true }))
  impuestos.forEach(n => rows.push({ categoria: 'impuestos', nombre: n, activo: true }))
  ingresosTipos.forEach(n => rows.push({ categoria: 'ingresosTipos', nombre: n, activo: true }))

  // Mantener proveedores y medicos desde initialData
  const fs = require('fs')
  const initial = JSON.parse(fs.readFileSync('./src/initialData.json', 'utf8'))
  const provs = initial.maestros.proveedores || []
  const meds = initial.maestros.medicos || []

  provs.forEach(n => rows.push({ categoria: 'proveedores', nombre: n, activo: true }))
  meds.forEach(n => rows.push({ categoria: 'medicos', nombre: n, activo: true }))

  console.log(`Subiendo ${rows.length} registros corregidos a Supabase...`)
  for (let i = 0; i < rows.length; i += 300) {
    const chunk = rows.slice(i, i + 300)
    await supabase.from('maestros').upsert(chunk, { onConflict: 'categoria,nombre' })
  }
  console.log('✓ Maestros completamente reparados y clasificados!')
}

fixAll()