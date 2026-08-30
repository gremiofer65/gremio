const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('https://bktvvpsqjoibjyyuvhxi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdHZ2cHNxam9pYmp5eXV2aHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNDM5MTUsImV4cCI6MjEwMzYxOTkxNX0.GOG1b-BNOoBIYSKTm_rXjpltdJdnpjL9yy_-YJ7fAp8')

async function run() {
  const { data: m } = await supabase.from('maestros').select('*')
  const rubros = m.filter(x => x.categoria === 'rubros')
  const sedes = m.filter(x => x.categoria === 'sedes')
  console.log('Maestros rubros:', rubros.map(r => r.nombre))
  console.log('Maestros sedes:', sedes.map(s => s.nombre))

  const { data: movs } = await supabase.from('movimientos').select('rubro,realizado_en,empresa_concepto,detalle').limit(10)
  console.log('Sample movimientos:', movs)
}
run()