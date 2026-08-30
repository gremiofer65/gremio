const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('https://bktvvpsqjoibjyyuvhxi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdHZ2cHNxam9pYmp5eXV2aHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNDM5MTUsImV4cCI6MjEwMzYxOTkxNX0.GOG1b-BNOoBIYSKTm_rXjpltdJdnpjL9yy_-YJ7fAp8')

async function run() {
  const { data: movs } = await supabase.from('movimientos').select('rubro,realizado_en')
  const rubrosSet = new Set()
  const sedesSet = new Set()
  movs.forEach(m => {
    if (m.rubro) rubrosSet.add(m.rubro)
    if (m.realizado_en) sedesSet.add(m.realizado_en)
  })
  console.log('Distinct rubros in movimientos:', Array.from(rubrosSet))
  console.log('Distinct sedes in movimientos:', Array.from(sedesSet))
}
run()