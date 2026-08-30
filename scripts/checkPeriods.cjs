const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('https://bktvvpsqjoibjyyuvhxi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdHZ2cHNxam9pYmp5eXV2aHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNDM5MTUsImV4cCI6MjEwMzYxOTkxNX0.GOG1b-BNOoBIYSKTm_rXjpltdJdnpjL9yy_-YJ7fAp8')

async function run() {
  const { data: p } = await supabase.from('periodos').select('*').order('nombre', { ascending: true })
  console.log('Períodos en Supabase ordenados por nombre alfabético:')
  p.forEach(x => console.log(`  - ${x.nombre} (mes: ${x.mes}, anio: ${x.anio})`))
}
run()