const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('https://bktvvpsqjoibjyyuvhxi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdHZ2cHNxam9pYmp5eXV2aHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNDM5MTUsImV4cCI6MjEwMzYxOTkxNX0.GOG1b-BNOoBIYSKTm_rXjpltdJdnpjL9yy_-YJ7fAp8')

async function test() {
  const { data: p, error: ep } = await supabase.from('periodos').select('*')
  console.log('Periodos count:', p ? p.length : 0, ep ? ep.message : '')

  const { data: m, error: em } = await supabase.from('maestros').select('*')
  console.log('Maestros count:', m ? m.length : 0, em ? em.message : '')

  const { data: movs, error: emov } = await supabase.from('movimientos').select('id,empresa_concepto,pagos_s').limit(5)
  console.log('Movimientos test:', movs ? movs.length : 0, emov ? emov.message : '')
}
test()