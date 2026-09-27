import React, { useState, useMemo } from 'react'
import {
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Receipt,
  Calendar,
  DollarSign,
  Building2,
  CheckCircle2,
  X
} from 'lucide-react'

export default function LibroIvaCompras({
  movimientos = [],
  selectedMes = '',
  meses = [],
  maestrosCuit = {},
  fmtMoney = (n) => `$ ${Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
  onClose = null
}) {
  const [filterMes, setFilterMes] = useState(selectedMes || 'TODOS')
  const [filterTipoComp, setFilterTipoComp] = useState('TODOS')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('asc') // 'asc' | 'desc'

  // Filtrar comprobantes de compras / egresos y honorarios
  const compras = useMemo(() => {
    return movimientos.filter((m) => {
      // Solo compras/egresos y médicos (no ingresos)
      const esCompra = m.rubro !== 'INGRESOS' && (!m.ingresosS || m.ingresosS === 0) && (m.pagosS > 0 || m.pagosMed > 0 || m.total > 0)
      if (!esCompra) return false

      // Filtro mes
      if (filterMes !== 'TODOS') {
        if (m.mesPeriodo && m.mesPeriodo.trim() !== filterMes.trim()) return false
      }

      // Filtro tipo comprobante
      const tipo = m.tipoComprobante || (m.rubro === 'MÉDICO' ? 'FACTURA_C' : 'FACTURA_B')
      if (filterTipoComp !== 'TODOS' && tipo !== filterTipoComp) return false

      // Búsqueda
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const prov = (m.empresaConcepto || '').toLowerCase()
        const fact = (m.facturaNro || '').toLowerCase()
        const cuit = (maestrosCuit[m.empresaConcepto] || '').toLowerCase()
        const det = (m.detalle || '').toLowerCase()
        return prov.includes(term) || fact.includes(term) || cuit.includes(term) || det.includes(term)
      }

      return true
    }).map((m) => {
      const total = Number(m.pagosS || m.netoPagadoMed || m.pagosMed || m.total || 0)
      const tipo = m.tipoComprobante || (m.rubro === 'MÉDICO' ? 'FACTURA_C' : 'FACTURA_B')
      
      // Desglose fiscal si está presente o estimado
      let neto = m.netoGravado !== undefined && m.netoGravado !== null ? Number(m.netoGravado) : null
      let alicuota = m.alicuotaIva !== undefined && m.alicuotaIva !== null ? Number(m.alicuotaIva) : 21
      let iva = m.ivaImporte !== undefined && m.ivaImporte !== null ? Number(m.ivaImporte) : null
      let noGravado = Number(m.ivaNoGravado || 0)
      let percepciones = Number(m.percepciones || 0)

      if (neto === null) {
        if (tipo === 'FACTURA_A' || tipo === 'FACTURA_M') {
          // Si es Factura A y no se desglosó, deducir IVA 21%
          neto = (total - noGravado - percepciones) / 1.21
          iva = total - neto - noGravado - percepciones
        } else {
          // Factura B o C (IVA no discriminado / Monotributo)
          neto = total - noGravado - percepciones
          iva = 0
          alicuota = 0
        }
      }

      return {
        ...m,
        tipo,
        cuit: maestrosCuit[m.empresaConcepto] || '-',
        netoGravado: Number(neto || 0),
        alicuotaIva: alicuota,
        ivaImporte: Number(iva || 0),
        ivaNoGravado: noGravado,
        percepciones: percepciones,
        totalComprobante: total
      }
    }).sort((a, b) => {
      const dateA = a.fecha || ''
      const dateB = b.fecha || ''
      return sortOrder === 'asc' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA)
    })
  }, [movimientos, filterMes, filterTipoComp, searchTerm, sortOrder, maestrosCuit])

  // Totales acumulados
  const totales = useMemo(() => {
    return compras.reduce(
      (acc, item) => {
        acc.neto += item.netoGravado
        acc.iva += item.ivaImporte
        acc.noGravado += item.ivaNoGravado
        acc.percepciones += item.percepciones
        acc.total += item.totalComprobante
        return acc
      },
      { neto: 0, iva: 0, noGravado: 0, percepciones: 0, total: 0 }
    )
  }, [compras])

  // Exportar Libro IVA Compras a CSV/Excel
  const handleExportarExcel = () => {
    if (compras.length === 0) {
      alert('No hay registros para exportar.')
      return
    }

    const headers = [
      'Fecha Emision',
      'Tipo Comprobante',
      'Punto Venta - Numero',
      'Proveedor / Razon Social',
      'CUIT / CUIL',
      'Rubro / Concepto',
      'Neto Gravado',
      'Alicuota IVA',
      'Credito Fiscal IVA',
      'No Gravado / Exento',
      'Percepciones IIBB/Nac',
      'Total Facturado',
      'Estado Pago',
      'Fecha de Pago'
    ]

    const rows = compras.map((c) => [
      `"${c.fecha || ''}"`,
      `"${c.tipo}"`,
      `"${c.facturaNro || ''}"`,
      `"${(c.empresaConcepto || '').replace(/"/g, '""')}"`,
      `"${c.cuit}"`,
      `"${(c.detalle || c.rubro || '').replace(/"/g, '""')}"`,
      c.netoGravado.toFixed(2),
      `"${c.alicuotaIva}%"`,
      c.ivaImporte.toFixed(2),
      c.ivaNoGravado.toFixed(2),
      c.percepciones.toFixed(2),
      c.totalComprobante.toFixed(2),
      `"${c.fechaPago ? 'Pagado' : 'Pendiente'}"`,
      `"${c.fechaPago || ''}"`
    ])

    // Agregar fila de totales
    rows.push([
      '"TOTALES"',
      '""',
      '""',
      '""',
      '""',
      '""',
      totales.neto.toFixed(2),
      '""',
      totales.iva.toFixed(2),
      totales.noGravado.toFixed(2),
      totales.percepciones.toFixed(2),
      totales.total.toFixed(2),
      '""',
      '""'
    ])

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Libro_IVA_Compras_${filterMes.replace(/\s+/g, '_')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">Subdiario Libro IVA Compras Digital</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  ARCA / AFIP
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Desglose fiscal de compras, alícuotas de IVA y crédito fiscal computables
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              type="button"
              onClick={handleExportarExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Libro IVA (Excel)</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Imprimir</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Resumen Fiscal Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-800 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 block font-sans font-bold">NETO GRAVADO</span>
            <span className="text-sm font-bold text-slate-200 truncate block">{fmtMoney(totales.neto)}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30">
            <span className="text-[10px] text-indigo-400 block font-sans font-bold">CRÉDITO FISCAL IVA</span>
            <span className="text-sm font-black text-indigo-400 truncate block">{fmtMoney(totales.iva)}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 block font-sans font-bold">NO GRAVADO / EXENTO</span>
            <span className="text-sm font-bold text-slate-300 truncate block">{fmtMoney(totales.noGravado)}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 block font-sans font-bold">PERCEPCIONES</span>
            <span className="text-sm font-bold text-amber-400 truncate block">{fmtMoney(totales.percepciones)}</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-600/10 border border-blue-500/30 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-blue-400 block font-sans font-bold">TOTAL COMPRAS</span>
            <span className="text-base font-black text-white truncate block">{fmtMoney(totales.total)}</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por emisor, CUIT, factura o detalle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Período:</span>
              <select
                value={filterMes}
                onChange={(e) => setFilterMes(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium cursor-pointer focus:outline-none focus:border-blue-500"
              >
                <option value="TODOS">Todos los Períodos</option>
                {meses.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Tipo:</span>
              <select
                value={filterTipoComp}
                onChange={(e) => setFilterTipoComp(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium cursor-pointer focus:outline-none focus:border-blue-500"
              >
                <option value="TODOS">Todos los Comprobantes</option>
                <option value="FACTURA_A">Factura A</option>
                <option value="FACTURA_B">Factura B</option>
                <option value="FACTURA_C">Factura C</option>
                <option value="FACTURA_M">Factura M</option>
                <option value="RECIBO">Recibo Oficial</option>
                <option value="NOTA_CREDITO_A">Nota de Crédito A</option>
                <option value="NOTA_CREDITO_B">Nota de Crédito B</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer"
              title="Cambiar orden cronológico"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortOrder === 'asc' ? 'Cronológico' : 'Inverso'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabla Subdiario IVA Compras */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[580px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 sticky top-0 z-10 text-[11px]">
              <tr>
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-2.5">Tipo</th>
                <th className="py-3 px-3">Nº Comprobante</th>
                <th className="py-3 px-3">Proveedor / Razón Social</th>
                <th className="py-3 px-3">CUIT</th>
                <th className="py-3 px-3 text-right">Neto Grav.</th>
                <th className="py-3 px-2 text-center">Alíc.</th>
                <th className="py-3 px-3 text-right text-indigo-300">IVA</th>
                <th className="py-3 px-3 text-right">No Grav.</th>
                <th className="py-3 px-3 text-right text-amber-300">Percep.</th>
                <th className="py-3 px-4 text-right font-bold text-white">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {compras.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">{c.fecha}</td>
                  <td className="py-2.5 px-2.5 whitespace-nowrap">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        c.tipo === 'FACTURA_A' || c.tipo === 'FACTURA_M'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : c.tipo === 'FACTURA_C'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : c.tipo.includes('NOTA_CREDITO')
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {c.tipo.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">{c.facturaNro || '-'}</td>
                  <td className="py-2.5 px-3 font-semibold text-white max-w-[180px] truncate">{c.empresaConcepto}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">{c.cuit}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-300 text-right whitespace-nowrap">
                    {fmtMoney(c.netoGravado)}
                  </td>
                  <td className="py-2.5 px-2 font-mono text-slate-400 text-center text-[10px] whitespace-nowrap">
                    {c.alicuotaIva > 0 ? `${c.alicuotaIva}%` : '-'}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-indigo-300 text-right whitespace-nowrap">
                    {fmtMoney(c.ivaImporte)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400 text-right whitespace-nowrap">
                    {c.ivaNoGravado > 0 ? fmtMoney(c.ivaNoGravado) : '-'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-amber-300 text-right whitespace-nowrap">
                    {c.percepciones > 0 ? fmtMoney(c.percepciones) : '-'}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-white text-right whitespace-nowrap">
                    {fmtMoney(c.totalComprobante)}
                  </td>
                </tr>
              ))}

              {compras.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    No se encontraron comprobantes de compras para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
            {compras.length > 0 && (
              <tfoot className="bg-slate-950 font-mono font-bold text-xs border-t-2 border-slate-700 sticky bottom-0">
                <tr>
                  <td colSpan={5} className="py-3 px-3 text-slate-300 text-right uppercase font-sans">
                    TOTALES ACUMULADOS ({compras.length} comprobantes):
                  </td>
                  <td className="py-3 px-3 text-right text-slate-200">{fmtMoney(totales.neto)}</td>
                  <td className="py-3 px-2 text-center">-</td>
                  <td className="py-3 px-3 text-right text-indigo-400">{fmtMoney(totales.iva)}</td>
                  <td className="py-3 px-3 text-right text-slate-300">{fmtMoney(totales.noGravado)}</td>
                  <td className="py-3 px-3 text-right text-amber-400">{fmtMoney(totales.percepciones)}</td>
                  <td className="py-3 px-4 text-right text-emerald-400 text-sm">{fmtMoney(totales.total)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
