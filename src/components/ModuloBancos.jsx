import React, { useState, useMemo, useRef } from 'react'
import {
  Landmark,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Scale,
  RefreshCw,
  Trash2,
  Check,
  X,
  UploadCloud,
  FileText,
  PieChart,
  ListOrdered,
  Layers,
  Sparkles,
  Download,
  AlertTriangle,
  FileCheck
} from 'lucide-react'
import {
  parsePdfExtractoBanco,
  exportarAnalisisBancoExcel,
  ORDEN_CATEGORIAS
} from '../utils/bankPdfParser'

export default function ModuloBancos({
  movimientos = [],
  setMovimientos = () => {},
  selectedMes = '',
  meses = [],
  currentUser = null,
  onRegistrarGastoBancario = async () => {},
  fmtMoney = (n) => `$ ${Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
  BANCOS_LIST = [],
  supabase = null,
  isCurrentPeriodoCerrado = false
}) {
  const [activeSubTab, setActiveSubTab] = useState('conciliacion') // 'conciliacion' | 'analisisPdf'
  const [selectedCuenta, setSelectedCuenta] = useState('Banco Provincia - Cta Cte 10551/45')
  const [filterMes, setFilterMes] = useState(selectedMes || 'TODOS')
  const [filterEstadoConciliacion, setFilterEstadoConciliacion] = useState('TODOS') // 'TODOS' | 'CONCILIADOS' | 'PENDIENTES'
  const [searchTerm, setSearchTerm] = useState('')

  // Estado del Analizador de Extractos PDF (Programa Banco Original)
  const [isProcessingPdf, setIsProcessingPdf] = useState(false)
  const [pdfAnalisis, setPdfAnalisis] = useState(null)
  const [pdfError, setPdfError] = useState(null)
  const [pdfViewTab, setPdfViewTab] = useState('movimientos') // 'movimientos' | 'totalesDetalle' | 'resumenCat' | 'detalleCat'
  const [pdfSearchTerm, setPdfSearchTerm] = useState('')
  const [pdfCatFilter, setPdfCatFilter] = useState('TODAS')
  const fileInputRef = useRef(null)

  // Saldo según extracto bancario oficial ingresado manualmente para conciliar
  const [extractoBancarioSaldo, setExtractoBancarioSaldo] = useState(() => {
    try {
      const saved = localStorage.getItem(`extracto_saldo_${selectedMes}`)
      return saved ? parseFloat(saved) : 0
    } catch (e) {
      return 0
    }
  })

  // Estado de partidas conciliadas (Set de IDs de movimientos conciliados)
  const [conciliadosMap, setConciliadosMap] = useState(() => {
    try {
      const saved = localStorage.getItem('bancos_conciliados_v1')
      return saved ? JSON.parse(saved) : {}
    } catch (e) {
      return {}
    }
  })

  // Guardar en localStorage
  const handleToggleConciliado = (id) => {
    setConciliadosMap((prev) => {
      const copy = { ...prev }
      if (copy[id]) {
        delete copy[id]
      } else {
        copy[id] = {
          fecha: new Date().toISOString(),
          usuario: currentUser?.email || 'admin'
        }
      }
      try {
        localStorage.setItem('bancos_conciliados_v1', JSON.stringify(copy))
      } catch (e) {}
      return copy
    })
  }

  const handleUpdateExtractoSaldo = (val) => {
    const num = parseFloat(val) || 0
    setExtractoBancarioSaldo(num)
    try {
      localStorage.setItem(`extracto_saldo_${filterMes}`, String(num))
    } catch (e) {}
  }

  // Modal para Cargar Gasto Bancario Directo
  const [isGastoModalOpen, setIsGastoModalOpen] = useState(false)
  const [nuevoGasto, setNuevoGasto] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    tipo: 'COMISION', // 'COMISION' | 'LEY_25413' | 'MANTENIMIENTO' | 'INTERES'
    detalle: 'Comisiones e Impuestos Bancarios',
    importe: ''
  })

  // Procesar archivo PDF subido por el usuario
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setPdfError('Por favor seleccione un archivo PDF válido de extracto bancario.')
      return
    }

    try {
      setIsProcessingPdf(true)
      setPdfError(null)
      const resultado = await parsePdfExtractoBanco(file)
      
      if (!resultado || !resultado.transactions || resultado.transactions.length === 0) {
        setPdfError('No se encontraron transacciones en el PDF analizado. Verifique que sea un extracto válido de Banco Provincia / Link.')
      } else {
        setPdfAnalisis(resultado)
        if (resultado.saldoFinal !== null && resultado.saldoFinal !== undefined) {
          handleUpdateExtractoSaldo(resultado.saldoFinal)
        }
      }
    } catch (err) {
      console.error('Error procesando PDF de banco:', err)
      setPdfError('Ocurrió un error al leer el archivo PDF: ' + (err.message || 'Error desconocido'))
    } finally {
      setIsProcessingPdf(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Incorporar los débitos/gastos del extracto PDF analizado al sistema contable
  const handleImportarGastosAlSistema = async () => {
    if (!pdfAnalisis || !pdfAnalisis.transactions) return
    if (isCurrentPeriodoCerrado) {
      alert(`⚠️ El período actual (${selectedMes}) se encuentra CERRADO Y BLOQUEADO.\nNo es posible importar movimientos a un período cerrado.`)
      return
    }

    const confirmacion = window.confirm(
      `¿Desea importar automáticamente los ${pdfAnalisis.transactions.length} movimientos del extracto al Libro Diario / Movimientos de ${selectedMes}?`
    )
    if (!confirmacion) return

    const nuevosMovimientos = pdfAnalisis.transactions.map((t, idx) => {
      const isIngreso = t.CREDITOS > 0 && t.DEBITOS === 0
      const importe = isIngreso ? t.CREDITOS : t.DEBITOS

      return {
        id: `bco-imp-${Date.now()}-${idx}`,
        fecha: t.FECHA.length === 8 ? `20${t.FECHA.slice(6, 8)}-${t.FECHA.slice(3, 5)}-${t.FECHA.slice(0, 2)}` : t.FECHA,
        facturaNro: t.COMPROB ? `BCO-${t.COMPROB}` : null,
        rubro: isIngreso ? 'INGRESOS' : t.CATEGORIA === 'IMPUESTOS DEB/CRED' || t.CATEGORIA === 'IVA DEBITO' ? 'IMPUESTO' : 'Comisiones Bancarias',
        empresaConcepto: pdfAnalisis.account.includes('2341052324') ? 'Banco Provincia - Cobros (2324)' : 'Banco Provincia - Pagos (5145)',
        detalle: `${t.CATEGORIA}: ${t.DETALLE}`,
        detalleExtenso: `Extracto Bancario N° ${t.COMPROB || '-'} | Saldo Cta: ${fmtMoney(t.SALDO)}`,
        realizadoEn: 'Operaciones en Banco',
        fechaPago: t.FECHA.length === 8 ? `20${t.FECHA.slice(6, 8)}-${t.FECHA.slice(3, 5)}-${t.FECHA.slice(0, 2)}` : t.FECHA,
        chequeOperacion: `Mov. Banco Provincia - Comp: ${t.COMPROB || '-'} (${t.CATEGORIA})`,
        mesPeriodo: filterMes !== 'TODOS' ? filterMes : selectedMes,
        pagosS: isIngreso ? 0 : importe,
        ingresosS: isIngreso ? importe : 0,
        total: importe,
        observaciones: `Importado desde Extracto PDF (${pdfAnalisis.account})`
      }
    })

    setMovimientos((prev) => [...nuevosMovimientos, ...prev])

    if (supabase) {
      try {
        await supabase.from('movimientos').insert(
          nuevosMovimientos.map((m) => ({
            fecha: m.fecha,
            factura_nro: m.facturaNro,
            rubro: m.rubro,
            empresa_concepto: m.empresaConcepto,
            detalle: m.detalle,
            detalle_extenso: m.detalleExtenso,
            realizado_en: m.realizadoEn,
            fecha_pago: m.fechaPago,
            cheque_operacion: m.chequeOperacion,
            mes_periodo: m.mesPeriodo,
            pagos_s: m.pagosS,
            ingresos_s: m.ingresosS,
            total: m.total,
            observaciones: m.observaciones
          }))
        )
      } catch (err) {
        console.error('Error guardando extracto en Supabase:', err)
      }
    }

    alert(`✓ Se importaron exitosamente ${nuevosMovimientos.length} transacciones al sistema.`)
    setActiveSubTab('conciliacion')
  }

  // Filtrar movimientos bancarios (créditos y débitos en banco)
  const movimientosBancarios = useMemo(() => {
    return movimientos.filter((m) => {
      // Movimientos que pasan por banco (transferencias, cheques depositados/emitidos, débitos, comisiones)
      const ref = `${m.chequeOperacion || ''} ${m.detalle || ''} ${m.empresaConcepto || ''} ${m.rubro || ''}`.toUpperCase()
      
      const esBancario =
        ref.includes('BCO') ||
        ref.includes('BANCO') ||
        ref.includes('TRANSFERENCIA') ||
        ref.includes('DEPOSIT') ||
        ref.includes('CHEQUE') ||
        ref.includes('CHQ') ||
        ref.includes('ECHEQ') ||
        ref.includes('E-CHEQ') ||
        ref.includes('10551/45') ||
        m.rubro === 'IMPUESTO' ||
        m.rubro === 'SEGUROS'

      if (!esBancario) return false

      if (filterMes !== 'TODOS') {
        if (m.mesPeriodo && m.mesPeriodo.trim() !== filterMes.trim()) return false
      }

      const isConciliado = !!conciliadosMap[m.id]
      if (filterEstadoConciliacion === 'CONCILIADOS' && !isConciliado) return false
      if (filterEstadoConciliacion === 'PENDIENTES' && isConciliado) return false

      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const match =
          (m.empresaConcepto || '').toLowerCase().includes(term) ||
          (m.detalle || '').toLowerCase().includes(term) ||
          (m.facturaNro || '').toLowerCase().includes(term) ||
          (m.chequeOperacion || '').toLowerCase().includes(term)
        if (!match) return false
      }

      return true
    }).map((m) => {
      const isIngreso = (m.ingresosS > 0 || m.rubro === 'INGRESOS') && !m.pagosS && !m.pagosMed
      const debitoMonto = isIngreso ? 0 : Number(m.pagosS || m.netoPagadoMed || m.pagosMed || m.total || 0)
      const creditoMonto = isIngreso ? Number(m.ingresosS || m.total || 0) : 0
      const isConciliado = !!conciliadosMap[m.id]

      return {
        ...m,
        isIngreso,
        debito: debitoMonto,
        credito: creditoMonto,
        isConciliado
      }
    }).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
  }, [movimientos, filterMes, filterEstadoConciliacion, searchTerm, conciliadosMap])

  // Cálculos de Conciliación Bancaria
  const resumenBancos = useMemo(() => {
    let totalCreditos = 0
    let totalDebitos = 0
    let creditosConciliados = 0
    let debitosConciliados = 0
    let creditosPendientes = 0
    let debitosPendientes = 0

    movimientosBancarios.forEach((m) => {
      totalCreditos += m.credito
      totalDebitos += m.debito

      if (m.isConciliado) {
        creditosConciliados += m.credito
        debitosConciliados += m.debito
      } else {
        creditosPendientes += m.credito
        debitosPendientes += m.debito
      }
    })

    const saldoLibroBancos = totalCreditos - totalDebitos
    const saldoConciliado = creditosConciliados - debitosConciliados
    const diferencia = extractoBancarioSaldo - (saldoLibroBancos + debitosPendientes - creditosPendientes)

    return {
      totalCreditos,
      totalDebitos,
      saldoLibroBancos,
      creditosConciliados,
      debitosConciliados,
      creditosPendientes,
      debitosPendientes,
      saldoConciliado,
      diferencia
    }
  }, [movimientosBancarios, extractoBancarioSaldo])

  // Guardar Gasto Bancario Rápido
  const handleGuardarGastoBancario = async (e) => {
    e.preventDefault()
    if (isCurrentPeriodoCerrado) {
      alert(`⚠️ El período actual (${selectedMes}) se encuentra CERRADO Y BLOQUEADO.\nNo es posible registrar débitos en períodos cerrados.`)
      return
    }

    const monto = parseFloat(nuevoGasto.importe) || 0
    if (monto <= 0) return

    let detalleCompleto = nuevoGasto.detalle
    if (nuevoGasto.tipo === 'LEY_25413') detalleCompleto = 'Impuesto Ley 25.413 (Débitos y Créditos Bancarios)'
    if (nuevoGasto.tipo === 'COMISION') detalleCompleto = 'Comisiones y Mantenimiento Cuenta Bancaria'

    const gastoData = {
      fecha: nuevoGasto.fecha,
      rubro: 'Comisiones Bancarias',
      empresaConcepto: selectedCuenta.split('-')[0].trim() || 'Banco Provincia',
      detalle: detalleCompleto,
      detalleExtenso: `Gasto Bancario registrado desde Módulo Bancos - ${selectedCuenta}`,
      realizadoEn: 'Operaciones en Banco',
      pagosS: monto,
      total: monto,
      fechaPago: nuevoGasto.fecha,
      chequeOperacion: `Débito Automático en ${selectedCuenta}`,
      mesPeriodo: filterMes !== 'TODOS' ? filterMes : selectedMes
    }

    await onRegistrarGastoBancario(gastoData)
    setIsGastoModalOpen(false)
    setNuevoGasto({
      fecha: new Date().toISOString().slice(0, 10),
      tipo: 'COMISION',
      detalle: 'Comisiones e Impuestos Bancarios',
      importe: ''
    })
  }

  // Exportar Conciliación a Excel
  const handleExportarExcel = () => {
    if (movimientosBancarios.length === 0) {
      alert('No hay movimientos bancarios para exportar.')
      return
    }

    const headers = [
      'Fecha',
      'Cuenta Bancaria',
      'Concepto / Titular',
      'Detalle Operacion',
      'Referencia Bancaria',
      'Debito (Salida)',
      'Credito (Ingreso)',
      'Estado Conciliacion'
    ]

    const rows = movimientosBancarios.map((m) => [
      `"${m.fecha || ''}"`,
      `"${selectedCuenta}"`,
      `"${(m.empresaConcepto || '').replace(/"/g, '""')}"`,
      `"${(m.detalle || '').replace(/"/g, '""')}"`,
      `"${(m.chequeOperacion || '').replace(/"/g, '""')}"`,
      m.debito.toFixed(2),
      m.credito.toFixed(2),
      `"${m.isConciliado ? 'CONCILIADO' : 'PENDIENTE'}"`
    ])

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Conciliacion_Bancaria_${selectedCuenta.slice(0, 15)}_${filterMes}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-150">
      {/* HEADER & SUBTABS NAVIGATION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>Módulo Bancos & Programa Generador de Extractos</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                PROVINCIA / LINK
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Conciliación bancaria en tiempo real, importación y categorización inteligente de extractos en PDF.
            </p>
          </div>
        </div>

        {/* SUBTABS */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('conciliacion')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'conciliacion'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Libro Bancos & Conciliación</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('analisisPdf')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer relative ${
              activeSubTab === 'analisisPdf'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Generador Extractos PDF</span>
            {pdfAnalisis && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VISTA 1: GENERADOR Y PROCESADOR DE EXTRACTOS PDF (PROGRAMA BANCO) */}
      {/* ========================================================= */}
      {activeSubTab === 'analisisPdf' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* DRAG AND DROP / UPLOAD BOX */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg text-center relative overflow-hidden">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,application/pdf"
              className="hidden"
              id="bank-pdf-upload"
            />

            <div className="max-w-xl mx-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mx-auto shadow-inner">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">
                  Cargar Extracto Bancario en PDF (Banco Provincia / Link)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Arrastra o selecciona el PDF oficial de "Estado de Cuenta". El sistema procesará automáticamente las transacciones, detectará cuentas (2341052324 Cobros / 2341055145 Pagos), categorizará débitos/créditos y generará el Excel de 4 hojas idéntico al programa original.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <label
                  htmlFor="bank-pdf-upload"
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-600/30 transition cursor-pointer active:scale-95 ${
                    isProcessingPdf ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>{isProcessingPdf ? 'Analizando PDF...' : 'Seleccionar Archivo PDF'}</span>
                </label>

                {pdfAnalisis && (
                  <button
                    type="button"
                    onClick={() => exportarAnalisisBancoExcel(pdfAnalisis)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition cursor-pointer active:scale-95"
                    title="Descargar Excel completo con las 4 Hojas (Estado de Cuenta, Totales por Detalle, Resumen Categoría, Detalle Categoría)"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Excel 4 Hojas (.xlsx)</span>
                  </button>
                )}
              </div>

              {pdfError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-center gap-2 mt-3 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pdfError}</span>
                </div>
              )}
            </div>
          </div>

          {/* RESULTADOS DEL ANÁLISIS PDF */}
          {pdfAnalisis && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* METRICAS HEADER DEL PDF */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
                  <p className="text-[11px] text-slate-400 font-medium">Cuenta Detectada</p>
                  <h4 className="text-base font-bold text-white font-mono mt-0.5 truncate">
                    {pdfAnalisis.account}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 inline-block mt-1">
                    Tipo: {pdfAnalisis.tipo}
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
                  <p className="text-[11px] text-slate-400 font-medium">Período de Extracto</p>
                  <h4 className="text-xs font-bold text-white font-mono mt-0.5 truncate">
                    {pdfAnalisis.periodo}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {pdfAnalisis.transactions.length} transacciones ({pdfAnalisis.numPages} págs)
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
                  <p className="text-[11px] text-slate-400 font-medium">Total Débitos / Salidas</p>
                  <h4 className="text-base font-bold text-rose-400 font-mono mt-0.5 truncate">
                    {fmtMoney(pdfAnalisis.totalDebitos)}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">Pagos y comisiones</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
                  <p className="text-[11px] text-slate-400 font-medium">Saldo Final en Extracto</p>
                  <h4 className="text-base font-bold text-emerald-400 font-mono mt-0.5 truncate">
                    {fmtMoney(pdfAnalisis.saldoFinal)}
                  </h4>
                  <button
                    type="button"
                    onClick={handleImportarGastosAlSistema}
                    className="text-[10px] font-bold text-sky-400 hover:text-sky-300 underline mt-1 block cursor-pointer"
                  >
                    + Importar a Movimientos
                  </button>
                </div>
              </div>

              {/* TABS DE LAS 4 HOJAS DEL PROGRAMA BANCO */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPdfViewTab('movimientos')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        pdfViewTab === 'movimientos'
                          ? 'bg-sky-600 text-white shadow'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                      <span>1. Estado de Cuenta ({pdfAnalisis.transactions.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPdfViewTab('totalesDetalle')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        pdfViewTab === 'totalesDetalle'
                          ? 'bg-sky-600 text-white shadow'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>2. Totales por Detalle ({pdfAnalisis.listaTotalesDetalle.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPdfViewTab('resumenCat')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        pdfViewTab === 'resumenCat'
                          ? 'bg-sky-600 text-white shadow'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <PieChart className="w-3.5 h-3.5" />
                      <span>3. Resumen Categorías ({ORDEN_CATEGORIAS.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPdfViewTab('detalleCat')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        pdfViewTab === 'detalleCat'
                          ? 'bg-sky-600 text-white shadow'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>4. Detalle por Categoría</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => exportarAnalisisBancoExcel(pdfAnalisis)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Excel (.xlsx)</span>
                    </button>
                  </div>
                </div>

                {/* CONTENIDO DE HOJA 1: ESTADO DE CUENTA */}
                {pdfViewTab === 'movimientos' && (
                  <div className="p-3 sm:p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Buscar por detalle, comprobante o categoría..."
                          value={pdfSearchTerm}
                          onChange={(e) => setPdfSearchTerm(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <select
                        value={pdfCatFilter}
                        onChange={(e) => setPdfCatFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-medium cursor-pointer"
                      >
                        <option value="TODAS">Todas las Categorías</option>
                        {ORDEN_CATEGORIAS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="NO CATEGORIZADAS">NO CATEGORIZADAS</option>
                      </select>
                    </div>

                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="text-[11px] text-slate-400 bg-slate-950/80 uppercase sticky top-0 z-10 border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Fecha</th>
                            <th className="py-2.5 px-3">Detalle Operación</th>
                            <th className="py-2.5 px-3">Comprobante</th>
                            <th className="py-2.5 px-3 text-center">Categoría Asignada</th>
                            <th className="py-2.5 px-3 text-right">Débito ($)</th>
                            <th className="py-2.5 px-3 text-right">Crédito ($)</th>
                            <th className="py-2.5 px-3 text-right">Saldo ($)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-sans">
                          {pdfAnalisis.transactions
                            .filter((t) => {
                              if (pdfCatFilter !== 'TODAS' && t.CATEGORIA !== pdfCatFilter) return false
                              if (pdfSearchTerm) {
                                const term = pdfSearchTerm.toLowerCase()
                                return (
                                  (t.DETALLE || '').toLowerCase().includes(term) ||
                                  (t.COMPROB || '').toLowerCase().includes(term) ||
                                  (t.CATEGORIA || '').toLowerCase().includes(term)
                                )
                              }
                              return true
                            })
                            .map((t) => (
                              <tr key={t.id} className="hover:bg-slate-800/40 transition">
                                <td className="py-2 px-3 font-mono text-slate-300 whitespace-nowrap">{t.FECHA}</td>
                                <td className="py-2 px-3 font-medium text-white max-w-[280px] truncate">{t.DETALLE}</td>
                                <td className="py-2 px-3 font-mono text-slate-400">{t.COMPROB || '-'}</td>
                                <td className="py-2 px-3 text-center whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-sky-300 border border-slate-700">
                                    {t.CATEGORIA}
                                  </span>
                                </td>
                                <td className="py-2 px-3 font-mono font-bold text-rose-400 text-right whitespace-nowrap">
                                  {t.DEBITOS > 0 ? fmtMoney(t.DEBITOS) : '-'}
                                </td>
                                <td className="py-2 px-3 font-mono font-bold text-emerald-400 text-right whitespace-nowrap">
                                  {t.CREDITOS > 0 ? fmtMoney(t.CREDITOS) : '-'}
                                </td>
                                <td className="py-2 px-3 font-mono font-bold text-slate-200 text-right whitespace-nowrap">
                                  {fmtMoney(t.SALDO)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* CONTENIDO DE HOJA 2: TOTALES POR DETALLE */}
                {pdfViewTab === 'totalesDetalle' && (
                  <div className="p-3 sm:p-4 overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] text-slate-400 bg-slate-950/80 uppercase sticky top-0 z-10 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Detalle Agrupado</th>
                          <th className="py-2.5 px-3 text-center">Cantidad Operaciones</th>
                          <th className="py-2.5 px-3 text-right">Total Débitos</th>
                          <th className="py-2.5 px-3 text-right">Total Créditos</th>
                          <th className="py-2.5 px-3 text-right">Saldo Neto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {pdfAnalisis.listaTotalesDetalle.map((row, i) => {
                          const saldoNeto = row.creditos - row.debitos
                          return (
                            <tr key={i} className="hover:bg-slate-800/40 transition">
                              <td className="py-2 px-3 font-bold text-white">{row.detalle}</td>
                              <td className="py-2 px-3 text-center font-mono text-slate-300">{row.cantidad}</td>
                              <td className="py-2 px-3 font-mono text-rose-400 text-right font-bold">
                                {fmtMoney(row.debitos)}
                              </td>
                              <td className="py-2 px-3 font-mono text-emerald-400 text-right font-bold">
                                {fmtMoney(row.creditos)}
                              </td>
                              <td className={`py-2 px-3 font-mono text-right font-black ${saldoNeto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {fmtMoney(saldoNeto)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* CONTENIDO DE HOJA 3: RESUMEN POR CATEGORÍA */}
                {pdfViewTab === 'resumenCat' && (
                  <div className="p-3 sm:p-4 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] text-slate-400 bg-slate-950/80 uppercase border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Categoría de Movimiento</th>
                          <th className="py-2.5 px-3 text-center">Cantidad</th>
                          <th className="py-2.5 px-3 text-right">Total Débitos</th>
                          <th className="py-2.5 px-3 text-right">Total Créditos</th>
                          <th className="py-2.5 px-3 text-right">Saldo Neto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {pdfAnalisis.resumenCategorias.map((row) => {
                          const saldoNeto = row.creditos - row.debitos
                          return (
                            <tr key={row.categoria} className="hover:bg-slate-800/40 transition">
                              <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                                <span>{row.categoria}</span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-slate-300 font-semibold">{row.cantidad}</td>
                              <td className="py-2.5 px-3 font-mono text-rose-400 text-right font-bold">
                                {fmtMoney(row.debitos)}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-emerald-400 text-right font-bold">
                                {fmtMoney(row.creditos)}
                              </td>
                              <td className={`py-2.5 px-3 font-mono text-right font-black ${saldoNeto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {fmtMoney(saldoNeto)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* CONTENIDO DE HOJA 4: DETALLE POR CATEGORÍA */}
                {pdfViewTab === 'detalleCat' && (
                  <div className="p-3 sm:p-4 space-y-4 max-h-[500px] overflow-y-auto">
                    {[...ORDEN_CATEGORIAS, 'NO CATEGORIZADAS'].map((cat) => {
                      const subObj = pdfAnalisis.detallePorCategoria[cat] || {}
                      const items = Object.values(subObj).sort((a, b) => (b.creditos - b.debitos) - (a.creditos - a.debitos))
                      if (items.length === 0) return null

                      return (
                        <div key={cat} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                          <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                            <span className="font-bold text-xs text-sky-300 flex items-center gap-2">
                              <span>📁 {cat}</span>
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
                                {items.length} detalles distintos
                              </span>
                            </span>
                          </div>

                          <table className="w-full text-xs text-left">
                            <thead className="text-[10px] text-slate-400 bg-slate-950/80 border-b border-slate-800/60">
                              <tr>
                                <th className="py-1.5 px-3">Detalle</th>
                                <th className="py-1.5 px-3 text-center">Cant.</th>
                                <th className="py-1.5 px-3 text-right">Débitos</th>
                                <th className="py-1.5 px-3 text-right">Créditos</th>
                                <th className="py-1.5 px-3 text-right">Saldo Neto</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 font-sans text-[11px]">
                              {items.map((row, idx) => {
                                const saldoNeto = row.creditos - row.debitos
                                return (
                                  <tr key={idx} className="hover:bg-slate-800/30">
                                    <td className="py-1.5 px-3 text-slate-200">{row.detalle}</td>
                                    <td className="py-1.5 px-3 text-center font-mono text-slate-400">{row.cantidad}</td>
                                    <td className="py-1.5 px-3 font-mono text-rose-400 text-right">{fmtMoney(row.debitos)}</td>
                                    <td className="py-1.5 px-3 font-mono text-emerald-400 text-right">{fmtMoney(row.creditos)}</td>
                                    <td className={`py-1.5 px-3 font-mono text-right font-bold ${saldoNeto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {fmtMoney(saldoNeto)}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 2: LIBRO BANCOS Y CONCILIACIÓN BANCARIA */}
      {/* ========================================================= */}
      {activeSubTab === 'conciliacion' && (
        <div className="space-y-4 md:space-y-6">
          {/* CARDS DE SALDOS Y CONCILIACIÓN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400 font-medium truncate">Saldo Libro Bancos (Sistema)</p>
                  <h3 className={`text-base sm:text-lg font-bold font-mono mt-0.5 truncate ${
                    resumenBancos.saldoLibroBancos >= 0 ? 'text-sky-400' : 'text-rose-400'
                  }`}>
                    {fmtMoney(resumenBancos.saldoLibroBancos)}
                  </h3>
                </div>
                <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/20 shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 truncate">
                Créditos: {fmtMoney(resumenBancos.totalCreditos)} • Débitos: {fmtMoney(resumenBancos.totalDebitos)}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400 font-medium truncate">Saldo Según Extracto Oficial</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={extractoBancarioSaldo || ''}
                      onChange={(e) => handleUpdateExtractoSaldo(e.target.value)}
                      placeholder="0.00"
                      className="w-28 sm:w-32 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-sm font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20 shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 truncate">Saldo real del homebanking o extracto PDF</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400 font-medium truncate">Partidas Pendientes</p>
                  <h3 className="text-base sm:text-lg font-bold font-mono mt-0.5 truncate text-amber-400">
                    {fmtMoney(resumenBancos.debitosPendientes + resumenBancos.creditosPendientes)}
                  </h3>
                </div>
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20 shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 truncate">
                Ch. no debitados: {fmtMoney(resumenBancos.debitosPendientes)}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400 font-medium truncate">Diferencia de Conciliación</p>
                  <h3 className={`text-base sm:text-lg font-bold font-mono mt-0.5 truncate ${
                    Math.abs(resumenBancos.diferencia) < 0.01 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {fmtMoney(resumenBancos.diferencia)}
                  </h3>
                </div>
                <div className={`p-2 rounded-xl border shrink-0 ${
                  Math.abs(resumenBancos.diferencia) < 0.01
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {Math.abs(resumenBancos.diferencia) < 0.01 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 truncate">
                {Math.abs(resumenBancos.diferencia) < 0.01 ? '✓ Conciliación Cuadrada al 100%' : '⚠️ Existen partidas no identificadas'}
              </p>
            </div>
          </div>

          {/* FILTROS & ACCIONES */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar movimiento en banco..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <select
                value={filterEstadoConciliacion}
                onChange={(e) => setFilterEstadoConciliacion(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium cursor-pointer"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="CONCILIADOS">✓ Conciliados</option>
                <option value="PENDIENTES">⏳ Pendientes de Acreditación</option>
              </select>

              <select
                value={filterMes}
                onChange={(e) => setFilterMes(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium cursor-pointer"
              >
                <option value="TODOS">Todos los Períodos</option>
                {meses.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsGastoModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition cursor-pointer"
                title="Registrar débitos automáticos, comisiones e impuesto al cheque Ley 25.413"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Débito / Gasto Banco</span>
              </button>

              <button
                type="button"
                onClick={handleExportarExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>

          {/* TABLA DE MOVIMIENTOS BANCARIOS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-slate-400 bg-slate-950/80 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">Conc.</th>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Concepto / Titular</th>
                    <th className="py-2.5 px-3">Detalle / Operación</th>
                    <th className="py-2.5 px-3">Referencia / Comprobante</th>
                    <th className="py-2.5 px-3 text-right">Débito ($)</th>
                    <th className="py-2.5 px-3 text-right">Crédito ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {movimientosBancarios.map((m) => (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-800/40 transition cursor-pointer ${
                        m.isConciliado ? 'bg-emerald-950/10' : ''
                      }`}
                      onClick={() => handleToggleConciliado(m.id)}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={m.isConciliado}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">{m.fecha}</td>
                      <td className="py-2.5 px-3 font-bold text-white max-w-[200px] truncate">
                        {m.empresaConcepto || 'Varios'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-[240px] truncate">{m.detalle || '-'}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px] truncate max-w-[180px]">
                        {m.chequeOperacion || m.facturaNro || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-400 text-right whitespace-nowrap">
                        {m.debito > 0 ? fmtMoney(m.debito) : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 text-right whitespace-nowrap">
                        {m.credito > 0 ? fmtMoney(m.credito) : '-'}
                      </td>
                    </tr>
                  ))}

                  {movimientosBancarios.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No se registraron movimientos bancarios para esta cuenta y período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR GASTO / COMISION BANCARIA */}
      {isGastoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Registrar Débito / Gasto Bancario</h3>
                  <p className="text-xs text-slate-400">{selectedCuenta}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGastoModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarGastoBancario} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Fecha del Débito</label>
                <input
                  type="date"
                  required
                  value={nuevoGasto.fecha}
                  onChange={(e) => setNuevoGasto({ ...nuevoGasto, fecha: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Tipo de Gasto Bancario</label>
                <select
                  value={nuevoGasto.tipo}
                  onChange={(e) => setNuevoGasto({ ...nuevoGasto, tipo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium cursor-pointer"
                >
                  <option value="LEY_25413">Impuesto al Cheque (Ley 25.413 Débitos/Créditos)</option>
                  <option value="COMISION">Comisiones y Mantenimiento de Cuenta</option>
                  <option value="INTERES">Intereses por Giro en Descubierto</option>
                  <option value="OTRO">Otro Débito Bancario Directo</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Detalle / Concepto</label>
                <input
                  type="text"
                  value={nuevoGasto.detalle}
                  onChange={(e) => setNuevoGasto({ ...nuevoGasto, detalle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Importe Debitado ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={nuevoGasto.importe}
                  onChange={(e) => setNuevoGasto({ ...nuevoGasto, importe: e.target.value })}
                  className="w-full bg-slate-950 border border-rose-500/50 rounded-lg px-3 py-2 font-mono font-bold text-rose-300 text-sm focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGastoModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg cursor-pointer"
                >
                  Registrar Débito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
