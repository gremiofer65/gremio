const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('https://bktvvpsqjoibjyyuvhxi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdHZ2cHNxam9pYmp5eXV2aHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNDM5MTUsImV4cCI6MjEwMzYxOTkxNX0.GOG1b-BNOoBIYSKTm_rXjpltdJdnpjL9yy_-YJ7fAp8')

async function run() {
  console.log('Agregando los 12 meses de 2026 y habilitando años futuros en Supabase...')
  const mesesCompletos = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SETIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ]

  const periodos2026 = mesesCompletos.map(m => ({
    nombre: `${m} 26`,
    mes: m,
    anio: '2026',
    activo: true
  }))

  const { error } = await supabase.from('periodos').upsert(periodos2026, { onConflict: 'nombre' })
  if (error) console.error('Error insertando periodos:', error.message)
  else console.log('✓ Los 12 meses del año 2026 han sido sincronizados en Supabase.')
}

run()