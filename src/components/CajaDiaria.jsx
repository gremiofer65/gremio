import React, { useState, useMemo, useEffect } from 'react'
import * as XLSX from 'xlsx'
import {
  Calendar,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Printer,
  Download,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Receipt,
  Wallet,
  Landmark,
  Building2,
  FileSpreadsheet,
  Check,
  X,
  Calculator,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  ArrowRightLeft,
  Layers,
  FileText,
  ArrowDownCircle,
  CreditCard
} from 'lucide-react'

const formatDateDMY = (dateStr) => {
  if (!dateStr) return '-'
  const str = String(dateStr).trim()
  if (!str) return '-'
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(str)) return str
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) {
    const [, y, m, d] = isoMatch
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
  }
  return str
}

// Listas base de respaldo si Tablas Maestras estuviera vacía
export const CONCEPTOS_INGRESOS_FALLBACK = [
  'Alquiler Campo de Deportes / Salón',
  'Alquiler Consultorios',
  'Billeteras (Locación Consultorios)',
  'Caja',
  'CENS (Centro Nivel Secundario)',
  'Centro Cultural',
  'CFL (Centro Formación Laboral)',
  'Consultas Médicas',
  'Cuota Jubilados',
  'Enfermería',
  'FAMS',
  'IAM SEGURO',
  'La Estrella Seg de Retiro',
  'Loc. Policlinico',
  'Odontología',
  'Operaciones en Banco',
  'Prácticas Médicas',
  'Transferencia entre cuentas',
  'Uso Natatorio',
  'Valores a Depositar',
  'Venta Cantina',
  'Otros Ingresos'
]

export const CONCEPTOS_EGRESOS_FALLBACK = [
  'Asesoramiento',
  'Comisiones Bancarias',
  'Cta. Bco. 10551/45',
  'Equipamiento e Instalaciones',
  'Gastos Generales',
  'Gastos Gremiales',
  'Gastos Policlinico',
  'Honorarios',
  'Imprenta y Utiles',
  'Impuestos y Tasas',
  'Insumos Médicos y Odontológicos',
  'Limpieza y Desinfección',
  'Lubricantes y Combustibles',
  'Luz Sede Social',
  'Mantenimiento y Mejoras',
  'Mejoras C. de Depor. (salón)',
  'Publicidad',
  'Seguros',
  'Serv. Cont. Y Aseso.',
  'Servicios de Farmacia',
  'Subsidios',
  'Sueldos y Cs Sociales',
  'Utiles Escolares (vaucher)',
  'Otros Egresos'
]

const DENOMINACIONES_BILLETES = [
  { label: '$ 20.000', value: 20000 },
  { label: '$ 10.000', value: 10000 },
  { label: '$ 2.000', value: 2000 },
  { label: '$ 1.000', value: 1000 },
  { label: '$ 500', value: 500 },
  { label: '$ 200', value: 200 },
  { label: '$ 100', value: 100 },
  { label: '$ 50', value: 50 },
  { label: 'Monedas / Otros', value: 1 }
]

export default function CajaDiaria({
  currentUser,
  movimientosGlobales = [],
  maestros = {},
  chequesEnCartera = [],
  onRegistrarCheque,
  onDepositarCheque,
  bancosList = [],
  supabase,
  fmtMoney = (val) => `$ ${Number(val || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}) {
  // Fecha seleccionada (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })

  // Almacén de jornadas de caja (por fecha)
  const [cajasData, setCajasData] = useState(() => {
    try {
      const stored = localStorage.getItem('caja_diaria_records_v1')
      if (stored) return JSON.parse(stored)
    } catch (e) {
      console.error('Error cargando caja diaria local:', e)
    }
    // Estado inicial de demostración con datos de la planilla ejemplo
    return {
      '2025-09-18': {
        saldoInicial: 1507920,
        responsable: 'Secretaría de Administración',
        observaciones: 'Cierre de caja según planilla de secretaría',
        recuentoManual: 1507920,
        desgloseBilletes: {},
        movimientos: [
          {
            id: 'demo-1',
            tipo: 'ingreso',
            subcategoria: 'ordinario',
            concepto: 'FAMS',
            medioPago: 'transferencia_cheque',
            monto: 109166.43,
            comprobante: '',
            observaciones: ''
          },
          {
            id: 'demo-2',
            tipo: 'ingreso',
            subcategoria: 'banco',
            concepto: 'Transferencia de 10523/24 a 10551/45',
            medioPago: 'transferencia_cheque',
            monto: 4000000,
            comprobante: 'Operación en Banco',
            observaciones: 'Transferencia bancaria entre cuentas'
          },
          {
            id: 'demo-3',
            tipo: 'ingreso',
            subcategoria: 'banco',
            concepto: 'Valores a Depositar',
            medioPago: 'efectivo',
            monto: 680000,
            comprobante: 'Operación 005',
            observaciones: 'Salón'
          },
          {
            id: 'demo-4',
            tipo: 'egreso',
            subcategoria: 'ordinario',
            concepto: 'Servicios de Farmacia',
            medioPago: 'efectivo',
            monto: 36033.5,
            comprobante: '',
            observaciones: ''
          },
          {
            id: 'demo-5',
            tipo: 'egreso',
            subcategoria: 'ordinario',
            concepto: 'Luz Sede Social',
            medioPago: 'efectivo',
            monto: 11200,
            comprobante: 'Factura Eden',
            observaciones: 'Sede'
          },
          {
            id: 'demo-6',
            tipo: 'egreso',
            subcategoria: 'ordinario',
            concepto: 'Luz Sede Social',
            medioPago: 'transferencia_cheque',
            monto: 182428.07,
            comprobante: 'Débito Automático',
            observaciones: 'Sede'
          },
          {
            id: 'demo-7',
            tipo: 'egreso',
            subcategoria: 'ordinario',
            concepto: 'Gastos Policlinico',
            medioPago: 'transferencia_cheque',
            monto: 107400,
            comprobante: '',
            observaciones: 'Policlínico'
          }
        ]
      }
    }
  })

  // Guardar en localStorage ante cambios
  useEffect(() => {
    try {
      localStorage.setItem('caja_diaria_records_v1', JSON.stringify(cajasData))
    } catch (e) {
      console.error('Error guardando en localStorage:', e)
    }
  }, [cajasData])

  // Datos de la caja actual seleccionada
  const currentCaja = useMemo(() => {
    const record = cajasData[selectedDate]
    if (record) return record

    // Si no existe, buscar el saldo final de la fecha previa más reciente
    const allDates = Object.keys(cajasData).sort()
    let prevSaldo = 0
    for (const d of allDates) {
      if (d < selectedDate) {
        const prev = cajasData[d]
        const ingEf = (prev.movimientos || [])
          .filter((m) => m.tipo === 'ingreso' && m.medioPago === 'efectivo')
          .reduce((acc, m) => acc + (Number(m.monto) || 0), 0)
        const egEf = (prev.movimientos || [])
          .filter((m) => m.tipo === 'egreso' && m.medioPago === 'efectivo')
          .reduce((acc, m) => acc + (Number(m.monto) || 0), 0)
        prevSaldo = (Number(prev.saldoInicial) || 0) + ingEf - egEf
      }
    }

    return {
      saldoInicial: prevSaldo,
      responsable: currentUser?.nombre || 'Secretaría',
      observaciones: '',
      recuentoManual: null,
      desgloseBilletes: {},
      movimientos: []
    }
  }, [cajasData, selectedDate, currentUser])

  // Modal para agregar / editar movimiento
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMovId, setEditingMovId] = useState(null)
  const [modalTipo, setModalTipo] = useState('ingreso') // 'ingreso' | 'egreso'
  const [modalSubcategoria, setModalSubcategoria] = useState('ordinario') // 'ordinario' | 'banco'
  const [modalConcepto, setModalConcepto] = useState('')
  const [modalMedioPago, setModalMedioPago] = useState('efectivo') // 'efectivo' | 'transferencia_cheque' | 'cheque'
  const [modalMonto, setModalMonto] = useState('')
  const [modalComprobante, setModalComprobante] = useState('')
  const [modalObservaciones, setModalObservaciones] = useState('')

  // Campos específicos cuando se ingresa un Cheque
  const [isChequeEntry, setIsChequeEntry] = useState(false)
  const [chequeNumero, setChequeNumero] = useState('')
  const [chequeBanco, setChequeBanco] = useState('')
  const [chequeFechaCobro, setChequeFechaCobro] = useState('')
  const [chequeEmisor, setChequeEmisor] = useState('')
  const [chequeFormato, setChequeFormato] = useState('FISICO') // 'FISICO' | 'ECHEQ'
  const [chequeCuit, setChequeCuit] = useState('')

  // Modal para Depositar Cheques de Cartera (Bajar cheques)
  const [isDepositarModalOpen, setIsDepositarModalOpen] = useState(false)
  const [selectedChequeToDeposit, setSelectedChequeToDeposit] = useState(null)
  const [depositoBancoDestino, setDepositoBancoDestino] = useState('Cta. Bco. 10551/45')

  // Modal para calculadora de arqueo
  const [isArqueoModalOpen, setIsArqueoModalOpen] = useState(false)
  const [billetesTemp, setBilletesTemp] = useState({})
  const [recuentoDirectoInput, setRecuentoDirectoInput] = useState('')

  // Toast / Mensajes de éxito
  const [toastMessage, setToastMessage] = useState('')
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 4000)
  }

  // Cheques activos en cartera (no cobrados ni anulados)
  const chequesDisponibles = useMemo(() => {
    return (chequesEnCartera || []).filter((c) => !c.isPagado && c.status !== 'ANULADO' && c.status !== 'CADUCADO')
  }, [chequesEnCartera])

  // Cálculos de la jornada
  const totals = useMemo(() => {
    const movs = currentCaja.movimientos || []

    const ingresosEfectivo = movs
      .filter((m) => m.tipo === 'ingreso' && m.medioPago === 'efectivo')
      .reduce((acc, m) => acc + (Number(m.monto) || 0), 0)

    const ingresosBanco = movs
      .filter((m) => m.tipo === 'ingreso' && (m.medioPago === 'transferencia_cheque' || m.medioPago === 'cheque'))
      .reduce((acc, m) => acc + (Number(m.monto) || 0), 0)

    const operacionesEnBancoTotal = movs
      .filter(
        (m) =>
          m.subcategoria === 'banco' ||
          (m.concepto || '').toLowerCase().includes('banco') ||
          (m.concepto || '').toLowerCase().includes('valores a depositar') ||
          (m.concepto || '').toLowerCase().includes('transferencia')
      )
      .reduce((acc, m) => acc + (Number(m.monto) || 0), 0)

    const egresosEfectivo = movs
      .filter((m) => m.tipo === 'egreso' && m.medioPago === 'efectivo')
      .reduce((acc, m) => acc + (Number(m.monto) || 0), 0)

    const egresosBanco = movs
      .filter((m) => m.tipo === 'egreso' && (m.medioPago === 'transferencia_cheque' || m.medioPago === 'cheque'))
      .reduce((acc, m) => acc + (Number(m.monto) || 0), 0)

    const totalIngresos = ingresosEfectivo + ingresosBanco
    const totalEgresos = egresosEfectivo + egresosBanco

    const saldoInicialEf = Number(currentCaja.saldoInicial) || 0
    const saldoTeoricoEfectivo = saldoInicialEf + ingresosEfectivo - egresosEfectivo
    const saldoNetoBanco = ingresosBanco - egresosBanco

    // Recuento físico de billetes o manual
    let recuentoFisico = null
    const desglose = currentCaja.desgloseBilletes || {}
    const hasDesglose = Object.values(desglose).some((qty) => Number(qty) > 0)

    if (hasDesglose) {
      recuentoFisico = DENOMINACIONES_BILLETES.reduce((acc, b) => {
        const qty = Number(desglose[b.value]) || 0
        return acc + qty * b.value
      }, 0)
    } else if (currentCaja.recuentoManual !== null && currentCaja.recuentoManual !== undefined) {
      recuentoFisico = Number(currentCaja.recuentoManual)
    }

    const diferenciaCaja = recuentoFisico !== null ? recuentoFisico - saldoTeoricoEfectivo : null

    return {
      saldoInicialEf,
      ingresosEfectivo,
      ingresosBanco,
      operacionesEnBancoTotal,
      totalIngresos,
      egresosEfectivo,
      egresosBanco,
      totalEgresos,
      saldoTeoricoEfectivo,
      saldoNetoBanco,
      recuentoFisico,
      diferenciaCaja
    }
  }, [currentCaja])

  // Actualizar un campo de la jornada actual
  const updateCurrentCaja = (field, value) => {
    setCajasData((prev) => {
      const existing = prev[selectedDate] || {
        saldoInicial: 0,
        responsable: currentUser?.nombre || 'Secretaría',
        observaciones: '',
        recuentoManual: null,
        desgloseBilletes: {},
        movimientos: []
      }
      return {
        ...prev,
        [selectedDate]: {
          ...existing,
          [field]: value
        }
      }
    })
  }

  // Navegación de días
  const changeDay = (offset) => {
    const parts = selectedDate.split('-')
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    d.setDate(d.getDate() + offset)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    setSelectedDate(`${year}-${month}-${day}`)
  }

  const setToday = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    setSelectedDate(`${year}-${month}-${day}`)
  }

  // Listados de conceptos tomados DIRECTAMENTE de las Tablas Maestras (sin duplicados)
  const allIngresosConceptos = useMemo(() => {
    const list = maestros && maestros.ingresosTipos && maestros.ingresosTipos.length > 0
      ? maestros.ingresosTipos
      : CONCEPTOS_INGRESOS_FALLBACK
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, 'es'))
  }, [maestros?.ingresosTipos])

  const allEgresosConceptos = useMemo(() => {
    const list = maestros && maestros.conceptosGastos && maestros.conceptosGastos.length > 0
      ? maestros.conceptosGastos
      : CONCEPTOS_EGRESOS_FALLBACK
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, 'es'))
  }, [maestros?.conceptosGastos])

  // Abrir modal de nuevo movimiento
  const openNewModal = (tipo = 'ingreso', subcategoria = 'ordinario') => {
    setEditingMovId(null)
    setModalTipo(tipo)
    setModalSubcategoria(subcategoria)
    setModalConcepto('')
    setModalMedioPago(subcategoria === 'banco' ? 'transferencia_cheque' : 'efectivo')
    setModalMonto('')
    setModalComprobante('')
    setModalObservaciones('')

    setIsChequeEntry(false)
    setChequeNumero('')
    setChequeBanco(bancosList[0] || 'Banco de la Nación Argentina (BNA)')
    setChequeFechaCobro(selectedDate)
    setChequeEmisor('')
    setChequeFormato('FISICO')
    setChequeCuit('')

    setIsModalOpen(true)
  }

  // Abrir modal para editar
  const openEditModal = (mov) => {
    setEditingMovId(mov.id)
    setModalTipo(mov.tipo)
    setModalSubcategoria(mov.subcategoria || 'ordinario')
    setModalConcepto(mov.concepto)
    setModalMedioPago(mov.medioPago)
    setModalMonto(mov.monto)
    setModalComprobante(mov.comprobante || '')
    setModalObservaciones(mov.observaciones || '')

    setIsChequeEntry(!!mov.chequeDetails)
    if (mov.chequeDetails) {
      setChequeNumero(mov.chequeDetails.numero || '')
      setChequeBanco(mov.chequeDetails.banco || '')
      setChequeFechaCobro(mov.chequeDetails.fechaCobro || '')
      setChequeEmisor(mov.chequeDetails.emisor || '')
      setChequeFormato(mov.chequeDetails.formato || 'FISICO')
      setChequeCuit(mov.chequeDetails.cuit || '')
    }

    setIsModalOpen(true)
  }

  // Guardar movimiento (con alta automática en Cartera de Cheques si es cheque)
  const handleSaveMovimiento = async (e) => {
    e.preventDefault()
    if (!modalConcepto.trim() || !modalMonto || Number(modalMonto) <= 0) {
      alert('Por favor selecciona un concepto y especifica un monto válido mayor a 0.')
      return
    }

    const currentMovs = currentCaja.movimientos || []
    let updatedMovs = []

    let chequeDetails = null
    let linkedChequeMovId = null

    // Si se indicó que es cheque o el concepto es Valores a Depositar / Cheque
    if (isChequeEntry || modalMedioPago === 'cheque' || modalConcepto.toLowerCase().includes('valores a depositar')) {
      chequeDetails = {
        numero: chequeNumero.trim() || modalComprobante.trim() || `CHQ-${Date.now().toString().slice(-6)}`,
        banco: chequeBanco.trim() || 'Banco',
        fechaCobro: chequeFechaCobro || selectedDate,
        emisor: chequeEmisor.trim() || 'Cliente / Tercero',
        formato: chequeFormato,
        cuit: chequeCuit.trim()
      }

      // Si es un nuevo ingreso de cheque, registrarlo en la Cartera de Cheques global
      if (modalTipo === 'ingreso' && onRegistrarCheque && !editingMovId) {
        try {
          const createdMov = await onRegistrarCheque({
            fecha: selectedDate,
            concepto: modalConcepto,
            numero: chequeDetails.numero,
            banco: chequeDetails.banco,
            fechaCobro: chequeDetails.fechaCobro,
            emisor: chequeDetails.emisor,
            formato: chequeDetails.formato,
            monto: Number(modalMonto),
            observaciones: modalObservaciones
          })
          if (createdMov) linkedChequeMovId = createdMov.id
        } catch (err) {
          console.error('Error registrando en cartera de cheques:', err)
        }
      }
    }

    if (editingMovId) {
      updatedMovs = currentMovs.map((m) =>
        m.id === editingMovId
          ? {
              ...m,
              tipo: modalTipo,
              subcategoria: modalSubcategoria,
              concepto: modalConcepto.trim(),
              medioPago: isChequeEntry ? 'transferencia_cheque' : modalMedioPago,
              monto: Number(modalMonto),
              comprobante: modalComprobante.trim() || (chequeDetails ? `Cheque N° ${chequeDetails.numero}` : ''),
              observaciones: modalObservaciones.trim(),
              chequeDetails: chequeDetails || m.chequeDetails
            }
          : m
      )
      showToast('Movimiento actualizado.')
    } else {
      const newMov = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        tipo: modalTipo,
        subcategoria: modalSubcategoria,
        concepto: modalConcepto.trim(),
        medioPago: isChequeEntry ? 'transferencia_cheque' : modalMedioPago,
        monto: Number(modalMonto),
        comprobante: modalComprobante.trim() || (chequeDetails ? `Cheque N° ${chequeDetails.numero}` : ''),
        observaciones: modalObservaciones.trim(),
        chequeDetails,
        linkedChequeMovId
      }
      updatedMovs = [...currentMovs, newMov]

      if (isChequeEntry) {
        showToast(`✅ Cheque N° ${chequeDetails.numero} ingresado a Caja y AGREGADO a la Cartera de Cheques.`)
      } else {
        showToast('Movimiento añadido a la caja diaria.')
      }
    }

    updateCurrentCaja('movimientos', updatedMovs)
    setIsModalOpen(false)
  }

  // Eliminar movimiento
  const handleDeleteMovimiento = (id) => {
    if (!window.confirm('¿Deseas eliminar este movimiento de la caja diaria?')) return
    const updated = (currentCaja.movimientos || []).filter((m) => m.id !== id)
    updateCurrentCaja('movimientos', updated)
    showToast('Movimiento eliminado.')
  }

  // Abrir modal para depositar cheque de cartera
  const openDepositarModal = (cheque = null) => {
    setSelectedChequeToDeposit(cheque)
    setDepositoBancoDestino('Cta. Bco. 10551/45')
    setIsDepositarModalOpen(true)
  }

  // Confirmar depósito de cheque: lo registra en Caja Diaria y lo baja de la cartera de cheques
  const handleConfirmarDepositoCheque = async () => {
    if (!selectedChequeToDeposit) {
      alert('Por favor selecciona un cheque para depositar.')
      return
    }

    const chq = selectedChequeToDeposit
    const chqNro = chq.chequeRef || `Cheque ${chq.entidad}`
    const importe = Number(chq.importe || 0)

    // 1. Registrar el movimiento bancario en la Caja Diaria del día seleccionado
    const newBankMov = {
      id: `dep-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tipo: 'ingreso',
      subcategoria: 'banco',
      concepto: 'Valores a Depositar',
      medioPago: 'transferencia_cheque',
      monto: importe,
      comprobante: `Depósito en ${depositoBancoDestino}`,
      observaciones: `Cheque de ${chq.entidad} depositado (${chqNro})`,
      depositedChequeId: chq.id
    }

    const currentMovs = currentCaja.movimientos || []
    updateCurrentCaja('movimientos', [...currentMovs, newBankMov])

    // 2. Bajar el cheque de la cartera de cheques (marcarlo como Cobrado / Depositado)
    if (onDepositarCheque && chq.id) {
      try {
        await onDepositarCheque(chq.id, selectedDate, depositoBancoDestino)
      } catch (err) {
        console.error('Error bajando cheque de cartera:', err)
      }
    }

    setIsDepositarModalOpen(false)
    setSelectedChequeToDeposit(null)
    showToast(`✅ Cheque por ${fmtMoney(importe)} DEPOSITADO en ${depositoBancoDestino} y bajado de Cartera.`)
  }

  // Importar movimientos del Libro Diario correspondientes al día seleccionado según Fecha Pago / Ref.
  const handleImportarDelLibro = () => {
    if (!movimientosGlobales || movimientosGlobales.length === 0) {
      alert('No hay movimientos cargados en el Libro Diario para importar.')
      return
    }

    const matched = movimientosGlobales.filter((m) => {
      let effectiveDate = ''
      if (m.fechaPago && typeof m.fechaPago === 'string' && m.fechaPago.trim() !== '') {
        const fp = m.fechaPago.trim()
        if (fp.includes('T')) {
          effectiveDate = fp.split('T')[0]
        } else if (fp.includes('/')) {
          const parts = fp.split('/')
          if (parts.length === 3) {
            // DD/MM/YYYY
            effectiveDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
          } else {
            effectiveDate = fp
          }
        } else {
          effectiveDate = fp
        }
      } else {
        // Si no tiene fechaPago explícita, revisar si en chequeOperacion o detalle se especificó fecha de cobro/pago
        const ref = `${m.chequeOperacion || ''} ${m.detalle || ''}`
        const cobroMatch = ref.match(/(?:cobro|pago|fecha)[:\s]*([0-9]{4}-[0-9]{2}-[0-9]{2})/i)
        if (cobroMatch) {
          effectiveDate = cobroMatch[1]
        } else {
          const slashMatch = ref.match(/(?:cobro|pago|fecha)[:\s]*([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})/i)
          if (slashMatch) {
            effectiveDate = `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`
          } else if (m.fecha) {
            // Fallback a fecha de emisión solo si no hay fecha de pago
            effectiveDate = String(m.fecha).includes('T') ? String(m.fecha).split('T')[0] : String(m.fecha).trim()
          }
        }
      }
      return effectiveDate === selectedDate
    })

    if (matched.length === 0) {
      alert(`No se encontraron movimientos registrados en el Libro Diario con Fecha de Pago/Ref para la fecha ${selectedDate}.`)
      return
    }

    const currentMovs = currentCaja.movimientos || []
    const newItems = []

    matched.forEach((m) => {
      const isIngreso = m.rubro === 'INGRESOS' || (m.ingresosS && Number(m.ingresosS) > 0) || (m.total && Number(m.total) > 0)
      const isEfectivo = !m.chequeOperacion || m.chequeOperacion.toLowerCase().includes('efectivo') || m.chequeOperacion === ''
      const isBanco =
        (m.chequeOperacion && !isEfectivo) ||
        (m.empresaConcepto || '').toLowerCase().includes('banco') ||
        (m.empresaConcepto || '').toLowerCase().includes('transferencia')

      let monto = 0
      if (m.rubro === 'MÉDICO') {
        monto = Number(m.netoPagadoMed || m.pagosMed || 0)
      } else if (isIngreso) {
        monto = Number(m.total || m.ingresosS || 0)
      } else {
        monto = Number(m.pagosS || 0)
      }

      if (monto > 0) {
        newItems.push({
          id: `imp-${m.id || Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          tipo: isIngreso ? 'ingreso' : 'egreso',
          subcategoria: isBanco ? 'banco' : 'ordinario',
          concepto: m.empresaConcepto || m.rubro || 'Movimiento Libro',
          medioPago: isEfectivo ? 'efectivo' : 'transferencia_cheque',
          monto: monto,
          comprobante: m.facturaNro || m.chequeOperacion || '',
          observaciones: m.detalle || m.observaciones || ''
        })
      }
    })

    if (newItems.length === 0) {
      alert('No se encontraron importes válidos para importar.')
      return
    }

    updateCurrentCaja('movimientos', [...currentMovs, ...newItems])
    showToast(`Se importaron ${newItems.length} movimientos desde el Libro Diario.`)
  }

  // Abrir modal de arqueo
  const openArqueoModal = () => {
    setBilletesTemp(currentCaja.desgloseBilletes || {})
    setRecuentoDirectoInput(
      currentCaja.recuentoManual !== null && currentCaja.recuentoManual !== undefined
        ? String(currentCaja.recuentoManual)
        : ''
    )
    setIsArqueoModalOpen(true)
  }

  // Guardar arqueo
  const handleSaveArqueo = () => {
    const hasBilletes = Object.values(billetesTemp).some((q) => Number(q) > 0)
    if (hasBilletes) {
      const calcTotal = DENOMINACIONES_BILLETES.reduce((acc, b) => {
        const qty = Number(billetesTemp[b.value]) || 0
        return acc + qty * b.value
      }, 0)
      setCajasData((prev) => {
        const existing = prev[selectedDate] || {}
        return {
          ...prev,
          [selectedDate]: {
            ...existing,
            desgloseBilletes: billetesTemp,
            recuentoManual: calcTotal
          }
        }
      })
    } else if (recuentoDirectoInput !== '') {
      setCajasData((prev) => {
        const existing = prev[selectedDate] || {}
        return {
          ...prev,
          [selectedDate]: {
            ...existing,
            desgloseBilletes: {},
            recuentoManual: Number(recuentoDirectoInput)
          }
        }
      })
    } else {
      setCajasData((prev) => {
        const existing = prev[selectedDate] || {}
        return {
          ...prev,
          [selectedDate]: {
            ...existing,
            desgloseBilletes: {},
            recuentoManual: null
          }
        }
      })
    }

    setIsArqueoModalOpen(false)
    showToast('Arqueo de caja actualizado.')
  }

  // Exportar a Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new()
    const wsData = []

    wsData.push(['', '', 'Planilla de caja Diaria Secretaría', '', '', '', '', '', '', '', '', '', '', ''])
    wsData.push([])
    wsData.push(['', '', 'SALDO INICIAL DE CAJA', '', '', totals.saldoInicialEf, '', '', '', '', '', '', '', ''])
    wsData.push([])
    wsData.push(['', '', '', '', '', '', '.', 'Fecha', selectedDate, '', '', '', '', ''])
    wsData.push([])
    wsData.push(['INGRESOS', '', 'EFECTIVO', '', 'TRANSF/CHEQUES', '', 'EGRESOS', '', '', 'EFECTIVO', '', 'TRANSF/CHEQUES', '', ''])

    const ordIngresos = (currentCaja.movimientos || []).filter((m) => m.tipo === 'ingreso' && m.subcategoria !== 'banco')
    const bancoIngresos = (currentCaja.movimientos || []).filter((m) => m.tipo === 'ingreso' && m.subcategoria === 'banco')
    const egresosList = (currentCaja.movimientos || []).filter((m) => m.tipo === 'egreso')

    const maxOrd = Math.max(ordIngresos.length, Math.floor(egresosList.length / 2), 5)
    for (let i = 0; i < maxOrd; i++) {
      const ing = ordIngresos[i]
      const egr = egresosList[i]
      wsData.push([
        ing ? ing.concepto : '',
        '',
        ing && ing.medioPago === 'efectivo' ? ing.monto : '',
        '',
        ing && (ing.medioPago === 'transferencia_cheque' || ing.medioPago === 'cheque') ? ing.monto : '',
        '',
        egr ? egr.concepto : '',
        '',
        '',
        egr && egr.medioPago === 'efectivo' ? egr.monto : '',
        '',
        egr && (egr.medioPago === 'transferencia_cheque' || egr.medioPago === 'cheque') ? egr.monto : '',
        '',
        ''
      ])
    }

    wsData.push([
      'OPERACIONES EN BANCO',
      '',
      '',
      '',
      '',
      '',
      egresosList[maxOrd] ? egresosList[maxOrd].concepto : '',
      '',
      '',
      egresosList[maxOrd] && egresosList[maxOrd].medioPago === 'efectivo' ? egresosList[maxOrd].monto : '',
      '',
      egresosList[maxOrd] && (egresosList[maxOrd].medioPago === 'transferencia_cheque' || egresosList[maxOrd].medioPago === 'cheque') ? egresosList[maxOrd].monto : '',
      '',
      ''
    ])

    const maxBanco = Math.max(bancoIngresos.length, egresosList.length - maxOrd - 1, 4)
    for (let i = 0; i < maxBanco; i++) {
      const bIng = bancoIngresos[i]
      const egrIndex = maxOrd + 1 + i
      const egr = egresosList[egrIndex]
      wsData.push([
        bIng ? (bIng.comprobante ? `${bIng.concepto} (${bIng.comprobante})` : bIng.concepto) : '',
        '',
        bIng && bIng.medioPago === 'efectivo' ? bIng.monto : '',
        '',
        bIng && (bIng.medioPago === 'transferencia_cheque' || bIng.medioPago === 'cheque') ? bIng.monto : '',
        '',
        egr ? egr.concepto : '',
        '',
        '',
        egr && egr.medioPago === 'efectivo' ? egr.monto : '',
        '',
        egr && (egr.medioPago === 'transferencia_cheque' || egr.medioPago === 'cheque') ? egr.monto : '',
        '',
        ''
      ])
    }

    wsData.push([])
    wsData.push(['', '', 'Total de Ingresos', '', '', totals.ingresosEfectivo, '', totals.ingresosBanco, '', totals.diferenciaCaja !== null ? totals.diferenciaCaja : 0, '', '', '', ''])
    wsData.push([])
    wsData.push(['', '', 'Total de Egresos', '', '', totals.egresosEfectivo, '', totals.egresosBanco, '', '', '', '', '', ''])
    wsData.push(['', '', '', '', '', '', '', '', '', 'Recuento', '', totals.recuentoFisico !== null ? totals.recuentoFisico : totals.saldoTeoricoEfectivo, '', ''])
    wsData.push(['', '', '', '', '', '', '', totals.saldoTeoricoEfectivo, '', '', '', '', '', ''])
    wsData.push([])
    wsData.push(['', '', '', '', '', '', '', `Firma del responsable de caja: ${currentCaja.responsable || 'Secretaría'}`])

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws['!cols'] = [
      { wch: 30 },
      { wch: 4 },
      { wch: 18 },
      { wch: 4 },
      { wch: 20 },
      { wch: 4 },
      { wch: 30 },
      { wch: 16 },
      { wch: 4 },
      { wch: 18 },
      { wch: 4 },
      { wch: 20 },
      { wch: 4 }
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Caja Diaria')
    XLSX.writeFile(wb, `Caja_Diaria_${selectedDate}.xlsx`)
    showToast('Planilla Excel descargada exitosamente.')
  }

  const ingresosOrdinarios = useMemo(() => {
    return (currentCaja.movimientos || []).filter((m) => m.tipo === 'ingreso' && m.subcategoria !== 'banco')
  }, [currentCaja.movimientos])

  const operacionesBanco = useMemo(() => {
    return (currentCaja.movimientos || []).filter((m) => m.tipo === 'ingreso' && m.subcategoria === 'banco')
  }, [currentCaja.movimientos])

  const egresosList = useMemo(() => {
    return (currentCaja.movimientos || []).filter((m) => m.tipo === 'egreso')
  }, [currentCaja.movimientos])

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-6 text-slate-100 bg-slate-950 print:p-0 print:bg-white print:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-bounce print:hidden">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER CONTROLS (Oculto en impresión) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl backdrop-blur-md print:hidden">
        {/* Título y Selector de Fecha */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              Planilla de Caja Diaria
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">
                Secretaría
              </span>
            </h1>
            <p className="text-xs text-slate-400">Control de ingresos, operaciones en banco, cheques, egresos y arqueo</p>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-800/90 rounded-xl p-1 border border-slate-700">
            <button
              onClick={() => changeDay(-1)}
              title="Día anterior"
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-xs sm:text-sm font-semibold text-white px-2.5 py-1 focus:outline-none cursor-pointer"
            />
            <button
              onClick={() => changeDay(1)}
              title="Día siguiente"
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={setToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 transition cursor-pointer"
          >
            Hoy
          </button>

          {/* Botón Depositar Cheque de Cartera */}
          <button
            onClick={() => openDepositarModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition cursor-pointer"
            title="Depositar cheques recibidos en cartera y bajarlos"
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span>Depositar Cheques ({chequesDisponibles.length})</span>
          </button>

          {/* Botones de acción */}
          <button
            onClick={handleImportarDelLibro}
            title="Sincronizar y traer movimientos cargados hoy en el Libro Diario"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Traer del Libro</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* CABECERA OFICIAL PARA IMPRESIÓN (Visible solo en Print) */}
      <div className="hidden print:block mb-4 border-b-2 border-black pb-3">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide">Planilla de Caja Diaria Secretaría</h1>
            <p className="text-xs text-gray-700">Gremio / Institución - Control de Arqueo y Movimientos</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">Fecha: {selectedDate}</p>
            <p className="text-xs text-gray-700">Responsable: {currentCaja.responsable || 'Secretaría'}</p>
          </div>
        </div>
        <div className="mt-2 text-sm">
          <span className="font-bold">SALDO INICIAL DE CAJA EFECTIVO: </span>
          <span>{fmtMoney(totals.saldoInicialEf)}</span>
        </div>
      </div>

      {/* KPI METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 print:hidden">
        {/* Saldo Inicial Efectivo */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Saldo Inicial Ef.</span>
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <input
              type="number"
              value={currentCaja.saldoInicial ?? ''}
              onChange={(e) => updateCurrentCaja('saldoInicial', e.target.value === '' ? 0 : Number(e.target.value))}
              placeholder="0.00"
              className="text-lg md:text-xl font-black text-white bg-slate-950/60 border border-slate-700/60 rounded-lg px-2 py-0.5 w-full focus:outline-none focus:border-amber-500 transition"
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Apertura en efectivo físico</p>
        </div>

        {/* Total Ingresos */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ingresos del Día</span>
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg md:text-xl font-black text-emerald-400 mt-2">{fmtMoney(totals.totalIngresos)}</p>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>Ef: {fmtMoney(totals.ingresosEfectivo)}</span>
            <span>Bco: {fmtMoney(totals.ingresosBanco)}</span>
          </div>
        </div>

        {/* OPERACIONES EN BANCO & CHEQUES (DESTACADO) */}
        <div className="bg-slate-900/90 border border-indigo-500/30 p-3.5 rounded-2xl relative overflow-hidden group hover:border-indigo-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">Operaciones Banco</span>
            <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Landmark className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg md:text-xl font-black text-indigo-300 mt-2">{fmtMoney(totals.operacionesEnBancoTotal)}</p>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>Transf & Valores</span>
            <button
              onClick={() => openDepositarModal()}
              className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
            >
              Depositar Chq
            </button>
          </div>
        </div>

        {/* Total Egresos */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Egresos del Día</span>
            <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg md:text-xl font-black text-rose-400 mt-2">{fmtMoney(totals.totalEgresos)}</p>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>Ef: {fmtMoney(totals.egresosEfectivo)}</span>
            <span>Bco: {fmtMoney(totals.egresosBanco)}</span>
          </div>
        </div>

        {/* Saldo Teórico en Efectivo */}
        <div className="bg-slate-900/90 border border-blue-500/30 p-3.5 rounded-2xl relative overflow-hidden shadow-lg shadow-blue-500/5 group hover:border-blue-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">Saldo Teórico Ef.</span>
            <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg md:text-xl font-black text-white mt-2">{fmtMoney(totals.saldoTeoricoEfectivo)}</p>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
            <span>Inicial + Ing.Ef - Egr.Ef</span>
            <button
              onClick={openArqueoModal}
              className="text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer"
            >
              Arqueo
            </button>
          </div>
        </div>
      </div>

      {/* PANEL DE ARQUEO Y CUADRE DE CAJA */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl print:border print:border-gray-300 print:bg-white print:p-3 print:mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 print:border-gray-300">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-amber-400 print:hidden" />
            <h2 className="text-sm md:text-base font-bold text-white print:text-black">
              Arqueo de Efectivo y Cierre de Caja
            </h2>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={openArqueoModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Desglose por Billetes</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-center">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 print:border-gray-200 print:bg-gray-50">
            <span className="text-xs text-slate-400 uppercase font-semibold print:text-gray-600">Saldo Teórico (Sistema)</span>
            <p className="text-lg md:text-xl font-bold text-white mt-1 print:text-black">
              {fmtMoney(totals.saldoTeoricoEfectivo)}
            </p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 print:border-gray-200 print:bg-gray-50">
            <span className="text-xs text-slate-400 uppercase font-semibold print:text-gray-600">Recuento Físico (Arqueo)</span>
            <p className="text-lg md:text-xl font-bold text-amber-400 mt-1 print:text-black">
              {totals.recuentoFisico !== null ? fmtMoney(totals.recuentoFisico) : 'Sin arqueo'}
            </p>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              totals.diferenciaCaja === null
                ? 'bg-slate-950/60 border-slate-800 text-slate-400 print:bg-gray-50 print:border-gray-200'
                : totals.diferenciaCaja === 0
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400 print:bg-emerald-50 print:border-emerald-300'
                : totals.diferenciaCaja > 0
                ? 'bg-blue-950/30 border-blue-500/40 text-blue-400 print:bg-blue-50 print:border-blue-300'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-400 print:bg-rose-50 print:border-rose-300'
            }`}
          >
            <span className="text-xs uppercase font-semibold">
              {totals.diferenciaCaja === null
                ? 'Diferencia de Caja'
                : totals.diferenciaCaja === 0
                ? 'Caja Cuadrada'
                : totals.diferenciaCaja > 0
                ? 'Sobrante en Caja'
                : 'Faltante en Caja'}
            </span>
            <p className="text-lg md:text-xl font-bold mt-1">
              {totals.diferenciaCaja !== null ? fmtMoney(totals.diferenciaCaja) : '$ 0,00'}
            </p>
          </div>
        </div>
      </div>

      {/* TABLAS BIMODALES: INGRESOS (+ OPERACIONES EN BANCO & CHEQUES) & EGRESOS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
        {/* ================= COLUMNA IZQUIERDA: INGRESOS & BANCO ================= */}
        <div className="space-y-6">
          {/* SECCIÓN 1: INGRESOS HABITUALES */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col print:border print:border-gray-400 print:bg-white">
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between print:bg-gray-100 print:border-gray-400 print:p-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h3 className="font-bold text-white text-sm md:text-base uppercase tracking-wider print:text-black">
                  INGRESOS DE CAJA
                </h3>
              </div>
              <button
                onClick={() => openNewModal('ingreso', 'ordinario')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition cursor-pointer print:hidden"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Nuevo Ingreso</span>
              </button>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800 print:bg-gray-200 print:text-black print:border-gray-400">
                  <tr>
                    <th className="py-2.5 px-3">Concepto / Detalle</th>
                    <th className="py-2.5 px-3 text-right">Efectivo</th>
                    <th className="py-2.5 px-3 text-right">Transf / Cheques</th>
                    <th className="py-2.5 px-2 text-center w-16 print:hidden">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-300">
                  {ingresosOrdinarios.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500 italic print:text-gray-500">
                        No se registraron ingresos de caja ordinarios.
                      </td>
                    </tr>
                  ) : (
                    ingresosOrdinarios.map((mov) => (
                      <tr key={mov.id} className="hover:bg-slate-800/40 transition print:hover:bg-transparent">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-200 print:text-black flex items-center gap-1.5">
                            {mov.chequeDetails && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                                CHEQUE
                              </span>
                            )}
                            {mov.concepto}
                          </div>
                          {(mov.comprobante || mov.observaciones) && (
                            <div className="text-[11px] text-slate-400 print:text-gray-600">
                              {[mov.comprobante, mov.observaciones].filter(Boolean).join(' • ')}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-emerald-400 print:text-black">
                          {mov.medioPago === 'efectivo' ? fmtMoney(mov.monto) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-blue-400 print:text-black">
                          {mov.medioPago === 'transferencia_cheque' || mov.medioPago === 'cheque'
                            ? fmtMoney(mov.monto)
                            : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-center print:hidden">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditModal(mov)}
                              title="Editar"
                              className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMovimiento(mov.id)}
                              title="Eliminar"
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECCIÓN 2: OPERACIONES EN BANCO & VALORES A DEPOSITAR (SEPARADA Y DESTACADA) */}
          <div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl overflow-hidden shadow-xl flex flex-col print:border print:border-gray-400 print:bg-white">
            <div className="p-4 bg-indigo-950/40 border-b border-indigo-500/30 flex items-center justify-between print:bg-gray-100 print:border-gray-400 print:p-2">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-indigo-200 text-sm md:text-base uppercase tracking-wider print:text-black">
                  OPERACIONES EN BANCO & VALORES A DEPOSITAR
                </h3>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={() => openDepositarModal()}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition cursor-pointer"
                  title="Depositar cheques recibidos y bajarlos de cartera"
                >
                  <ArrowDownCircle className="w-3.5 h-3.5" />
                  <span>Depositar Cheque ({chequesDisponibles.length})</span>
                </button>
                <button
                  onClick={() => openNewModal('ingreso', 'banco')}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Op. Banco</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800 print:bg-gray-200 print:text-black print:border-gray-400">
                  <tr>
                    <th className="py-2.5 px-3">Operación / Transferencia</th>
                    <th className="py-2.5 px-3 text-right">Efectivo / Cheque</th>
                    <th className="py-2.5 px-3 text-right">Transf. Bancaria</th>
                    <th className="py-2.5 px-2 text-center w-16 print:hidden">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-300">
                  {operacionesBanco.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500 italic print:text-gray-500">
                        No se registraron operaciones en banco ni valores a depositar hoy.
                      </td>
                    </tr>
                  ) : (
                    operacionesBanco.map((mov) => (
                      <tr key={mov.id} className="hover:bg-slate-800/40 transition print:hover:bg-transparent">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-200 print:text-black flex items-center gap-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                              BANCO
                            </span>
                            {mov.concepto}
                          </div>
                          {(mov.comprobante || mov.observaciones) && (
                            <div className="text-[11px] text-slate-400 print:text-gray-600">
                              {[mov.comprobante, mov.observaciones].filter(Boolean).join(' • ')}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-emerald-400 print:text-black">
                          {mov.medioPago === 'efectivo' ? fmtMoney(mov.monto) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-indigo-400 print:text-black">
                          {mov.medioPago === 'transferencia_cheque' || mov.medioPago === 'cheque'
                            ? fmtMoney(mov.monto)
                            : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-center print:hidden">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditModal(mov)}
                              title="Editar"
                              className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMovimiento(mov.id)}
                              title="Eliminar"
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-950 font-bold border-t-2 border-slate-800 print:bg-gray-200 print:border-gray-400">
                  <tr>
                    <td className="py-3 px-3 text-slate-300 print:text-black">TOTAL INGRESOS (+ BANCO)</td>
                    <td className="py-3 px-3 text-right text-emerald-400 print:text-black">
                      {fmtMoney(totals.ingresosEfectivo)}
                    </td>
                    <td className="py-3 px-3 text-right text-blue-400 print:text-black">
                      {fmtMoney(totals.ingresosBanco)}
                    </td>
                    <td className="print:hidden"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* ================= COLUMNA DERECHA: EGRESOS ================= */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col print:border print:border-gray-400 print:bg-white">
          <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between print:bg-gray-100 print:border-gray-400 print:p-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <h3 className="font-bold text-white text-sm md:text-base uppercase tracking-wider print:text-black">
                EGRESOS DEL DÍA
              </h3>
            </div>
            <button
              onClick={() => openNewModal('egreso', 'ordinario')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition cursor-pointer print:hidden"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nuevo Egreso</span>
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800 print:bg-gray-200 print:text-black print:border-gray-400">
                <tr>
                  <th className="py-2.5 px-3">Concepto / Detalle</th>
                  <th className="py-2.5 px-3 text-right">Efectivo</th>
                  <th className="py-2.5 px-3 text-right">Transf / Cheques</th>
                  <th className="py-2.5 px-2 text-center w-16 print:hidden">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-gray-300">
                {egresosList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 italic print:text-gray-500">
                      No se registraron egresos en esta fecha.
                    </td>
                  </tr>
                ) : (
                  egresosList.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-800/40 transition print:hover:bg-transparent">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-200 print:text-black">{mov.concepto}</div>
                        {(mov.comprobante || mov.observaciones) && (
                          <div className="text-[11px] text-slate-400 print:text-gray-600">
                            {[mov.comprobante, mov.observaciones].filter(Boolean).join(' • ')}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-rose-400 print:text-black">
                        {mov.medioPago === 'efectivo' ? fmtMoney(mov.monto) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-amber-400 print:text-black">
                        {mov.medioPago === 'transferencia_cheque' || mov.medioPago === 'cheque'
                          ? fmtMoney(mov.monto)
                          : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(mov)}
                            title="Editar"
                            className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMovimiento(mov.id)}
                            title="Eliminar"
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-950 font-bold border-t-2 border-slate-800 print:bg-gray-200 print:border-gray-400">
                <tr>
                  <td className="py-3 px-3 text-slate-300 print:text-black">TOTAL EGRESOS</td>
                  <td className="py-3 px-3 text-right text-rose-400 print:text-black">
                    {fmtMoney(totals.egresosEfectivo)}
                  </td>
                  <td className="py-3 px-3 text-right text-amber-400 print:text-black">
                    {fmtMoney(totals.egresosBanco)}
                  </td>
                  <td className="print:hidden"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* PIE DE PLANILLA: RESPONSABLE & FIRMA */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 print:border-none print:bg-transparent print:p-0 print:mt-12">
        <div className="w-full md:w-1/2 space-y-2 print:hidden">
          <label className="text-xs font-semibold text-slate-400">Responsable / Operador de Caja:</label>
          <input
            type="text"
            value={currentCaja.responsable || ''}
            onChange={(e) => updateCurrentCaja('responsable', e.target.value)}
            placeholder="Nombre y apellido del responsable"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="w-full md:w-1/2 text-center md:text-right border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 print:border-none print:w-full">
          <div className="inline-block text-center pt-8 border-t border-slate-600 print:border-black min-w-64">
            <p className="text-xs text-slate-400 print:text-black font-semibold">
              Firma del responsable de caja
            </p>
            <p className="text-[11px] text-slate-500 print:text-gray-700">
              {currentCaja.responsable || 'Secretaría General / Administración'}
            </p>
          </div>
        </div>
      </div>

      {/* ================= MODAL DE MOVIMIENTO (NUEVO / EDITAR CON SOPORTE DE CHEQUE) ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-850 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                {modalSubcategoria === 'banco' ? (
                  <Landmark className="w-5 h-5 text-indigo-400" />
                ) : modalTipo === 'ingreso' ? (
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-rose-400" />
                )}
                {editingMovId
                  ? 'Editar Movimiento'
                  : modalSubcategoria === 'banco'
                  ? 'Cargar Operación en Banco / Valores'
                  : `Nuevo ${modalTipo === 'ingreso' ? 'Ingreso' : 'Egreso'}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMovimiento} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Selector Categoría & Medio de Pago */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tipo</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setModalTipo('ingreso')
                        setModalSubcategoria('ordinario')
                      }}
                      className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        modalTipo === 'ingreso' && modalSubcategoria === 'ordinario'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Ingreso
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalTipo('egreso')
                        setModalSubcategoria('ordinario')
                        setIsChequeEntry(false)
                      }}
                      className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        modalTipo === 'egreso' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Egreso
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Medio de Pago</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setModalMedioPago('efectivo')
                        setIsChequeEntry(false)
                      }}
                      className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        modalMedioPago === 'efectivo' && !isChequeEntry
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Efectivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalMedioPago('transferencia_cheque')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        modalMedioPago === 'transferencia_cheque' || isChequeEntry
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Transf/Cheq
                    </button>
                  </div>
                </div>
              </div>

              {/* Selector de Concepto (Solo Lista Desplegable) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Concepto *</label>
                <select
                  required
                  value={modalConcepto}
                  onChange={(e) => {
                    const val = e.target.value
                    setModalConcepto(val)
                    if (val.toLowerCase().includes('valores a depositar') || val.toLowerCase().includes('cheque')) {
                      setIsChequeEntry(true)
                      setModalMedioPago('transferencia_cheque')
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                >
                  <option value="" disabled>-- Seleccionar Concepto --</option>
                  {(modalTipo === 'ingreso' ? allIngresosConceptos : allEgresosConceptos).map((c, i) => (
                    <option key={i} value={c} className="bg-slate-900 text-white py-1">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Monto ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={modalMonto}
                  onChange={(e) => setModalMonto(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Interruptor para chequear si es Cheque y registrar en Cartera */}
              {modalTipo === 'ingreso' && (
                <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5 cursor-pointer">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span>¿Se cobró con Cheque de Tercero?</span>
                    </label>
                    <input
                      type="checkbox"
                      checked={isChequeEntry}
                      onChange={(e) => {
                        setIsChequeEntry(e.target.checked)
                        if (e.target.checked) {
                          setModalMedioPago('transferencia_cheque')
                        }
                      }}
                      className="w-4 h-4 accent-amber-500 cursor-pointer rounded"
                    />
                  </div>

                  {isChequeEntry && (
                    <div className="space-y-3 pt-2 border-t border-amber-500/20 animate-in fade-in">
                      <p className="text-[11px] text-amber-200/80">
                        Al guardar, se registrará en la <strong>Caja Diaria</strong> y se añadirá automáticamente a la <strong>Cartera de Cheques</strong>.
                      </p>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">N° de Cheque *</label>
                          <input
                            type="text"
                            required={isChequeEntry}
                            value={chequeNumero}
                            onChange={(e) => setChequeNumero(e.target.value)}
                            placeholder="Ej: 65564801"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Formato</label>
                          <select
                            value={chequeFormato}
                            onChange={(e) => setChequeFormato(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="FISICO">Cheque Físico</option>
                            <option value="ECHEQ">E-Cheq (Electrónico)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Banco Emisor</label>
                          <input
                            type="text"
                            list="bancos-cheque-list"
                            value={chequeBanco}
                            onChange={(e) => setChequeBanco(e.target.value)}
                            placeholder="Ej: Banco Galicia"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                          <datalist id="bancos-cheque-list">
                            {(bancosList.length > 0 ? bancosList : ['Banco Galicia', 'Banco Nación', 'Banco Provincia', 'Banco Macro']).map(
                              (b, idx) => (
                                <option key={idx} value={b} />
                              )
                            )}
                          </datalist>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Fecha de Cobro / Vence</label>
                          <input
                            type="date"
                            value={chequeFechaCobro}
                            onChange={(e) => setChequeFechaCobro(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Librador / Titular</label>
                        <input
                          type="text"
                          value={chequeEmisor}
                          onChange={(e) => setChequeEmisor(e.target.value)}
                          placeholder="Nombre o Razón Social del emisor del cheque"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Comprobante / N° Operación */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Comprobante / N° Operación</label>
                <input
                  type="text"
                  value={modalComprobante}
                  onChange={(e) => setModalComprobante(e.target.value)}
                  placeholder="Ej: Op 005, Recibo 123, Factura..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Observaciones</label>
                <input
                  type="text"
                  value={modalObservaciones}
                  onChange={(e) => setModalObservaciones(e.target.value)}
                  placeholder="Ej: Salón, Sede Social, etc."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Botones de guardar */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white text-sm font-bold shadow-lg transition cursor-pointer ${
                    isChequeEntry
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                      : modalTipo === 'ingreso'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  }`}
                >
                  {isChequeEntry ? 'Guardar Cheque en Caja y Cartera' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DEPOSITAR CHEQUE DE CARTERA (BAJAR CHEQUE) ================= */}
      {isDepositarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-850 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5 text-amber-400" />
                Depositar Cheque de Cartera en Banco
              </h3>
              <button
                onClick={() => setIsDepositarModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto custom-scrollbar">
              <p className="text-xs text-slate-300">
                Selecciona el cheque en cartera que vas a depositar en el banco hoy ({selectedDate}). Al confirmar, se registrará en la <strong>Caja Diaria</strong> y se <strong>bajará de la Cartera de Cheques</strong> (marcado como Cobrado / Depositado).
              </p>

              {/* Selector de Cuenta Bancaria Destino */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Cuenta Bancaria Destino *</label>
                <select
                  value={depositoBancoDestino}
                  onChange={(e) => setDepositoBancoDestino(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
                >
                  <option value="Cta. Bco. 10551/45">Cta. Bco. 10551/45</option>
                  <option value="Cta. Bco. 10523/24">Cta. Bco. 10523/24</option>
                  <option value="Banco Nación (Cuenta Recaudadora)">Banco Nación (Cuenta Recaudadora)</option>
                  <option value="Banco Provincia (Cuenta Operativa)">Banco Provincia (Cuenta Operativa)</option>
                </select>
              </div>

              {/* Lista de Cheques Disponibles en Cartera */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400">
                  Seleccionar Cheque de la Cartera ({chequesDisponibles.length} disponibles):
                </label>

                {chequesDisponibles.length === 0 ? (
                  <div className="p-6 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-xs">
                    No hay cheques pendientes en cartera para depositar.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {chequesDisponibles.map((chq) => {
                      const isSelected = selectedChequeToDeposit && selectedChequeToDeposit.id === chq.id
                      return (
                        <div
                          key={chq.id}
                          onClick={() => setSelectedChequeToDeposit(chq)}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-500/10'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="radio"
                              name="selected_cheque"
                              checked={isSelected}
                              onChange={() => setSelectedChequeToDeposit(chq)}
                              className="accent-amber-500 cursor-pointer shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-xs sm:text-sm text-white truncate flex items-center gap-2">
                                <span>{chq.entidad}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                                  {chq.formato}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {chq.chequeRef} • Vence: {chq.fechaCobro ? formatDateDMY(chq.fechaCobro) : 'Al día'}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-bold text-sm text-amber-400 font-mono">
                              {fmtMoney(chq.importe)}
                            </span>
                            <p className="text-[10px] text-emerald-400 font-semibold">Listo p/ depositar</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Resumen del Depósito */}
              {selectedChequeToDeposit && (
                <div className="bg-amber-950/20 border border-amber-500/30 p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-300">Importe a Depositar:</span>
                    <p className="text-[11px] text-slate-400">{selectedChequeToDeposit.entidad}</p>
                  </div>
                  <span className="text-lg font-black text-amber-400 font-mono">
                    {fmtMoney(selectedChequeToDeposit.importe)}
                  </span>
                </div>
              )}

              {/* Botones */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDepositarModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!selectedChequeToDeposit}
                  onClick={handleConfirmarDepositoCheque}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-amber-600/30 transition cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  <span>Confirmar Depósito & Bajar de Cartera</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL CALCULADORA DE ARQUEO ================= */}
      {isArqueoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-850 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-400" />
                Arqueo Físico de Billetes
              </h3>
              <button
                onClick={() => setIsArqueoModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <p className="text-xs text-slate-400">
                Ingresa la cantidad de billetes por denominación para calcular automáticamente el recuento físico de caja.
              </p>

              <div className="space-y-2.5">
                {DENOMINACIONES_BILLETES.map((b) => {
                  const qty = Number(billetesTemp[b.value]) || ''
                  const subtotal = (Number(qty) || 0) * b.value
                  return (
                    <div
                      key={b.value}
                      className="flex items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800"
                    >
                      <span className="text-sm font-bold text-slate-300 w-28">{b.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Cant:</span>
                        <input
                          type="number"
                          min="0"
                          value={qty}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10))
                            setBilletesTemp((prev) => ({
                              ...prev,
                              [b.value]: val
                            }))
                          }}
                          placeholder="0"
                          className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-center text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <span className="text-xs font-semibold text-amber-400 w-28 text-right">
                        {fmtMoney(subtotal)}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Total Arqueo Calculado */}
              <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase">Total Recuento:</span>
                <span className="text-lg font-black text-amber-400">
                  {fmtMoney(
                    DENOMINACIONES_BILLETES.reduce((acc, b) => {
                      const qty = Number(billetesTemp[b.value]) || 0
                      return acc + qty * b.value
                    }, 0)
                  )}
                </span>
              </div>

              {/* O ingreso directo */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-400 mb-1">O ingresar Total Manual Directo ($):</label>
                <input
                  type="number"
                  step="0.01"
                  value={recuentoDirectoInput}
                  onChange={(e) => setRecuentoDirectoInput(e.target.value)}
                  placeholder="Ej: 1507920"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsArqueoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveArqueo}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold shadow-lg shadow-amber-600/30 transition cursor-pointer"
                >
                  Aplicar Arqueo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
