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
  FileCheck,
  FolderOpen
} from 'lucide-react'
import {
  parsePdfExtractoBanco,
  recalcularAnalisisBanco,
  exportarAnalisisBancoExcel,
  autocompletarExcelConciliacionSindicato,
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

  // Estado del Analizador de Extractos PDF (Soporta 1 o 2 archivos PDF simultáneos: Cobros y Pagos)
  const [isProcessingPdfCobros, setIsProcessingPdfCobros] = useState(false)
  const [isProcessingPdfPagos, setIsProcessingPdfPagos] = useState(false)
  const [pdfCobrosAnalisis, setPdfCobrosAnalisis] = useState(null)
  const [pdfPagosAnalisis, setPdfPagosAnalisis] = useState(null)
  const [pdfError, setPdfError] = useState(null)
  
  // Tab activo de visualización de PDF: 'cobros' | 'pagos'
  const [activePdfTab, setActivePdfTab] = useState('cobros')
  const [pdfViewTab, setPdfViewTab] = useState('movimientos') // 'movimientos' | 'totalesDetalle' | 'resumenCat' | 'detalleCat'
  const [pdfSearchTerm, setPdfSearchTerm] = useState('')
  const [pdfCatFilter, setPdfCatFilter] = useState('TODAS')

  const fileCobrosInputRef = useRef(null)
  const filePagosInputRef = useRef(null)

  // Estado de Modal de Reclasificación de movimientos no categorizados
  const [isReclassifyModalOpen, setIsReclassifyModalOpen] = useState(false)
  const [reclassifyPdfTab, setReclassifyPdfTab] = useState('cobros') // 'cobros' | 'pagos'

  // Función para re-categorizar una transacción y recalcular inmediatamente los totales
  const handleReclassifyTransaction = (targetTab, txId, newCategory, applyToAllMatching = false) => {
    const isCobros = targetTab === 'cobros'
    const analisisObj = isCobros ? pdfCobrosAnalisis : pdfPagosAnalisis
    if (!analisisObj) return

    const targetTx = analisisObj.transactions.find((t) => t.id === txId)
    if (!targetTx) return

    const updatedTransactions = analisisObj.transactions.map((t) => {
      if (t.id === txId || (applyToAllMatching && t.DETALLE === targetTx.DETALLE)) {
        return { ...t, CATEGORIA: newCategory }
      }
      return t
    })

    const updatedAnalisis = recalcularAnalisisBanco(analisisObj, updatedTransactions)

    if (isCobros) {
      setPdfCobrosAnalisis(updatedAnalisis)
    } else {
      setPdfPagosAnalisis(updatedAnalisis)
    }
  }

  // Estado de Autocompletado del Archivo de Conciliación Sindicato Excel (.xlsx)
  const [isFillingExcel, setIsFillingExcel] = useState(false)
  const [excelFillResult, setExcelFillResult] = useState(null)
  const [excelFillError, setExcelFillError] = useState(null)
  const excelFillInputRef = useRef(null)

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

  // Procesar archivo PDF específico (Cobros o Pagos)
  const handleProcessPdfFile = async (file, targetType) => {
    if (!file) return

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setPdfError('Por favor seleccione un archivo PDF válido de extracto bancario.')
      return
    }

    try {
      if (targetType === 'COBROS') setIsProcessingPdfCobros(true)
      else setIsProcessingPdfPagos(true)

      setPdfError(null)
      setExcelFillResult(null)
      setExcelFillError(null)

      const resultado = await parsePdfExtractoBanco(file)
      
      if (!resultado || !resultado.transactions || resultado.transactions.length === 0) {
        setPdfError(`No se encontraron transacciones en el PDF de ${targetType}. Verifique el archivo.`)
      } else {
        if (targetType === 'COBROS') {
          setPdfCobrosAnalisis(resultado)
          setActivePdfTab('cobros')
        } else {
          setPdfPagosAnalisis(resultado)
          setActivePdfTab('pagos')
        }

        if (resultado.saldoFinal !== null && resultado.saldoFinal !== undefined) {
          handleUpdateExtractoSaldo(resultado.saldoFinal)
        }
      }
    } catch (err) {
      console.error(`Error procesando PDF de ${targetType}:`, err)
      setPdfError(`Error al leer el PDF de ${targetType}: ` + (err.message || 'Error desconocido'))
    } finally {
      if (targetType === 'COBROS') {
        setIsProcessingPdfCobros(false)
        if (fileCobrosInputRef.current) fileCobrosInputRef.current.value = ''
      } else {
        setIsProcessingPdfPagos(false)
        if (filePagosInputRef.current) filePagosInputRef.current.value = ''
      }
    }
  }

  // Autocompletar el archivo de Conciliación Sindicato Excel (.xlsx) con los PDFs cargados (Cobros y/o Pagos)
  const handleExcelFillUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
      setExcelFillError('Por favor seleccione un archivo de Excel válido (.xlsx).')
      return
    }

    const pdfList = []
    if (pdfCobrosAnalisis) pdfList.push(pdfCobrosAnalisis)
    if (pdfPagosAnalisis) pdfList.push(pdfPagosAnalisis)

    if (pdfList.length === 0) {
      setExcelFillError('Debe cargar al menos un extracto PDF (Cobros o Pagos) antes de autocompletar.')
      return
    }

    const totalSinCat = (pdfCobrosAnalisis?.totalNoCategorizadas || 0) + (pdfPagosAnalisis?.totalNoCategorizadas || 0)
    if (totalSinCat > 0) {
      setExcelFillError(
        `⚠️ No es posible autocompletar el Excel: Existen ${totalSinCat} movimiento(s) sin categorizar. Asigne una categoría a cada movimiento antes de generar la conciliación.`
      )
      setReclassifyPdfTab(pdfCobrosAnalisis?.totalNoCategorizadas > 0 ? 'cobros' : 'pagos')
      setIsReclassifyModalOpen(true)
      return
    }

    try {
      setIsFillingExcel(true)
      setExcelFillError(null)
      setExcelFillResult(null)

      const result = await autocompletarExcelConciliacionSindicato(file, pdfList)
      setExcelFillResult(result)
    } catch (err) {
      console.error('Error autocompletando Excel de conciliación:', err)
      setExcelFillError('Error al autocompletar Excel: ' + (err.message || 'Error desconocido'))
    } finally {
      setIsFillingExcel(false)
      if (excelFillInputRef.current) excelFillInputRef.current.value = ''
    }
  }

  // Incorporar los débitos/gastos del extracto PDF seleccionado al sistema contable
  const handleImportarGastosAlSistema = async (analisisObj) => {
    if (!analisisObj || !analisisObj.transactions) return
    if (isCurrentPeriodoCerrado) {
      alert(`⚠️ El período actual (${selectedMes}) se encuentra CERRADO Y BLOQUEADO.\nNo es posible importar movimientos a un período cerrado.`)
      return
    }

    const confirmacion = window.confirm(
      `¿Desea importar automáticamente los ${analisisObj.transactions.length} movimientos de la cuenta ${analisisObj.account} al Libro Diario / Movimientos de ${selectedMes}?`
    )
    if (!confirmacion) return

    const nuevosMovimientos = analisisObj.transactions.map((t, idx) => {
      const isIngreso = t.CREDITOS > 0 && t.DEBITOS === 0
      const importe = isIngreso ? t.CREDITOS : t.DEBITOS

      return {
        id: `bco-imp-${Date.now()}-${idx}`,
        fecha: t.FECHA.length === 8 ? `20${t.FECHA.slice(6, 8)}-${t.FECHA.slice(3, 5)}-${t.FECHA.slice(0, 2)}` : t.FECHA,
        facturaNro: t.COMPROB ? `BCO-${t.COMPROB}` : null,
        rubro: isIngreso ? 'INGRESOS' : t.CATEGORIA === 'IMPUESTOS DEB/CRED' || t.CATEGORIA === 'IVA DEBITO' ? 'IMPUESTO' : 'Comisiones Bancarias',
        empresaConcepto: analisisObj.account.includes('2341052324') ? 'Banco Provincia - Cobros (2324)' : 'Banco Provincia - Pagos (5145)',
        detalle: `${t.CATEGORIA}: ${t.DETALLE}`,
        detalleExtenso: `Extracto Bancario N° ${t.COMPROB || '-'} | Saldo Cta: ${fmtMoney(t.SALDO)}`,
        realizadoEn: 'Operaciones en Banco',
        fechaPago: t.FECHA.length === 8 ? `20${t.FECHA.slice(6, 8)}-${t.FECHA.slice(3, 5)}-${t.FECHA.slice(0, 2)}` : t.FECHA,
        chequeOperacion: `Mov. Banco Provincia - Comp: ${t.COMPROB || '-'} (${t.CATEGORIA})`,
        mesPeriodo: filterMes !== 'TODOS' ? filterMes : selectedMes,
        pagosS: isIngreso ? 0 : importe,
        ingresosS: isIngreso ? importe : 0,
        total: importe,
        observaciones: `Importado desde Extracto PDF (${analisisObj.account})`
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

  const currentPdfAnalisis = activePdfTab === 'cobros' ? pdfCobrosAnalisis : pdfPagosAnalisis
  const hasAtLeastOnePdf = !!(pdfCobrosAnalisis || pdfPagosAnalisis)
  const totalPendientesCategorizar = (pdfCobrosAnalisis?.totalNoCategorizadas || 0) + (pdfPagosAnalisis?.totalNoCategorizadas || 0)
  const hayMovimientosSinCategorizar = totalPendientesCategorizar > 0

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
              <span>Módulo Bancos & Generador de Conciliaciones</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                PROVINCIA / LINK
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Conciliación bancaria en tiempo real, importación y autocompletado simultáneo de Cobros y Pagos.
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
            {hasAtLeastOnePdf && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VISTA 1: GENERADOR Y PROCESADOR DE EXTRACTOS PDF (COBROS Y PAGOS) */}
      {/* ========================================================= */}
      {activeSubTab === 'analisisPdf' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* DUAL UPLOAD BOX: COBROS (2324) Y PAGOS (5145) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-5">
            <div className="text-center max-w-xl mx-auto">
              <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
                <UploadCloud className="w-5 h-5 text-sky-400" />
                <span>Cargar Extractos Bancarios (Cobros y Pagos)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Sube ambos PDFs del mes. Luego con el botón de abajo seleccionas el Excel y se autocompletarán ambas cuentas en una sola descarga.
              </p>
            </div>

            {/* DOS TARJETAS DE CARGA: COBROS Y PAGOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TARJETA 1: CUENTA COBROS (2341052324) */}
              <div className={`p-4 rounded-xl border transition ${
                pdfCobrosAnalisis
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}>
                <input
                  type="file"
                  ref={fileCobrosInputRef}
                  onChange={(e) => handleProcessPdfFile(e.target.files?.[0], 'COBROS')}
                  accept=".pdf,application/pdf"
                  className="hidden"
                  id="pdf-cobros-upload"
                />

                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <strong className="text-xs font-bold text-white">1. Cuenta Cobros (23410523/24)</strong>
                  </div>
                  {pdfCobrosAnalisis && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ✓ Cargado
                    </span>
                  )}
                </div>

                <div className="py-3 text-xs space-y-1">
                  {pdfCobrosAnalisis ? (
                    <>
                      <p className="text-slate-300 truncate font-mono text-[11px]">
                        📄 {pdfCobrosAnalisis.fileName || 'Extracto Cobros.pdf'}
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        Período: <strong className="text-white">{pdfCobrosAnalisis.periodo}</strong> ({pdfCobrosAnalisis.transactions.length} movs)
                      </p>
                      <p className="text-emerald-400 font-bold font-mono">
                        Saldo Final: {fmtMoney(pdfCobrosAnalisis.saldoFinal)}
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-500 text-[11px]">
                      Selecciona el extracto bancario PDF correspondiente a la cuenta de Cobros / Recaudaciones.
                    </p>
                  )}
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <label
                    htmlFor="pdf-cobros-upload"
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 ${
                      pdfCobrosAnalisis
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                    } ${isProcessingPdfCobros ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isProcessingPdfCobros ? 'Procesando...' : pdfCobrosAnalisis ? 'Reemplazar PDF Cobros' : 'Subir PDF Cobros'}</span>
                  </label>
                  {pdfCobrosAnalisis && (
                    <button
                      type="button"
                      onClick={() => setPdfCobrosAnalisis(null)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                      title="Quitar extracto de Cobros"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* TARJETA 2: CUENTA PAGOS (2341055145) */}
              <div className={`p-4 rounded-xl border transition ${
                pdfPagosAnalisis
                  ? 'bg-sky-950/20 border-sky-500/40'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}>
                <input
                  type="file"
                  ref={filePagosInputRef}
                  onChange={(e) => handleProcessPdfFile(e.target.files?.[0], 'PAGOS')}
                  accept=".pdf,application/pdf"
                  className="hidden"
                  id="pdf-pagos-upload"
                />

                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                    <strong className="text-xs font-bold text-white">2. Cuenta Pagos (23410551/45)</strong>
                  </div>
                  {pdfPagosAnalisis && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      ✓ Cargado
                    </span>
                  )}
                </div>

                <div className="py-3 text-xs space-y-1">
                  {pdfPagosAnalisis ? (
                    <>
                      <p className="text-slate-300 truncate font-mono text-[11px]">
                        📄 {pdfPagosAnalisis.fileName || 'Extracto Pagos.pdf'}
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        Período: <strong className="text-white">{pdfPagosAnalisis.periodo}</strong> ({pdfPagosAnalisis.transactions.length} movs)
                      </p>
                      <p className="text-sky-400 font-bold font-mono">
                        Saldo Final: {fmtMoney(pdfPagosAnalisis.saldoFinal)}
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-500 text-[11px]">
                      Selecciona el extracto bancario PDF correspondiente a la cuenta de Pagos / Proveedores.
                    </p>
                  )}
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <label
                    htmlFor="pdf-pagos-upload"
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 ${
                      pdfPagosAnalisis
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        : 'bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20'
                    } ${isProcessingPdfPagos ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isProcessingPdfPagos ? 'Procesando...' : pdfPagosAnalisis ? 'Reemplazar PDF Pagos' : 'Subir PDF Pagos'}</span>
                  </label>
                  {pdfPagosAnalisis && (
                    <button
                      type="button"
                      onClick={() => setPdfPagosAnalisis(null)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                      title="Quitar extracto de Pagos"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN PRINCIPALES (AUTOCOMPLETAR EXCEL CON AMBOS PDFS) */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-center gap-3">
              {/* Hidden Input para Cargar Plantilla de Conciliación Sindicato Excel */}
              <input
                type="file"
                ref={excelFillInputRef}
                onChange={handleExcelFillUpload}
                accept=".xlsx,.xls"
                className="hidden"
                id="sindicato-excel-upload"
              />

              {hasAtLeastOnePdf ? (
                hayMovimientosSinCategorizar ? (
                  <button
                    type="button"
                    onClick={() => {
                      setReclassifyPdfTab(pdfCobrosAnalisis?.totalNoCategorizadas > 0 ? 'cobros' : 'pagos')
                      setIsReclassifyModalOpen(true)
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xl shadow-amber-500/20 transition cursor-pointer active:scale-95 animate-pulse"
                    title="Debe asignar categoría a todos los movimientos antes de autocompletar el Excel"
                  >
                    <AlertTriangle className="w-5 h-5 text-slate-950" />
                    <span>⚠️ Bloqueado: {totalPendientesCategorizar} Sin Categorizar (Clic para Asignar)</span>
                  </button>
                ) : (
                  <label
                    htmlFor="sindicato-excel-upload"
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-xl shadow-purple-600/30 transition cursor-pointer active:scale-95 ${
                      isFillingExcel ? 'opacity-50 pointer-events-none' : ''
                    }`}
                    title="Seleccionar 'Conciliación Sindicato 2026 2027.xlsx' para autocompletar ambas cuentas y descargar en 1 solo paso"
                  >
                    <FolderOpen className="w-5 h-5 text-amber-300" />
                    <span>
                      {isFillingExcel
                        ? 'Autocompletando ambas cuentas...'
                        : pdfCobrosAnalisis && pdfPagosAnalisis
                        ? '🚀 Autocompletar Excel con Cobros y Pagos (1 Clic)'
                        : '📁 Autocompletar en Excel Sindicato'}
                    </span>
                  </label>
                )
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Sube al menos un extracto PDF arriba para habilitar el autocompletado del Excel.
                </p>
              )}

              {currentPdfAnalisis && (
                <button
                  type="button"
                  onClick={() => exportarAnalisisBancoExcel(currentPdfAnalisis)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Excel 4 Hojas ({activePdfTab === 'cobros' ? 'Cobros' : 'Pagos'})</span>
                </button>
              )}
            </div>

            {pdfError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pdfError}</span>
              </div>
            )}

            {excelFillError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{excelFillError}</span>
              </div>
            )}

            {excelFillResult && (
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs space-y-4 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/30 pb-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>¡Planilla de Conciliación Autocompletada y Verificada!</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Hoja: {excelFillResult.sheetUpdated}
                  </span>
                </div>

                {/* TARJETAS DE VERIFICACIÓN POR CUENTA (SALDO ANTERIOR Y SALDO FINAL VS CONTABLE) */}
                {excelFillResult.verificaciones && excelFillResult.verificaciones.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {excelFillResult.verificaciones.map((v, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <span className="font-bold text-xs text-white flex items-center gap-1.5">
                            <Landmark className="w-3.5 h-3.5 text-sky-400" />
                            <span>{v.accountLabel}</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            v.estaConciliado
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {v.estaConciliado ? '✓ Conciliado' : '⚠️ Discrepancia'}
                          </span>
                        </div>

                        {/* 1. Verificación Saldo Anterior */}
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between items-center text-slate-400">
                            <span>1. Saldo Anterior (Extracto PDF):</span>
                            <span className="font-mono text-white font-semibold">{fmtMoney(v.saldoAnteriorPdf)}</span>
                          </div>
                          {v.excelSaldoAnteriorOriginal !== null && (
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Saldo Anterior en Planilla Excel:</span>
                              <span className="font-mono text-white font-semibold">{fmtMoney(v.excelSaldoAnteriorOriginal)}</span>
                            </div>
                          )}
                          <div className={`p-1.5 rounded-lg flex items-center justify-between ${
                            v.saldoAnteriorCoincide ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
                          }`}>
                            <span className="font-medium">Estado Saldo Anterior:</span>
                            <strong className="font-mono">
                              {v.saldoAnteriorCoincide ? '✓ Coincide exactamente' : `⚠️ Dif: ${fmtMoney(v.difSaldoAnterior)}`}
                            </strong>
                          </div>
                        </div>

                        {/* 2. Verificación Saldo Final vs Saldo Contable */}
                        <div className="space-y-1 text-[11px] pt-1.5 border-t border-slate-800/60">
                          <div className="flex justify-between items-center text-slate-400">
                            <span>2. Saldo Final (Extracto PDF):</span>
                            <span className="font-mono font-bold text-sky-300">{fmtMoney(v.saldoFinalPdf)}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-400">
                            <span>Saldo Contable (Excel):</span>
                            <span className="font-mono font-bold text-white">{fmtMoney(v.saldoContableCalculado)}</span>
                          </div>
                          {(v.chequesPendientes > 0 || v.depositosPendientes > 0) && (
                            <div className="text-[10px] text-slate-400 italic">
                              Partidas: Cheques pend: -{fmtMoney(v.chequesPendientes)} | Depósitos pend: +{fmtMoney(v.depositosPendientes)}
                            </div>
                          )}
                          <div className={`p-1.5 rounded-lg flex items-center justify-between ${
                            v.coincideExacto ? 'bg-emerald-500/10 text-emerald-300' : v.estaConciliado ? 'bg-sky-500/10 text-sky-300' : 'bg-rose-500/10 text-rose-300'
                          }`}>
                            <span className="font-medium">Saldo Final vs Contable:</span>
                            <strong className="font-mono">
                              {v.coincideExacto
                                ? '✓ Saldo Final = Saldo Contable'
                                : v.estaConciliado
                                ? '✓ Conciliado c/ partidas pend.'
                                : `⚠️ Dif: ${fmtMoney(v.diferenciaSaldoFinalVsContable)}`}
                            </strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-slate-300 text-center text-xs">
                  Se completaron las columnas en <strong className="text-white">"{excelFillResult.sheetUpdated}"</strong> para <strong className="text-sky-300">{excelFillResult.cuentasActualizadas}</strong>. El archivo descargado preserva el 100% del diseño y fórmulas originales.
                </p>
              </div>
            )}
          </div>

          {/* RESULTADOS DEL ANÁLISIS PDF CON SELECTOR DE CUENTA ACTIVA */}
          {hasAtLeastOnePdf && currentPdfAnalisis && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* SELECTOR DE EXTRACTO ACTIVO: COBROS VS PAGOS */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
                  {pdfCobrosAnalisis && (
                    <button
                      type="button"
                      onClick={() => setActivePdfTab('cobros')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        activePdfTab === 'cobros'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                      <span>Cuenta Cobros (2324)</span>
                      {pdfCobrosAnalisis.totalNoCategorizadas > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500 text-slate-950">
                          {pdfCobrosAnalisis.totalNoCategorizadas}
                        </span>
                      )}
                    </button>
                  )}

                  {pdfPagosAnalisis && (
                    <button
                      type="button"
                      onClick={() => setActivePdfTab('pagos')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        activePdfTab === 'pagos'
                          ? 'bg-sky-600 text-white shadow'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-sky-300"></span>
                      <span>Cuenta Pagos (5145)</span>
                      {pdfPagosAnalisis.totalNoCategorizadas > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500 text-slate-950">
                          {pdfPagosAnalisis.totalNoCategorizadas}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {currentPdfAnalisis?.totalNoCategorizadas > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setReclassifyPdfTab(activePdfTab)
                      setIsReclassifyModalOpen(true)
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition cursor-pointer flex items-center gap-1.5 animate-pulse"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Reclasificar {currentPdfAnalisis.totalNoCategorizadas} No Categorizados</span>
                  </button>
                )}
              </div>

              {/* BANNER DE ALERTA: MOVIMIENTOS NO CATEGORIZADOS */}
              {currentPdfAnalisis?.totalNoCategorizadas > 0 && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-in fade-in">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5 sm:mt-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-amber-200 flex items-center gap-2">
                        <span>Se detectaron {currentPdfAnalisis.totalNoCategorizadas} movimiento(s) Sin Categorizar</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {activePdfTab === 'cobros' ? 'Cuenta Cobros' : 'Cuenta Pagos'}
                        </span>
                      </h4>
                      <p className="text-xs text-amber-300/80 mt-0.5">
                        Débitos sin clasificar: <strong className="text-white">{fmtMoney(currentPdfAnalisis.noCategorizadasDebitos)}</strong> | Créditos sin clasificar: <strong className="text-white">{fmtMoney(currentPdfAnalisis.noCategorizadasCreditos)}</strong>.
                        <br className="hidden sm:inline" /> Para que la conciliación y el Excel queden 100% exactos, asigna la categoría correspondiente a cada uno.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReclassifyPdfTab(activePdfTab)
                      setIsReclassifyModalOpen(true)
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Asignar Categorías ({currentPdfAnalisis.totalNoCategorizadas})</span>
                  </button>
                </div>
              )}

              {/* METRICAS HEADER DEL PDF SELECCIONADO (INCLUYE SALDO ANTERIOR Y SALDO FINAL) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
                  <p className="text-[11px] text-slate-400 font-medium">Cuenta & Período</p>
                  <h4 className="text-sm font-bold text-white font-mono mt-0.5 truncate">
                    {currentPdfAnalisis.account}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {currentPdfAnalisis.tipo}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {currentPdfAnalisis.transactions.length} movs
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
                  <p className="text-[11px] text-slate-400 font-medium">1. Saldo Anterior Oficial</p>
                  <h4 className="text-base font-bold text-sky-300 font-mono mt-0.5 truncate">
                    {fmtMoney(currentPdfAnalisis.saldoAnterior || 0)}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">Inicio de extracto bancario</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
                  <p className="text-[11px] text-slate-400 font-medium">Movimientos del Período</p>
                  <div className="mt-0.5 space-y-0.5 font-mono text-xs">
                    <div className="text-rose-400 font-bold truncate">
                      - {fmtMoney(currentPdfAnalisis.totalDebitos)}
                    </div>
                    <div className="text-emerald-400 font-bold truncate">
                      + {fmtMoney(currentPdfAnalisis.totalCreditos)}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
                  <p className="text-[11px] text-slate-400 font-medium">2. Saldo Final del Extracto</p>
                  <h4 className="text-base font-bold text-emerald-400 font-mono mt-0.5 truncate">
                    {fmtMoney(currentPdfAnalisis.saldoFinal)}
                  </h4>
                  {(() => {
                    const calculado = (currentPdfAnalisis.saldoAnterior || 0) - currentPdfAnalisis.totalDebitos + currentPdfAnalisis.totalCreditos
                    const cuadra = Math.abs(calculado - (currentPdfAnalisis.saldoFinal || 0)) < 0.05
                    return (
                      <span className={`text-[10px] font-bold mt-1 inline-block ${cuadra ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {cuadra ? '✓ Cuadra con movimientos' : `⚠️ Dif: ${fmtMoney(calculado - currentPdfAnalisis.saldoFinal)}`}
                      </span>
                    )
                  })()}
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
                      <span>1. Estado de Cuenta ({currentPdfAnalisis.transactions.length})</span>
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
                      <span>2. Totales por Detalle ({currentPdfAnalisis.listaTotalesDetalle.length})</span>
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
                      onClick={() => exportarAnalisisBancoExcel(currentPdfAnalisis)}
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
                          {currentPdfAnalisis.transactions
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
                                <td className="py-1.5 px-3 text-center whitespace-nowrap">
                                  {t.CATEGORIA === 'NO CATEGORIZADAS' ? (
                                    <select
                                      value={t.CATEGORIA}
                                      onChange={(e) => handleReclassifyTransaction(activePdfTab, t.id, e.target.value)}
                                      className="px-2 py-1 rounded-lg text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 focus:outline-none cursor-pointer animate-pulse"
                                      title="Movimiento sin categorizar - Selecciona su categoría"
                                    >
                                      <option value="NO CATEGORIZADAS">⚠️ NO CATEGORIZADA</option>
                                      {ORDEN_CATEGORIAS.map((c) => (
                                        <option key={c} value={c}>
                                          {c}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <select
                                      value={t.CATEGORIA}
                                      onChange={(e) => handleReclassifyTransaction(activePdfTab, t.id, e.target.value)}
                                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-sky-300 border border-slate-700 hover:border-slate-600 focus:outline-none cursor-pointer"
                                      title="Clic para cambiar categoría"
                                    >
                                      {ORDEN_CATEGORIAS.map((c) => (
                                        <option key={c} value={c}>
                                          {c}
                                        </option>
                                      ))}
                                      <option value="NO CATEGORIZADAS">NO CATEGORIZADAS</option>
                                    </select>
                                  )}
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
                        {currentPdfAnalisis.listaTotalesDetalle.map((row, i) => {
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
                        {currentPdfAnalisis.resumenCategorias.map((row) => {
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
                      const subObj = currentPdfAnalisis.detallePorCategoria[cat] || {}
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

      {/* MODAL PARA RECLASIFICAR MOVIMIENTOS NO CATEGORIZADOS */}
      {isReclassifyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* MODAL HEADER */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                    <span>Reclasificar Movimientos Sin Categorizar</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      Asignación Interactiva
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Asigna la categoría correspondiente para que los totales de la Conciliación y el Excel se actualicen automáticamente.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReclassifyModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB SELECTOR: COBROS VS PAGOS */}
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {pdfCobrosAnalisis && (
                  <button
                    type="button"
                    onClick={() => setReclassifyPdfTab('cobros')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      reclassifyPdfTab === 'cobros'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Cuenta Cobros (2324)</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      (pdfCobrosAnalisis.totalNoCategorizadas || 0) > 0
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {pdfCobrosAnalisis.totalNoCategorizadas || 0} pendientes
                    </span>
                  </button>
                )}

                {pdfPagosAnalisis && (
                  <button
                    type="button"
                    onClick={() => setReclassifyPdfTab('pagos')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      reclassifyPdfTab === 'pagos'
                        ? 'bg-sky-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>Cuenta Pagos (5145)</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      (pdfPagosAnalisis.totalNoCategorizadas || 0) > 0
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {pdfPagosAnalisis.totalNoCategorizadas || 0} pendientes
                    </span>
                  </button>
                )}
              </div>

              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Cambios guardados en tiempo real ⚡
              </span>
            </div>

            {/* MODAL BODY */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {(() => {
                const activeAnalisis = reclassifyPdfTab === 'cobros' ? pdfCobrosAnalisis : pdfPagosAnalisis
                if (!activeAnalisis) {
                  return (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No hay extracto cargado para esta cuenta.
                    </div>
                  )
                }

                const noCatList = activeAnalisis.transactions.filter((t) => t.CATEGORIA === 'NO CATEGORIZADAS')

                if (noCatList.length === 0) {
                  return (
                    <div className="p-8 text-center space-y-3 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl">
                      <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-white">¡Excelente! Todos los movimientos están categorizados</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        No queda ningún movimiento pendiente en la cuenta de <strong className="text-emerald-300">{reclassifyPdfTab === 'cobros' ? 'Cobros (2324)' : 'Pagos (5145)'}</strong>. Ya puedes autocompletar el Excel de Conciliación con total precisión.
                      </p>
                    </div>
                  )
                }

                return (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-300">
                        Mostrando <strong className="text-amber-300">{noCatList.length}</strong> movimientos sin clasificar:
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        Débitos: <strong className="text-rose-400">{fmtMoney(activeAnalisis.noCategorizadasDebitos)}</strong> | Créditos: <strong className="text-emerald-400">{fmtMoney(activeAnalisis.noCategorizadasCreditos)}</strong>
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                      <table className="w-full text-xs text-left">
                        <thead className="text-[11px] text-slate-400 bg-slate-900 uppercase border-b border-slate-800 sticky top-0">
                          <tr>
                            <th className="py-2.5 px-3">Fecha</th>
                            <th className="py-2.5 px-3">Detalle Operación</th>
                            <th className="py-2.5 px-3">Comprobante</th>
                            <th className="py-2.5 px-3 text-right">Monto ($)</th>
                            <th className="py-2.5 px-3 min-w-[200px]">Asignar Nueva Categoría</th>
                            <th className="py-2.5 px-3 text-center">Acción Masiva</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-sans text-xs">
                          {noCatList.map((t) => {
                            const isDebito = Number(t.DEBITOS || 0) > 0
                            const monto = isDebito ? t.DEBITOS : t.CREDITOS
                            const countMatchingDetalle = activeAnalisis.transactions.filter(
                              (x) => x.DETALLE === t.DETALLE && x.CATEGORIA === 'NO CATEGORIZADAS'
                            ).length

                            return (
                              <tr key={t.id} className="hover:bg-slate-800/40 transition">
                                <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">{t.FECHA}</td>
                                <td className="py-2.5 px-3 font-medium text-white max-w-[260px] truncate" title={t.DETALLE}>
                                  {t.DETALLE}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-400">{t.COMPROB || '-'}</td>
                                <td className={`py-2.5 px-3 font-mono font-bold text-right whitespace-nowrap ${
                                  isDebito ? 'text-rose-400' : 'text-emerald-400'
                                }`}>
                                  {isDebito ? `- ${fmtMoney(monto)}` : `+ ${fmtMoney(monto)}`}
                                </td>
                                <td className="py-2.5 px-3">
                                  <select
                                    value={t.CATEGORIA}
                                    onChange={(e) => handleReclassifyTransaction(reclassifyPdfTab, t.id, e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
                                  >
                                    <option value="NO CATEGORIZADAS">Seleccionar Categoría...</option>
                                    {ORDEN_CATEGORIAS.map((cat) => (
                                      <option key={cat} value={cat}>
                                        {cat}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {countMatchingDetalle > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const elegida = window.prompt(
                                          `Seleccione la categoría para los ${countMatchingDetalle} movimientos con detalle "${t.DETALLE}":\n\n1. IMPUESTOS DEB/CRED\n2. IVA DEBITO\n3. COMISIONES Y GASTOS\n4. CHEQUES DEBITADOS\n5. INTERDEPOSITOS\n6. DEPOSITOS`,
                                          '1'
                                        )
                                        if (elegida) {
                                          const idx = parseInt(elegida) - 1
                                          if (ORDEN_CATEGORIAS[idx]) {
                                            handleReclassifyTransaction(reclassifyPdfTab, t.id, ORDEN_CATEGORIAS[idx], true)
                                          }
                                        }
                                      }}
                                      className="px-2 py-1 rounded bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-[10px] font-bold transition cursor-pointer"
                                      title={`Hay ${countMatchingDetalle} movimientos con el mismo detalle. Clic para aplicar la misma categoría a todos.`}
                                    >
                                      Aplicar a los {countMatchingDetalle}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-400">
                Los cambios se recalculan instantáneamente en las 4 hojas y en el autocompletado de Excel.
              </span>
              <button
                type="button"
                onClick={() => setIsReclassifyModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg transition cursor-pointer"
              >
                Listo / Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
