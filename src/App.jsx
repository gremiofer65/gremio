import React, { useState, useMemo, useEffect, useCallback } from 'react'
import initialData from './initialData.json'
import { supabase } from './lib/supabaseClient'
import {
  LayoutDashboard,
  BookOpen,
  UserCheck,
  Building2,
  Calendar,
  Search,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CheckCircle2,
  X,
  CreditCard,
  Users,
  Briefcase,
  Percent,
  Download,
  AlertCircle,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
  Wallet,
  Receipt,
  Scale,
  ArrowRightLeft,
  Printer,
  ChevronRight,
  ChevronDown,
  History,
  Edit2,
  Trash2,
  Check,
  FolderPlus,
  Lock,
  LogIn,
  LogOut,
  ShieldCheck,
  User,
  KeyRound,
  Menu,
  ArrowLeft,
  MoreVertical
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

export default function App() {
  // Authentication State (Local session, ready to plug into Supabase auth)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('esports_auth_session') === 'true'
  })
  const [authEmail, setAuthEmail] = useState('admin@sistema.com')
  const [authPassword, setAuthPassword] = useState('admin123')
  const [authError, setAuthError] = useState('')
  const [currentUser, setCurrentUser] = useState(() => {
    return JSON.parse(localStorage.getItem('esports_user_data') || '{"nombre": "Administrador", "email": "admin@sistema.com", "rol": "Superadmin"}')
  })

  const handleLogin = (e) => {
    e.preventDefault()
    setAuthError('')

    // Acceso fácil / validación local inicial (después reemplazable con supabase.auth.signInWithPassword)
    if (authEmail.trim() && authPassword.trim()) {
      setIsAuthenticated(true)
      localStorage.setItem('esports_auth_session', 'true')
      localStorage.setItem(
        'esports_user_data',
        JSON.stringify({
          nombre: authEmail.split('@')[0].toUpperCase(),
          email: authEmail,
          rol: 'Administrador Principal'
        })
      )
      setCurrentUser({
        nombre: authEmail.split('@')[0].toUpperCase(),
        email: authEmail,
        rol: 'Administrador Principal'
      })
    } else {
      setAuthError('Por favor ingresa un email y contraseña válidos.')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('esports_auth_session')
  }

  // Navigation
  const [activeTab, setActiveTab] = useState('cuentacorriente') // 'dashboard' | 'libro' | 'cuentacorriente' | 'medicos' | 'maestros'
  const [selectedMes, setSelectedMes] = useState('ENERO 26')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isMobileCCDetailOpen, setIsMobileCCDetailOpen] = useState(false)

  // Data state
  const [movimientos, setMovimientos] = useState(initialData.movimientos || initialData.movimientosEnero || [])
  const [maestros, setMaestros] = useState(initialData.maestros || {})
  const [meses, setMeses] = useState(() => {
    return (
      (initialData.meses || []).map((m) => m.trim()) || [
        'ENERO 26',
        'FEBRERO 26',
        'MARZO 26',
        'ABRIL 26',
        'MAYO 26',
        'JUNIO 26',
        'JULIO 26',
        'AGOSTO 26',
        'SETIEMBRE 26',
        'OCTUBRE 26'
      ]
    )
  })
  const [isLoadingDB, setIsLoadingDB] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  // Carga inicial y sincronización desde Supabase
  const loadDataFromSupabase = useCallback(async () => {
    try {
      setIsSyncing(true)
      // 1. Cargar Períodos
      const { data: dbPeriodos } = await supabase
        .from('periodos')
        .select('*')
        .order('nombre', { ascending: true })

      if (dbPeriodos && dbPeriodos.length > 0) {
        setMeses(dbPeriodos.map((p) => p.nombre.trim()))
      }

      // 2. Cargar Tablas Maestras
      const { data: dbMaestros } = await supabase.from('maestros').select('*')
      if (dbMaestros && dbMaestros.length > 0) {
        const grouped = {}
        dbMaestros.forEach((item) => {
          if (!grouped[item.categoria]) grouped[item.categoria] = []
          grouped[item.categoria].push(item.nombre)
        })
        setMaestros((prev) => ({ ...prev, ...grouped }))
      }

      // 3. Cargar Movimientos
      const { data: dbMovimientos } = await supabase
        .from('movimientos')
        .select('*')
        .order('fecha', { ascending: false })

      if (dbMovimientos && dbMovimientos.length > 0) {
        const mapped = dbMovimientos.map((m) => ({
          id: m.id,
          fecha: m.fecha,
          facturaNro: m.factura_nro || '',
          rubro: m.rubro,
          empresaConcepto: m.empresa_concepto,
          detalle: m.detalle || '',
          detalleExtenso: m.detalle_extenso || '',
          realizadoEn: m.realizado_en || '',
          fechaPago: m.fecha_pago || '',
          chequeOperacion: m.cheque_operacion || '',
          mesPeriodo: m.mes_periodo || '',
          pagosS: Number(m.pagos_s || 0),
          ingresosS: Number(m.ingresos_s || 0),
          pagosMed: Number(m.pagos_med || 0),
          retencionesMed: Number(m.retenciones_med || 0),
          netoPagadoMed: Number(m.neto_pagado_med || 0),
          alquilerCpoSalon: Number(m.alquiler_cpo_salon || 0),
          ventaCantina: Number(m.venta_cantina || 0),
          usoNatatorio: Number(m.uso_natatorio || 0),
          alquiConsultorios: Number(m.alqui_consultorios || 0),
          practicas: Number(m.practicas || 0),
          consultas: Number(m.consultas || 0),
          enfermeria: Number(m.enfermeria || 0),
          odontologia: Number(m.odontologia || 0),
          otIngresos: Number(m.ot_ingresos || 0),
          compensaciones: Number(m.compensaciones || 0),
          total: Number(m.total || 0),
          observaciones: m.observaciones || ''
        }))
        setMovimientos(mapped)
      }
    } catch (err) {
      console.error('Error cargando de Supabase:', err)
    } finally {
      setIsLoadingDB(false)
      setIsSyncing(false)
    }
  }, [])

  useEffect(() => {
    loadDataFromSupabase()
  }, [loadDataFromSupabase])

  // Period / Year Filter State & Modal
  const [selectedYear, setSelectedYear] = useState('2026') // 'TODOS' | '2025' | '2026' | '2027'...
  const [isNewPeriodModalOpen, setIsNewPeriodModalOpen] = useState(false)
  const [newPeriodMonth, setNewPeriodMonth] = useState('ENERO')
  const [newPeriodYear, setNewPeriodYear] = useState('2026')

  // Extract unique years from existing period strings
  const availableYears = useMemo(() => {
    const yearsSet = new Set(['2025', '2026', '2027'])
    meses.forEach((m) => {
      const parts = m.trim().split(' ')
      const yearPart = parts[parts.length - 1]
      if (yearPart) {
        const fullYear = yearPart.length === 2 ? `20${yearPart}` : yearPart
        yearsSet.add(fullYear)
      }
    })
    return Array.from(yearsSet).sort()
  }, [meses])

  // Filtered periods list based on selected year
  const filteredPeriods = useMemo(() => {
    if (selectedYear === 'TODOS') return meses
    const shortYear = selectedYear.slice(-2) // e.g. '26' from '2026'
    return meses.filter((m) => {
      const parts = m.trim().split(' ')
      const y = parts[parts.length - 1]
      return y === shortYear || y === selectedYear
    })
  }, [meses, selectedYear])

  // Handler to create new active period
  const handleCreatePeriod = async (e) => {
    e.preventDefault()
    const shortYear = newPeriodYear.slice(-2)
    const formattedPeriod = `${newPeriodMonth.toUpperCase()} ${shortYear}`

    if (meses.includes(formattedPeriod)) {
      alert(`El período "${formattedPeriod}" ya existe en el sistema.`)
      setSelectedMes(formattedPeriod)
      setIsNewPeriodModalOpen(false)
      return
    }

    const updated = [...meses, formattedPeriod]
    setMeses(updated)
    setSelectedMes(formattedPeriod)
    setSelectedYear(newPeriodYear)
    setIsNewPeriodModalOpen(false)

    // Persistir en Supabase
    try {
      await supabase.from('periodos').upsert([
        {
          nombre: formattedPeriod,
          anio: newPeriodYear,
          mes: newPeriodMonth.toUpperCase(),
          activo: true
        }
      ], { onConflict: 'nombre' })
    } catch (err) {
      console.error('Error guardando período en Supabase:', err)
    }
  }

  // Cuenta Corriente specific state
  const [selectedEntity, setSelectedEntity] = useState('')
  const [ccFilterType, setCcFilterType] = useState('TODOS') // 'TODOS' | 'PROVEEDORES' | 'MEDICOS' | 'EMPLEADOS'
  const [ccSearchTerm, setCcSearchTerm] = useState('')
  const [ccPeriodFilter, setCcPeriodFilter] = useState('TODOS') // 'TODOS' | 'ENERO 26' | 'FEBRERO 26'...
  const [ccYearFilter, setCcYearFilter] = useState('TODOS') // 'TODOS' | '2025' | '2026' | '2027'...
  const [ccStartDate, setCcStartDate] = useState('')
  const [ccEndDate, setCcEndDate] = useState('')

  // Tablas Maestras CRUD state
  const [activeCatalogTab, setActiveCatalogTab] = useState('proveedores') // 'proveedores' | 'medicos' | 'empleados' | 'sedes' | 'impuestos'
  const [newItemName, setNewItemName] = useState('')
  const [editingItem, setEditingItem] = useState(null) // { catalogKey, oldVal, newVal }
  const [catalogSearch, setCatalogSearch] = useState('')

  // Handlers for Tablas Maestras con Supabase
  const handleAddItem = async (catalogKey) => {
    const trimmed = newItemName.trim()
    if (!trimmed) return

    setMaestros((prev) => {
      const list = prev[catalogKey] || []
      if (list.includes(trimmed)) {
        alert('Este registro ya existe en el catálogo.')
        return prev
      }
      return {
        ...prev,
        [catalogKey]: [trimmed, ...list]
      }
    })
    setNewItemName('')

    // Persistir en Supabase
    try {
      await supabase.from('maestros').upsert([
        { categoria: catalogKey, nombre: trimmed, activo: true }
      ], { onConflict: 'categoria,nombre' })
    } catch (err) {
      console.error('Error guardando en maestros en Supabase:', err)
    }
  }

  const handleStartEdit = (catalogKey, item) => {
    setEditingItem({ catalogKey, oldVal: item, newVal: item })
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return
    const { catalogKey, oldVal, newVal } = editingItem
    const trimmed = newVal.trim()
    if (!trimmed) return

    setMaestros((prev) => {
      const list = prev[catalogKey] || []
      return {
        ...prev,
        [catalogKey]: list.map((x) => (x === oldVal ? trimmed : x))
      }
    })

    // Propagate name change to active movimientos
    setMovimientos((prev) =>
      prev.map((m) => {
        if (m.empresaConcepto === oldVal) {
          return { ...m, empresaConcepto: trimmed }
        }
        if (m.realizadoEn === oldVal) {
          return { ...m, realizadoEn: trimmed }
        }
        return m
      })
    )

    if (selectedEntity === oldVal) {
      setSelectedEntity(trimmed)
    }

    setEditingItem(null)

    // Persistir en Supabase
    try {
      await supabase.from('maestros').delete().match({ categoria: catalogKey, nombre: oldVal })
      await supabase.from('maestros').insert({ categoria: catalogKey, nombre: trimmed, activo: true })
      await supabase.from('movimientos').update({ empresa_concepto: trimmed }).match({ empresa_concepto: oldVal })
    } catch (err) {
      console.error('Error actualizando maestro en Supabase:', err)
    }
  }

  const handleDeleteItem = async (catalogKey, itemToDelete) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${itemToDelete}" del catálogo?`)) return

    setMaestros((prev) => {
      const list = prev[catalogKey] || []
      return {
        ...prev,
        [catalogKey]: list.filter((x) => x !== itemToDelete)
      }
    })

    // Persistir eliminación en Supabase
    try {
      await supabase.from('maestros').delete().match({ categoria: catalogKey, nombre: itemToDelete })
    } catch (err) {
      console.error('Error eliminando maestro de Supabase:', err)
    }
  }

  // Search & Filter for Libro Diario
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRubro, setSelectedRubro] = useState('TODOS')
  const [selectedSede, setSelectedSede] = useState('TODAS')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState('EGRESO') // 'EGRESO' | 'MEDICO' | 'INGRESO' | 'ASIENTO_CC'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [entitySearchFilter, setEntitySearchFilter] = useState('')
  
  // Form State
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    facturaNro: '',
    rubro: 'PROVEEDOR',
    empresaConcepto: '',
    detalle: 'Gastos Generales',
    detalleExtenso: '',
    realizadoEn: 'Policlinica AMOS',
    fechaPago: '',
    chequeOperacion: '',
    // Egresos
    pagosS: '',
    // Medicos
    pagosMed: '',
    aplicarRetencion: true,
    porcentajeRetencion: 5,
    retencionesMed: '',
    netoPagadoMed: '',
    // Cuenta Corriente Direct Entry
    tipoMovimientoCC: 'DEBITO', // DEBITO (Factura/Deuda) o CREDITO (Pago/Cobro)
    montoCC: '',
    // Ingresos
    alquilerCpoSalon: 0,
    ventaCantina: 0,
    usoNatatorio: 0,
    alquiConsultorios: 0,
    practicas: 0,
    consultas: 0,
    enfermeria: 0,
    odontologia: 0,
    otIngresos: 0,
    compensaciones: 0,
    observaciones: ''
  })

  // Format money helper
  const fmtMoney = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '$ 0,00'
    const isNeg = val < 0
    const formatted = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(Math.abs(val))
    return isNeg ? `- ${formatted}` : formatted
  }

  // Totals calculations
  const stats = useMemo(() => {
    let totalIngresos = 0
    let totalEgresosS = 0
    let totalPagosMed = 0
    let totalRetencionesMed = 0
    let totalNetoMed = 0

    // Filter movements by active selectedMes for Libro Diario / Dashboard
    const periodMovs = selectedMes
      ? movimientos.filter((m) => (m.mesPeriodo ? m.mesPeriodo.trim() === selectedMes.trim() : true))
      : movimientos

    periodMovs.forEach((m) => {
      if (m.rubro === 'PROVEEDOR' || m.rubro === 'EMPLEADOS' || m.rubro === 'IMPUESTO' || m.rubro === 'SEGUROS') {
        totalEgresosS += Number(m.pagosS || 0)
      } else if (m.rubro === 'MÉDICO') {
        totalPagosMed += Number(m.pagosMed || 0)
        totalRetencionesMed += Number(m.retencionesMed || 0)
        totalNetoMed += Number(m.netoPagadoMed || 0)
      } else if (m.rubro === 'INGRESOS') {
        const rowIngreso = Number(
          m.total || (
          Number(m.alquilerCpoSalon || 0) +
          Number(m.ventaCantina || 0) +
          Number(m.usoNatatorio || 0) +
          Number(m.alquiConsultorios || 0) +
          Number(m.practicas || 0) +
          Number(m.consultas || 0) +
          Number(m.enfermeria || 0) +
          Number(m.odontologia || 0) +
          Number(m.otIngresos || 0) +
          Number(m.compensaciones || 0)
        ))
        totalIngresos += rowIngreso
      }
    })

    const totalEgresosTotal = totalEgresosS + totalNetoMed
    const saldoNeto = totalIngresos - totalEgresosTotal

    return {
      totalIngresos,
      totalEgresosS,
      totalPagosMed,
      totalRetencionesMed,
      totalNetoMed,
      totalEgresosTotal,
      saldoNeto,
      totalRegistros: periodMovs.length
    }
  }, [movimientos, selectedMes])

  // Filtered movements for Libro Diario
  const filteredMovimientos = useMemo(() => {
    return movimientos.filter((m) => {
      // Period filter
      if (selectedMes && m.mesPeriodo && m.mesPeriodo.trim() !== selectedMes.trim()) {
        return false
      }

      const matchSearch =
        searchTerm === '' ||
        (m.empresaConcepto && m.empresaConcepto.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.facturaNro && m.facturaNro.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.detalle && m.detalle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.detalleExtenso && m.detalleExtenso.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.chequeOperacion && m.chequeOperacion.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchRubro = selectedRubro === 'TODOS' || m.rubro === selectedRubro
      const matchSede = selectedSede === 'TODAS' || m.realizadoEn === selectedSede

      return matchSearch && matchRubro && matchSede
    })
  }, [movimientos, selectedMes, searchTerm, selectedRubro, selectedSede])

  // ================= CUENTA CORRIENTE ENGINE =================
  // Extract all distinct entities with their type and current balance
  const entidadesCC = useMemo(() => {
    const map = {}

    // Init from maestros
    maestros.proveedores?.forEach((p) => {
      map[p] = { nombre: p, tipo: 'PROVEEDOR', totalDebito: 0, totalCredito: 0, movimientosCount: 0 }
    })
    maestros.medicos?.forEach((m) => {
      map[m] = { nombre: m, tipo: 'MÉDICO', totalDebito: 0, totalCredito: 0, movimientosCount: 0 }
    })
    maestros.empleados?.forEach((e) => {
      map[e] = { nombre: e, tipo: 'EMPLEADOS', totalDebito: 0, totalCredito: 0, movimientosCount: 0 }
    })

    // Process all movements to build balances
    // En cuenta de Proveedores/Médicos:
    // DÉBITO = Factura devengada / Honorario generado (Lo que se le debe / pasivo)
    // CRÉDITO = Pago realizado / Transferencia / Cheque (Cancelación de deuda)
    // SALDO = Débito - Crédito (Saldo > 0 significa deuda pendiente; Saldo = 0 cancelado)
    movimientos.forEach((m) => {
      const entName = m.empresaConcepto
      if (!entName) return

      if (!map[entName]) {
        map[entName] = {
          nombre: entName,
          tipo: m.rubro || 'PROVEEDOR',
          totalDebito: 0,
          totalCredito: 0,
          movimientosCount: 0
        }
      }

      map[entName].movimientosCount += 1

      if (m.rubro === 'MÉDICO') {
        // Débito = Honorario Neto devengado
        const debito = Number(m.netoPagadoMed || m.pagosMed || 0)
        // Crédito = Pago emitido (si tiene fecha de pago se considera cancelado)
        const credito = m.fechaPago ? debito : 0
        map[entName].totalDebito += debito
        map[entName].totalCredito += credito
      } else if (m.rubro === 'INGRESOS') {
        // En cuenta de Ingresos/Clientes: Débito = Importe Facturado/Cobrado
        const monto = Number(m.total || 0)
        map[entName].totalDebito += monto
        map[entName].totalCredito += m.fechaPago ? monto : 0
      } else {
        // Proveedor / Empleado / Impuesto
        const monto = Number(m.pagosS || 0)
        const debito = monto
        const credito = m.fechaPago ? monto : 0
        map[entName].totalDebito += debito
        map[entName].totalCredito += credito
      }
    })

    return Object.values(map).map((ent) => ({
      ...ent,
      saldo: ent.totalDebito - ent.totalCredito
    }))
  }, [movimientos, maestros])

  // Filtered entities list
  const filteredEntidades = useMemo(() => {
    return entidadesCC.filter((e) => {
      const matchType =
        ccFilterType === 'TODOS' ||
        (ccFilterType === 'PROVEEDORES' && e.tipo === 'PROVEEDOR') ||
        (ccFilterType === 'MEDICOS' && e.tipo === 'MÉDICO') ||
        (ccFilterType === 'EMPLEADOS' && e.tipo === 'EMPLEADOS')

      const matchSearch =
        ccSearchTerm === '' || e.nombre.toLowerCase().includes(ccSearchTerm.toLowerCase())

      return matchType && matchSearch
    })
  }, [entidadesCC, ccFilterType, ccSearchTerm])

  // Set default selected entity if empty
  React.useEffect(() => {
    if (!selectedEntity && filteredEntidades.length > 0) {
      // Pick first active entity with movements
      const withMovs = filteredEntidades.find((e) => e.movimientosCount > 0) || filteredEntidades[0]
      setSelectedEntity(withMovs.nombre)
    }
  }, [filteredEntidades, selectedEntity])

  // Extract ledger movements with running balance for the selected entity with Period and Year filter
  const extractoCuenta = useMemo(() => {
    if (!selectedEntity) return { movimientos: [], totalDebito: 0, totalCredito: 0, saldoFinal: 0 }

    const entMovs = movimientos
      .filter((m) => {
        if (m.empresaConcepto !== selectedEntity) return false

        // Period filter check (e.g. 'ENERO 26' matches m.mesPeriodo)
        if (ccPeriodFilter !== 'TODOS') {
          if (m.mesPeriodo && m.mesPeriodo.trim() !== ccPeriodFilter.trim()) {
            return false
          }
        }

        // Year filter check (if period is TODOS, can filter by year)
        if (ccYearFilter !== 'TODOS') {
          // Check if mesPeriodo ends with year suffix or fecha year matches
          const yearSuffix = ccYearFilter.slice(-2) // '26'
          const matchesPeriodYear = m.mesPeriodo && m.mesPeriodo.includes(yearSuffix)
          const matchesDateYear = m.fecha && m.fecha.startsWith(ccYearFilter)
          if (!matchesPeriodYear && !matchesDateYear) return false
        }

        // Date range filter check (Desde / Hasta)
        if (ccStartDate && m.fecha && m.fecha < ccStartDate) return false
        if (ccEndDate && m.fecha && m.fecha > ccEndDate) return false

        return true
      })
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

    let runningBalance = 0
    let sumDebito = 0
    let sumCredito = 0

    const rows = []

    entMovs.forEach((m) => {
      let debito = 0
      let credito = 0
      let descripcion = m.detalle || 'Comprobante comercial'
      let comprobante = m.facturaNro || '-'

      if (m.rubro === 'MÉDICO') {
        debito = Number(m.netoPagadoMed || m.pagosMed || 0)
        // 1. Asiento de devengamiento (Débito)
        runningBalance += debito
        sumDebito += debito
        rows.push({
          id: `${m.id}-dev`,
          fecha: m.fecha,
          comprobante,
          tipoComprobante: 'Factura / Liquidación Honorario',
          detalle: `${descripcion} (Bruto: ${fmtMoney(m.pagosMed)} - Ret: ${fmtMoney(m.retencionesMed)})`,
          referencia: m.realizadoEn || 'Sede',
          debito,
          credito: 0,
          saldo: runningBalance
        })

        // 2. Asiento de Pago (Crédito) si fue pagado
        if (m.fechaPago) {
          credito = debito
          runningBalance -= credito
          sumCredito += credito
          rows.push({
            id: `${m.id}-pago`,
            fecha: m.fechaPago,
            comprobante: m.chequeOperacion || 'OP-TRANSF',
            tipoComprobante: 'Orden de Pago / Cheque',
            detalle: `Cancelación Honorario ${m.detalle || ''} - Ref: ${m.chequeOperacion || 'Efectivo/Banco'}`,
            referencia: m.realizadoEn || 'Sede',
            debito: 0,
            credito,
            saldo: runningBalance
          })
        }
      } else if (m.rubro === 'INGRESOS') {
        const monto = Number(m.total || 0)
        debito = monto
        runningBalance += debito
        sumDebito += debito
        rows.push({
          id: `${m.id}-ing`,
          fecha: m.fecha,
          comprobante,
          tipoComprobante: 'Recibo de Ingreso',
          detalle: descripcion,
          referencia: m.realizadoEn,
          debito,
          credito: 0,
          saldo: runningBalance
        })
      } else {
        // Proveedor / Empleado / Impuesto
        const monto = Number(m.pagosS || 0)
        debito = monto
        runningBalance += debito
        sumDebito += debito
        rows.push({
          id: `${m.id}-fac`,
          fecha: m.fecha,
          comprobante,
          tipoComprobante: 'Factura / Comprobante de Compra',
          detalle: `${descripcion} ${m.realizadoEn ? `[${m.realizadoEn}]` : ''}`,
          referencia: m.chequeOperacion || '',
          debito,
          credito: 0,
          saldo: runningBalance
        })

        if (m.fechaPago) {
          credito = monto
          runningBalance -= credito
          sumCredito += credito
          rows.push({
            id: `${m.id}-pago`,
            fecha: m.fechaPago,
            comprobante: m.chequeOperacion || 'OP-PAGO',
            tipoComprobante: 'Orden de Pago / Comprobante de Cancelación',
            detalle: `Pago Fac. ${comprobante} - Medio: ${m.chequeOperacion || 'Transferencia Bancaria'}`,
            referencia: m.realizadoEn || '',
            debito: 0,
            credito,
            saldo: runningBalance
          })
        }
      }
    })

    return {
      movimientos: rows,
      totalDebito: sumDebito,
      totalCredito: sumCredito,
      saldoFinal: runningBalance
    }
  }, [selectedEntity, movimientos, ccPeriodFilter, ccYearFilter, ccStartDate, ccEndDate])

  // Helper to export Cuenta Corriente Ledger to Excel (CSV format formatted for Excel)
  const handleExportCCExcel = () => {
    if (!selectedEntity || extractoCuenta.movimientos.length === 0) {
      alert('No hay movimientos para exportar en este período o rango seleccionado.')
      return
    }

    const headers = ['Fecha', 'Comprobante', 'Tipo de Asiento', 'Detalle / Concepto', 'Referencia', 'Debito (+)', 'Credito (-)', 'Saldo Acumulado']
    const rows = extractoCuenta.movimientos.map((r) => [
      `"${r.fecha}"`,
      `"${r.comprobante}"`,
      `"${r.tipoComprobante}"`,
      `"${(r.detalle || '').replace(/"/g, '""')}"`,
      `"${r.referencia || ''}"`,
      r.debito ? r.debito.toFixed(2) : '0.00',
      r.credito ? r.credito.toFixed(2) : '0.00',
      r.saldo ? r.saldo.toFixed(2) : '0.00'
    ])

    // Summary line
    rows.push([])
    rows.push(['"TOTALES"', '""', '""', '""', '""', extractoCuenta.totalDebito.toFixed(2), extractoCuenta.totalCredito.toFixed(2), extractoCuenta.saldoFinal.toFixed(2)])

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    const sanitizedName = selectedEntity.replace(/[^a-zA-Z0-9_-]/g, '_')
    const rangeTag = ccStartDate || ccEndDate ? `${ccStartDate || 'Inicio'}_a_${ccEndDate || 'Fin'}` : ccYearFilter !== 'TODOS' ? ccYearFilter : 'Historico'
    link.setAttribute('download', `Extracto_CC_${sanitizedName}_${rangeTag}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Medical Liquidation Summary (Filtered by active selectedMes)
  const medicosData = useMemo(() => {
    return movimientos.filter((m) => {
      if (m.rubro !== 'MÉDICO') return false
      if (selectedMes && m.mesPeriodo && m.mesPeriodo.trim() !== selectedMes.trim()) return false
      return true
    })
  }, [movimientos, selectedMes])

  // Chart Data: Egresos by Rubro (Filtered by active selectedMes)
  const egresosPorRubroData = useMemo(() => {
    const rubrosMap = {}
    const periodMovs = selectedMes
      ? movimientos.filter((m) => (m.mesPeriodo ? m.mesPeriodo.trim() === selectedMes.trim() : true))
      : movimientos

    periodMovs.forEach((m) => {
      if (m.rubro === 'INGRESOS') return
      const r = m.rubro || 'OTROS'
      const amount = Number(m.pagosS || 0) + Number(m.netoPagadoMed || 0)
      rubrosMap[r] = (rubrosMap[r] || 0) + amount
    })
    return Object.keys(rubrosMap).map((k) => ({
      name: k,
      valor: rubrosMap[k]
    }))
  }, [movimientos, selectedMes])

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  // Handle Form Change with Auto Calculations
  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }

      if (field === 'pagosMed' || field === 'aplicarRetencion' || field === 'porcentajeRetencion') {
        const bruto = parseFloat(field === 'pagosMed' ? value : prev.pagosMed) || 0
        const isAplicar = field === 'aplicarRetencion' ? value : prev.aplicarRetencion
        const pct = parseFloat(field === 'porcentajeRetencion' ? value : prev.porcentajeRetencion) || 0

        if (!isAplicar || bruto === 0) {
          updated.retencionesMed = '0.00'
          updated.netoPagadoMed = bruto.toFixed(2)
        } else {
          const ret = bruto * (pct / 100)
          updated.retencionesMed = ret.toFixed(2)
          updated.netoPagadoMed = (bruto - ret).toFixed(2)
        }
      } else if (field === 'retencionesMed') {
        const bruto = parseFloat(prev.pagosMed) || 0
        const ret = parseFloat(value) || 0
        updated.netoPagadoMed = (bruto - ret).toFixed(2)
      }

      return updated
    })
  }

  // Handle Create Movement
  const handleSaveMovement = (e) => {
    e.preventDefault()

    const targetEmpresa = formData.empresaConcepto ? formData.empresaConcepto.trim().toLowerCase() : ''
    const targetFactura = formData.facturaNro ? formData.facturaNro.trim().toLowerCase() : ''

    // Validar duplicados si se ingresó número de factura
    if (targetFactura && targetFactura !== '-' && targetFactura !== '') {
      const duplicate = movimientos.find((m) => {
        const mFactura = m.facturaNro ? String(m.facturaNro).trim().toLowerCase() : ''
        const mEmpresa = m.empresaConcepto ? String(m.empresaConcepto).trim().toLowerCase() : ''
        return mFactura === targetFactura && mEmpresa === targetEmpresa
      })

      if (duplicate) {
        alert(
          `⚠️ FACTURA DUPLICADA:\n\nYa existe un comprobante con el Nº "${formData.facturaNro}" para "${formData.empresaConcepto}".\n\nFecha registrada: ${duplicate.fecha}\nDetalle: ${duplicate.detalle || '-'}\nImporte: ${fmtMoney(duplicate.pagosS || duplicate.netoPagadoMed || duplicate.total)}\n\nPor favor verifica el número o proveedor antes de continuar.`
        )
        return
      }
    }

    let totalIngresosCalculado = 0
    if (modalType === 'INGRESO') {
      totalIngresosCalculado =
        Number(formData.alquilerCpoSalon || 0) +
        Number(formData.ventaCantina || 0) +
        Number(formData.usoNatatorio || 0) +
        Number(formData.alquiConsultorios || 0) +
        Number(formData.practicas || 0) +
        Number(formData.consultas || 0) +
        Number(formData.enfermeria || 0) +
        Number(formData.odontologia || 0) +
        Number(formData.otIngresos || 0) +
        Number(formData.compensaciones || 0)
    }

    const newMov = {
      id: 'mov-' + (movimientos.length + 1),
      fecha: formData.fecha,
      facturaNro: formData.facturaNro,
      rubro: modalType === 'MEDICO' ? 'MÉDICO' : modalType === 'INGRESO' ? 'INGRESOS' : formData.rubro,
      empresaConcepto: formData.empresaConcepto,
      detalle: formData.detalle,
      detalleExtenso: formData.detalleExtenso,
      realizadoEn: formData.realizadoEn,
      fechaPago: formData.fechaPago,
      chequeOperacion: formData.chequeOperacion,
      mesPeriodo: selectedMes,
      pagosS: modalType === 'EGRESO' ? Number(formData.pagosS || 0) : 0,
      pagosMed: modalType === 'MEDICO' ? Number(formData.pagosMed || 0) : 0,
      retencionesMed: modalType === 'MEDICO' ? Number(formData.retencionesMed || 0) : 0,
      netoPagadoMed: modalType === 'MEDICO' ? Number(formData.netoPagadoMed || 0) : 0,
      alquilerCpoSalon: Number(formData.alquilerCpoSalon || 0),
      ventaCantina: Number(formData.ventaCantina || 0),
      usoNatatorio: Number(formData.usoNatatorio || 0),
      alquiConsultorios: Number(formData.alquiConsultorios || 0),
      practicas: Number(formData.practicas || 0),
      consultas: Number(formData.consultas || 0),
      enfermeria: Number(formData.enfermeria || 0),
      odontologia: Number(formData.odontologia || 0),
      otIngresos: Number(formData.otIngresos || 0),
      compensaciones: Number(formData.compensaciones || 0),
      total: totalIngresosCalculado,
      observaciones: formData.observaciones
    }

    setMovimientos([newMov, ...movimientos])
    setIsModalOpen(false)

    // Persistir en Supabase
    try {
      supabase.from('movimientos').insert([
        {
          fecha: newMov.fecha,
          factura_nro: newMov.facturaNro || null,
          rubro: newMov.rubro,
          empresa_concepto: newMov.empresaConcepto,
          detalle: newMov.detalle || null,
          detalle_extenso: newMov.detalleExtenso || null,
          realizado_en: newMov.realizadoEn || null,
          fecha_pago: newMov.fechaPago || null,
          cheque_operacion: newMov.chequeOperacion || null,
          mes_periodo: newMov.mesPeriodo || null,
          pagos_s: newMov.pagosS,
          ingresos_s: newMov.ingresosS || 0,
          pagos_med: newMov.pagosMed,
          retenciones_med: newMov.retencionesMed,
          neto_pagado_med: newMov.netoPagadoMed,
          alquiler_cpo_salon: newMov.alquilerCpoSalon,
          venta_cantina: newMov.ventaCantina,
          uso_natatorio: newMov.usoNatatorio,
          alqui_consultorios: newMov.alquiConsultorios,
          practicas: newMov.practicas,
          consultas: newMov.consultas,
          enfermeria: newMov.enfermeria,
          odontologia: newMov.odontologia,
          ot_ingresos: newMov.otIngresos,
          compensaciones: newMov.compensaciones,
          total: newMov.total,
          observaciones: newMov.observaciones || null
        }
      ]).then(({ data, error }) => {
        if (error) console.error('Error insertando movimiento en Supabase:', error.message)
      })
    } catch (err) {
      console.error('Error enviando movimiento a Supabase:', err)
    }
  }

  const selectedEntityObj = entidadesCC.find((e) => e.nombre === selectedEntity)

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
        {/* Decorative background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 mx-auto flex items-center justify-center shadow-xl shadow-blue-600/30 mb-4 border border-blue-400/30">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Sistema de Gestión</h1>
            <p className="text-sm text-slate-400 mt-1">Acceso Administrativo y Contabilidad</p>
          </div>

          {/* Login Card */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Iniciar Sesión</h2>
                <p className="text-xs text-slate-400">Ingresa tus credenciales de acceso</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Supabase Auth Ready
              </span>
            </div>

            {authError && (
              <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="admin@sistema.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Contraseña
                  </label>
                  <span className="text-[11px] text-blue-400 font-medium cursor-pointer hover:underline">
                    Clave protegida
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-medium"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Ingresar al Sistema</span>
                </button>
              </div>
            </form>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Acceso Rápido Habilitado
              </span>
              <span className="text-slate-500">Versión 1.0</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans relative">
      {/* MOBILE OVERLAY */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo / Header */}
          <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight text-white">Sistema Gestión</h1>
                <p className="text-xs text-slate-400">Contabilidad & Finanzas</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Period & Year Selector */}
          <div className="p-4 space-y-2.5 border-b border-slate-800/80 bg-slate-950/40">
            {/* Year Filter + New Period Button */}
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Año / Ejercicio
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsNewPeriodModalOpen(true)
                  setIsMobileSidebarOpen(false)
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition cursor-pointer"
                title="Crear un nuevo período"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Nuevo</span>
              </button>
            </div>

            {/* Year Filter Select */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-bold cursor-pointer"
                >
                  <option value="TODOS">Todos</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      Año {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month / Period Select */}
              <div>
                <select
                  value={selectedMes}
                  onChange={(e) => setSelectedMes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                >
                  {filteredPeriods.length === 0 ? (
                    <option value="">Sin períodos</option>
                  ) : (
                    filteredPeriods.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 mt-2">
            <button
              onClick={() => {
                setActiveTab('cuentacorriente')
                setIsMobileSidebarOpen(false)
                setIsMobileCCDetailOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'cuentacorriente'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Cuenta Corriente</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono">
                PRO
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('libro')
                setIsMobileSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'libro'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Libro Diario / Caja
            </button>

            <button
              onClick={() => {
                setActiveTab('dashboard')
                setIsMobileSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard & Balances
            </button>

            <button
              onClick={() => {
                setActiveTab('medicos')
                setIsMobileSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'medicos'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Honorarios Médicos
            </button>

            <button
              onClick={() => {
                setActiveTab('maestros')
                setIsMobileSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'maestros'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              Tablas Maestras
            </button>
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
                {currentUser.nombre ? currentUser.nombre.charAt(0) : 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{currentUser.nombre}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{entidadesCC.length} Cuentas activas</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950">
        {/* TOP NAVBAR */}
        <header className="min-h-16 py-2.5 md:py-0 border-b border-slate-800 px-3 md:px-6 flex flex-wrap items-center justify-between gap-2.5 bg-slate-900/80 backdrop-blur-md shrink-0 z-30">
          <div className="flex items-center gap-2.5 md:gap-4 min-w-0">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 focus:outline-none"
              title="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h2 className="text-sm md:text-base lg:text-lg font-semibold text-white truncate">
                {activeTab === 'cuentacorriente' && 'Cuentas Corrientes'}
                {activeTab === 'libro' && 'Libro Diario / Caja'}
                {activeTab === 'dashboard' && 'Dashboard y Balances'}
                {activeTab === 'medicos' && 'Honorarios Médicos'}
                {activeTab === 'maestros' && 'Tablas Maestras'}
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap shrink-0">
              {selectedMes}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            <button
              onClick={() => {
                setModalType('EGRESO')
                setIsModalOpen(true)
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Cargar Gasto / Pago"
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Cargar</span> Gasto
            </button>

            <button
              onClick={() => {
                setModalType('MEDICO')
                setIsModalOpen(true)
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Cargar Honorario Médico"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Honorario</span> Médico
            </button>

            <button
              onClick={() => {
                setModalType('INGRESO')
                setIsModalOpen(true)
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition"
              title="Nuevo Ingreso"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nuevo</span> Ingreso
            </button>
          </div>
        </header>

        {/* VIEW CONTAINER */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-4 md:space-y-6">
          {/* TAB: CUENTA CORRIENTE PROFESIONAL */}
          {activeTab === 'cuentacorriente' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 min-h-[calc(100vh-140px)]">
              {/* LEFT COLUMN: ENTITIES SELECTOR */}
              <div
                className={`lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl ${
                  isMobileCCDetailOpen ? 'hidden lg:flex' : 'flex'
                }`}
              >
                {/* Entity Search & Type Filter */}
                <div className="p-3.5 sm:p-4 border-b border-slate-800 space-y-3 bg-slate-950/40">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      Cuentas Corrientes
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {filteredEntidades.length} cuentas
                    </span>
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre..."
                      value={ccSearchTerm}
                      onChange={(e) => setCcSearchTerm(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Tabs Filter */}
                  <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-lg text-[11px] font-semibold text-slate-400">
                    <button
                      onClick={() => setCcFilterType('TODOS')}
                      className={`py-1 rounded ${
                        ccFilterType === 'TODOS' ? 'bg-blue-600 text-white' : 'hover:text-white'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setCcFilterType('MEDICOS')}
                      className={`py-1 rounded ${
                        ccFilterType === 'MEDICOS' ? 'bg-blue-600 text-white' : 'hover:text-white'
                      }`}
                    >
                      Médicos
                    </button>
                    <button
                      onClick={() => setCcFilterType('PROVEEDORES')}
                      className={`py-1 rounded ${
                        ccFilterType === 'PROVEEDORES' ? 'bg-blue-600 text-white' : 'hover:text-white'
                      }`}
                    >
                      Proveed.
                    </button>
                    <button
                      onClick={() => setCcFilterType('EMPLEADOS')}
                      className={`py-1 rounded ${
                        ccFilterType === 'EMPLEADOS' ? 'bg-blue-600 text-white' : 'hover:text-white'
                      }`}
                    >
                      Personal
                    </button>
                  </div>
                </div>

                {/* Entity List */}
                <div className="flex-1 max-h-[60vh] lg:max-h-none overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
                  {filteredEntidades.map((ent) => {
                    const isSelected = selectedEntity === ent.nombre

                    return (
                      <div
                        key={ent.nombre}
                        onClick={() => {
                          setSelectedEntity(ent.nombre)
                          setIsMobileCCDetailOpen(true)
                        }}
                        className={`p-3 rounded-xl cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600/15 border border-blue-500/40 text-white'
                            : 'hover:bg-slate-800/50 text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                                ent.tipo === 'MÉDICO'
                                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                  : ent.tipo === 'EMPLEADOS'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {ent.tipo}
                            </span>
                            <span className="font-semibold text-xs text-white truncate block">
                              {ent.nombre}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 flex gap-3">
                            <span>{ent.movimientosCount} movimientos</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-bold text-slate-200">
                            {fmtMoney(ent.totalDebito)}
                          </div>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold inline-block mt-0.5 ${
                              ent.saldo === 0
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : 'text-amber-400 bg-amber-500/10'
                            }`}
                          >
                            {ent.saldo === 0 ? 'Al día ($0)' : `Saldo: ${fmtMoney(ent.saldo)}`}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* RIGHT COLUMN: EXTRACTO BANCARIO / LIBRO MAYOR (DEBITO, CREDITO, SALDO) */}
              <div
                className={`lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl ${
                  !isMobileCCDetailOpen ? 'hidden lg:flex' : 'flex'
                }`}
              >
                {/* Header Summary for Selected Entity */}
                {selectedEntityObj ? (
                  <>
                    <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {/* Mobile Back Button */}
                        <button
                          type="button"
                          onClick={() => setIsMobileCCDetailOpen(false)}
                          className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                          title="Volver a la lista"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>

                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-base sm:text-lg shrink-0">
                          {selectedEntityObj.nombre.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-white truncate">{selectedEntityObj.nombre}</h3>
                            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium shrink-0">
                              {selectedEntityObj.tipo}
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                            Extracto cronológico de cuenta corriente y comprobantes
                          </p>
                        </div>
                      </div>

                      {/* Resumen Cards (Débito, Crédito, Saldo) */}
                      <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-3 font-mono">
                        {/* Total Débito */}
                        <div className="bg-slate-900 border border-slate-800 p-2 sm:px-3 sm:py-2 rounded-xl text-center sm:text-right">
                          <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-sans font-bold block truncate">
                            Débito
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-rose-400">
                            {fmtMoney(extractoCuenta.totalDebito)}
                          </span>
                        </div>

                        {/* Total Crédito */}
                        <div className="bg-slate-900 border border-slate-800 p-2 sm:px-3 sm:py-2 rounded-xl text-center sm:text-right">
                          <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-sans font-bold block truncate">
                            Crédito
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-emerald-400">
                            {fmtMoney(extractoCuenta.totalCredito)}
                          </span>
                        </div>

                        {/* Saldo Actual */}
                        <div className="bg-slate-900 border border-slate-800 p-2 sm:px-4 sm:py-2 rounded-xl text-center sm:text-right ring-1 ring-blue-500/30">
                          <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-sans font-bold block truncate">
                            Saldo
                          </span>
                          <span
                            className={`text-xs sm:text-base font-extrabold ${
                              extractoCuenta.saldoFinal === 0
                                ? 'text-emerald-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {fmtMoney(extractoCuenta.saldoFinal)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Filter Toolbar specifically for the Ledger: Filter by Year, Month and Quick Excel Export */}
                    <div className="px-3.5 sm:px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="font-semibold text-slate-400 flex items-center gap-1.5 text-xs">
                          <Filter className="w-3.5 h-3.5 text-blue-400" />
                          Filtros:
                        </span>

                        {/* Year Filter */}
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 text-[11px]">Año:</span>
                          <select
                            value={ccYearFilter}
                            onChange={(e) => setCcYearFilter(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                          >
                            <option value="TODOS">Todos</option>
                            {availableYears.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Month / Period Filter */}
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 text-[11px]">Período:</span>
                          <select
                            value={ccPeriodFilter}
                            onChange={(e) => {
                              setCcPeriodFilter(e.target.value)
                              setCcStartDate('')
                              setCcEndDate('')
                            }}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                          >
                            <option value="TODOS">Histórico</option>
                            {meses.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Rango de Fechas Exacto (Desde / Hasta) */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-slate-500 text-[11px]">Desde:</span>
                          <input
                            type="date"
                            value={ccStartDate}
                            onChange={(e) => {
                              setCcStartDate(e.target.value)
                              setCcPeriodFilter('TODOS')
                            }}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
                          />
                          <span className="text-slate-500 text-[11px]">Hasta:</span>
                          <input
                            type="date"
                            value={ccEndDate}
                            onChange={(e) => {
                              setCcEndDate(e.target.value)
                              setCcPeriodFilter('TODOS')
                            }}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>

                        {(ccYearFilter !== 'TODOS' || ccPeriodFilter !== 'TODOS' || ccStartDate || ccEndDate) && (
                          <button
                            onClick={() => {
                              setCcYearFilter('TODOS')
                              setCcPeriodFilter('TODOS')
                              setCcStartDate('')
                              setCcEndDate('')
                            }}
                            className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold underline cursor-pointer"
                          >
                            ✕ Limpiar
                          </button>
                        )}
                      </div>

                      {/* Export Buttons */}
                      <div className="flex items-center gap-2 ml-auto sm:ml-0">
                        <button
                          type="button"
                          onClick={handleExportCCExcel}
                          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs transition cursor-pointer active:scale-95 shadow-sm"
                          title="Descargar extracto detallado en Excel / CSV"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Excel</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-xs transition cursor-pointer"
                          title="Imprimir o guardar como PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimir</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center text-slate-400">Seleccione una entidad</div>
                )}

                {/* Table of Ledger Entries */}
                <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[65vh] lg:max-h-none">
                  <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                    <thead className="bg-slate-950/80 sticky top-0 z-10 backdrop-blur border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-3">Comprobante</th>
                        <th className="py-3 px-3">Tipo / Concepto</th>
                        <th className="py-3 px-4">Detalle / Referencia</th>
                        <th className="py-3 px-3 text-right text-rose-400 font-bold">DÉBITO (+)</th>
                        <th className="py-3 px-3 text-right text-emerald-400 font-bold">CRÉDITO (-)</th>
                        <th className="py-3 px-4 text-right text-blue-400 font-extrabold">SALDO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {extractoCuenta.movimientos.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-16 text-center text-slate-500">
                            <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            No hay movimientos registrados para esta cuenta en el período activo.
                          </td>
                        </tr>
                      ) : (
                        extractoCuenta.movimientos.map((row) => {
                          const isDebito = row.debito > 0
                          const isCredito = row.credito > 0

                          return (
                            <tr key={row.id} className="hover:bg-slate-800/40 transition">
                              {/* Fecha */}
                              <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{row.fecha}</td>

                              {/* Comprobante */}
                              <td className="py-3 px-3 font-mono text-slate-300 font-semibold whitespace-nowrap">
                                {row.comprobante}
                              </td>

                              {/* Tipo */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                    isDebito
                                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  }`}
                                >
                                  {row.tipoComprobante}
                                </span>
                              </td>

                              {/* Detalle */}
                              <td className="py-3 px-4 text-slate-300 max-w-[240px] truncate">
                                <div>{row.detalle}</div>
                                {row.referencia && (
                                  <span className="text-[10px] text-slate-500">{row.referencia}</span>
                                )}
                              </td>

                              {/* Débito */}
                              <td className="py-3 px-3 text-right font-mono font-semibold text-rose-400 whitespace-nowrap">
                                {isDebito ? fmtMoney(row.debito) : '-'}
                              </td>

                              {/* Crédito */}
                              <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400 whitespace-nowrap">
                                {isCredito ? fmtMoney(row.credito) : '-'}
                              </td>

                              {/* Saldo Acumulado */}
                              <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap bg-slate-950/30">
                                {fmtMoney(row.saldo)}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Actions */}
                <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap justify-between items-center gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] sm:text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Partida doble contable aplicada</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-400" />
                      Imprimir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIBRO DIARIO / CAJA */}
          {activeTab === 'libro' && (
            <div className="space-y-4">
              {/* STATS STRIP */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {/* Total Ingresos */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 sm:p-4 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider truncate">Ingresos</p>
                      <h3 className="text-base sm:text-xl font-bold text-emerald-400 mt-0.5 sm:mt-1 truncate">{fmtMoney(stats.totalIngresos)}</h3>
                    </div>
                    <div className="p-1.5 sm:p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20 shrink-0">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5 sm:mt-2 truncate">Policlínica y Otros</p>
                </div>

                {/* Total Egresos */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 sm:p-4 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider truncate">Egresos</p>
                      <h3 className="text-base sm:text-xl font-bold text-rose-400 mt-0.5 sm:mt-1 truncate">{fmtMoney(stats.totalEgresosTotal)}</h3>
                    </div>
                    <div className="p-1.5 sm:p-2 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20 shrink-0">
                      <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5 sm:mt-2 truncate">Proveed. y Sueldos</p>
                </div>

                {/* Total Honorarios Médicos */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 sm:p-4 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider truncate">Honorarios</p>
                      <h3 className="text-base sm:text-xl font-bold text-indigo-400 mt-0.5 sm:mt-1 truncate">{fmtMoney(stats.totalNetoMed)}</h3>
                    </div>
                    <div className="p-1.5 sm:p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20 shrink-0">
                      <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5 sm:mt-2 truncate">Ret: {fmtMoney(stats.totalRetencionesMed)}</p>
                </div>

                {/* Saldo Neto */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 sm:p-4 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider truncate">Saldo Mes</p>
                      <h3
                        className={`text-base sm:text-xl font-bold mt-0.5 sm:mt-1 truncate ${
                          stats.saldoNeto >= 0 ? 'text-blue-400' : 'text-amber-400'
                        }`}
                      >
                        {fmtMoney(stats.saldoNeto)}
                      </h3>
                    </div>
                    <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20 shrink-0">
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5 sm:mt-2 truncate">{stats.totalRegistros} registros</p>
                </div>
              </div>

              {/* FILTROS & BÚSQUEDA */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 sm:top-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar por médico, proveedor, factura o cheque..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {/* Filtro Rubro */}
                  <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                    <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <select
                      value={selectedRubro}
                      onChange={(e) => setSelectedRubro(e.target.value)}
                      className="w-full sm:w-auto bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 sm:py-2 focus:outline-none focus:border-blue-500 font-medium"
                    >
                      <option value="TODOS">Rubros</option>
                      {maestros.rubros?.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro Sede */}
                  <div className="flex-1 sm:flex-initial">
                    <select
                      value={selectedSede}
                      onChange={(e) => setSelectedSede(e.target.value)}
                      className="w-full sm:w-auto bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 sm:py-2 focus:outline-none focus:border-blue-500 font-medium"
                    >
                      <option value="TODAS">Sedes</option>
                      {maestros.sedes?.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* TABLA PRINCIPAL DE MOVIMIENTOS */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto max-h-[580px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950/80 sticky top-0 z-10 backdrop-blur border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-3">Fecha</th>
                        <th className="py-3 px-3">Comprobante</th>
                        <th className="py-3 px-3">Rubro</th>
                        <th className="py-3 px-3">Empresa / Médico / Beneficiario</th>
                        <th className="py-3 px-3">Detalle / Sede</th>
                        <th className="py-3 px-3">Fecha Pago / Referencia</th>
                        <th className="py-3 px-3 text-right">Egresos Grales</th>
                        <th className="py-3 px-3 text-right">Honorario Bruto</th>
                        <th className="py-3 px-3 text-right">Retenciones</th>
                        <th className="py-3 px-3 text-right">Neto Médico</th>
                        <th className="py-3 px-3 text-right">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {filteredMovimientos.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-12 text-center text-slate-500">
                            No se encontraron movimientos para los filtros seleccionados.
                          </td>
                        </tr>
                      ) : (
                        filteredMovimientos.map((m, idx) => {
                          const isIngreso = m.rubro === 'INGRESOS'
                          const isMedico = m.rubro === 'MÉDICO'

                          return (
                            <tr
                              key={m.id || idx}
                              className="hover:bg-slate-800/40 transition group"
                            >
                              {/* Fecha */}
                              <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">{m.fecha}</td>

                              {/* Factura */}
                              <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                                {m.facturaNro || '-'}
                              </td>

                              {/* Rubro Tag */}
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                    isIngreso
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : isMedico
                                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                      : m.rubro === 'EMPLEADOS'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                      : m.rubro === 'IMPUESTO'
                                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                      : 'bg-slate-800 text-slate-300 border-slate-700'
                                  }`}
                                >
                                  {m.rubro}
                                </span>
                              </td>

                              {/* Empresa / Concepto */}
                              <td className="py-2.5 px-3 text-slate-200 font-semibold max-w-[220px] truncate">
                                {m.empresaConcepto}
                              </td>

                              {/* Detalle & Sede */}
                              <td className="py-2.5 px-3 text-slate-400 max-w-[200px]">
                                <div className="font-medium text-slate-300 truncate">{m.detalle || '-'}</div>
                                {m.detalleExtenso && (
                                  <div className="text-[11px] text-slate-400/90 italic truncate" title={m.detalleExtenso}>
                                    📝 {m.detalleExtenso}
                                  </div>
                                )}
                                {m.realizadoEn && (
                                  <span className="text-[10px] text-slate-500 block">{m.realizadoEn}</span>
                                )}
                              </td>

                              {/* Pago / Cheque */}
                              <td className="py-2.5 px-3 text-slate-400 max-w-[160px] truncate">
                                {m.fechaPago ? (
                                  <div>
                                    <div className="text-slate-300">{m.fechaPago}</div>
                                    <span className="text-[10px] text-slate-500 block">{m.chequeOperacion || ''}</span>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                    <AlertCircle className="w-3 h-3 text-amber-400" />
                                    PENDIENTE
                                  </span>
                                )}
                              </td>

                              {/* Pagos S (Egresos) */}
                              <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                                {m.pagosS > 0 ? fmtMoney(m.pagosS) : '-'}
                              </td>

                              {/* Pagos Med (Bruto) */}
                              <td className="py-2.5 px-3 text-right font-mono text-indigo-300">
                                {m.pagosMed > 0 ? fmtMoney(m.pagosMed) : '-'}
                              </td>

                              {/* Retenciones */}
                              <td className="py-2.5 px-3 text-right font-mono text-amber-400/90">
                                {m.retencionesMed > 0 ? fmtMoney(m.retencionesMed) : '-'}
                              </td>

                              {/* Neto Medico */}
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-400">
                                {m.netoPagadoMed > 0 ? fmtMoney(m.netoPagadoMed) : '-'}
                              </td>

                              {/* Ingresos Total */}
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                                {isIngreso ? fmtMoney(m.total || m.alquiConsultorios || 0) : '-'}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Tabla Footer Totales */}
                <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400">
                    Mostrando <strong>{filteredMovimientos.length}</strong> de {movimientos.length} registros
                  </span>
                  <div className="flex gap-6 font-mono">
                    <span className="text-slate-300">
                      Total Egresos: <strong className="text-rose-400">{fmtMoney(stats.totalEgresosTotal)}</strong>
                    </span>
                    <span className="text-slate-300">
                      Total Ingresos: <strong className="text-emerald-400">{fmtMoney(stats.totalIngresos)}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DASHBOARD & BALANCES */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gráfico 1: Egresos por Rubro */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <h4 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-blue-400" />
                  Distribución de Egresos por Rubro
                </h4>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={egresosPorRubroData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="valor"
                      >
                        {egresosPorRubroData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => fmtMoney(val)}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico 2: Desglose Honorarios vs Retenciones */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <h4 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Comparativa Honorarios Médicos
                </h4>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Bruto Facturado', valor: stats.totalPagosMed },
                        { name: 'Retenciones Impositivas', valor: stats.totalRetencionesMed },
                        { name: 'Neto Pagado', valor: stats.totalNetoMed }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        formatter={(val) => fmtMoney(val)}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                      />
                      <Bar dataKey="valor" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIQUIDACIONES MÉDICAS */}
          {activeTab === 'medicos' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Liquidación de Honorarios Médicos</h3>
                  <p className="text-xs text-slate-400">
                    Detalle de profesionales, comprobantes, retenciones aplicadas y neto a liquidar.
                  </p>
                </div>
                <div className="grid grid-cols-3 sm:flex gap-2 sm:gap-4 font-mono text-[11px] sm:text-xs">
                  <div className="bg-slate-950 p-2 sm:px-3 sm:py-1.5 rounded-lg border border-slate-800 text-center sm:text-left">
                    <span className="text-[9px] text-slate-400 block sm:inline sm:mr-1">Bruto:</span>
                    <strong className="text-indigo-400">{fmtMoney(stats.totalPagosMed)}</strong>
                  </div>
                  <div className="bg-slate-950 p-2 sm:px-3 sm:py-1.5 rounded-lg border border-slate-800 text-center sm:text-left">
                    <span className="text-[9px] text-slate-400 block sm:inline sm:mr-1">Retenciones:</span>
                    <strong className="text-amber-400">{fmtMoney(stats.totalRetencionesMed)}</strong>
                  </div>
                  <div className="bg-slate-950 p-2 sm:px-3 sm:py-1.5 rounded-lg border border-slate-800 text-center sm:text-left">
                    <span className="text-[9px] text-slate-400 block sm:inline sm:mr-1">Neto:</span>
                    <strong className="text-emerald-400">{fmtMoney(stats.totalNetoMed)}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto max-h-[580px]">
                  <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                    <thead className="bg-slate-950/80 sticky top-0 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4">Factura Nº</th>
                        <th className="py-3 px-4">Médico / Profesional</th>
                        <th className="py-3 px-4">Período / Detalle</th>
                        <th className="py-3 px-4">Fecha Pago / Referencia</th>
                        <th className="py-3 px-4 text-right">Bruto</th>
                        <th className="py-3 px-4 text-right">Retención</th>
                        <th className="py-3 px-4 text-right">Neto Liquidado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {medicosData.map((m, i) => (
                        <tr key={m.id || i} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{m.fecha}</td>
                          <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">{m.facturaNro}</td>
                          <td className="py-3 px-4 text-white font-bold whitespace-nowrap">{m.empresaConcepto}</td>
                          <td className="py-3 px-4 text-slate-400 max-w-[200px] truncate">{m.detalle}</td>
                          <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                            {m.fechaPago ? (
                              <span>{m.fechaPago} ({m.chequeOperacion || 'OP-TRANSF'})</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                <AlertCircle className="w-3 h-3 text-amber-400" />
                                PENDIENTE
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-indigo-300 font-semibold whitespace-nowrap">
                            {fmtMoney(m.pagosMed)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-amber-400 whitespace-nowrap">
                            {fmtMoney(m.retencionesMed)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold text-sm whitespace-nowrap">
                            {fmtMoney(m.netoPagadoMed)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TABLAS MAESTRAS (CRUD COMPLETO) */}
          {activeTab === 'maestros' && (
            <div className="space-y-4 md:space-y-6">
              {/* Catalogs Header and Tabs */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-400 shrink-0" />
                      Gestión de Tablas Maestras y Catálogos
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Agrega, modifica o elimina proveedores, profesionales médicos, empleados y sedes del sistema.
                    </p>
                  </div>

                  {/* Catalog Category Selector Tabs */}
                  <div className="flex flex-wrap gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold overflow-x-auto">
                    <button
                      onClick={() => {
                        setActiveCatalogTab('proveedores')
                        setEditingItem(null)
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                        activeCatalogTab === 'proveedores'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      Proveedores ({maestros.proveedores?.length || 0})
                    </button>

                    <button
                      onClick={() => {
                        setActiveCatalogTab('medicos')
                        setEditingItem(null)
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                        activeCatalogTab === 'medicos'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Médicos ({maestros.medicos?.length || 0})
                    </button>

                    <button
                      onClick={() => {
                        setActiveCatalogTab('empleados')
                        setEditingItem(null)
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                        activeCatalogTab === 'empleados'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Personal ({maestros.empleados?.length || 0})
                    </button>

                    <button
                      onClick={() => {
                        setActiveCatalogTab('sedes')
                        setEditingItem(null)
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                        activeCatalogTab === 'sedes'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      Sedes ({maestros.sedes?.length || 0})
                    </button>

                    <button
                      onClick={() => {
                        setActiveCatalogTab('impuestos')
                        setEditingItem(null)
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                        activeCatalogTab === 'impuestos'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5" />
                      Impuestos ({maestros.impuestos?.length || 0})
                    </button>
                  </div>
                </div>

                {/* Form to Add New Item + Search Filter */}
                <div className="pt-4 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
                  {/* Add Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleAddItem(activeCatalogTab)
                    }}
                    className="md:col-span-7 flex gap-2"
                  >
                    <input
                      type="text"
                      required
                      placeholder={`Nuevo nombre de ${
                        activeCatalogTab === 'proveedores'
                          ? 'proveedor o empresa...'
                          : activeCatalogTab === 'medicos'
                          ? 'médico o profesional...'
                          : activeCatalogTab === 'empleados'
                          ? 'empleado...'
                          : activeCatalogTab === 'sedes'
                          ? 'sede o ubicación...'
                          : 'impuesto u organismo...'
                      }`}
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
                    />
                    <button
                      type="submit"
                      className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition cursor-pointer shrink-0"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Agregar</span>
                    </button>
                  </form>

                  {/* Search filter within catalog */}
                  <div className="md:col-span-5 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 sm:top-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={`Filtrar en ${activeCatalogTab}...`}
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 sm:py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Items List Table / Cards with Edit and Delete */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-3.5 sm:p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider">
                    Listado de {activeCatalogTab}
                  </span>
                  <span className="text-slate-400 font-mono">
                    Total: {maestros[activeCatalogTab]?.length || 0} registros
                  </span>
                </div>

                <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
                  {(maestros[activeCatalogTab] || [])
                    .filter(
                      (item) =>
                        catalogSearch === '' || item.toLowerCase().includes(catalogSearch.toLowerCase())
                    )
                    .map((item, index) => {
                      const isEditing =
                        editingItem &&
                        editingItem.catalogKey === activeCatalogTab &&
                        editingItem.oldVal === item

                      return (
                        <div
                          key={index}
                          className="px-3.5 sm:px-5 py-3 flex items-center justify-between hover:bg-slate-800/40 transition group"
                        >
                          {/* Item Name or Edit Input */}
                          <div className="flex-1 flex items-center gap-2 sm:gap-3 pr-2 sm:pr-4 min-w-0">
                            <span className="text-xs font-mono text-slate-500 w-6 sm:w-7 shrink-0">#{index + 1}</span>

                            {isEditing ? (
                              <div className="flex items-center gap-2 flex-1 max-w-md">
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingItem.newVal}
                                  onChange={(e) =>
                                    setEditingItem({ ...editingItem, newVal: e.target.value })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit()
                                    if (e.key === 'Escape') setEditingItem(null)
                                  }}
                                  className="w-full bg-slate-950 border border-blue-500 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={handleSaveEdit}
                                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
                                  title="Guardar cambios"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingItem(null)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition cursor-pointer"
                                  title="Cancelar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-slate-200 truncate">{item}</span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {!isEditing && (
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(activeCatalogTab, item)}
                                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-blue-600/20 text-slate-300 hover:text-blue-400 border border-slate-700 hover:border-blue-500/40 transition cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span className="hidden sm:inline">Modificar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteItem(activeCatalogTab, item)}
                                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span className="hidden sm:inline">Quitar</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE CARGA RÁPIDA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    modalType === 'INGRESO'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : modalType === 'MEDICO'
                      ? 'bg-indigo-500/10 text-indigo-400'
                      : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-white truncate">
                    {modalType === 'EGRESO' && 'Cargar Egreso / Factura'}
                    {modalType === 'MEDICO' && 'Cargar Honorario Médico'}
                    {modalType === 'INGRESO' && 'Cargar Ingreso'}
                  </h3>
                  <p className="text-xs text-slate-400">Período: {selectedMes}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveMovement} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Fecha Emisión</label>
                  <input
                    type="date"
                    required
                    value={formData.fecha}
                    onChange={(e) => handleInputChange('fecha', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Comprobante / Factura Nº</label>
                  <input
                    type="text"
                    placeholder="00001-00000123"
                    value={formData.facturaNro}
                    onChange={(e) => handleInputChange('facturaNro', e.target.value)}
                    className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none ${
                      formData.facturaNro &&
                      formData.empresaConcepto &&
                      movimientos.some(
                        (m) =>
                          m.facturaNro &&
                          String(m.facturaNro).trim().toLowerCase() === formData.facturaNro.trim().toLowerCase() &&
                          m.empresaConcepto &&
                          String(m.empresaConcepto).trim().toLowerCase() === formData.empresaConcepto.trim().toLowerCase()
                      )
                        ? 'border-rose-500 bg-rose-950/20 text-rose-300 focus:border-rose-400'
                        : 'border-slate-800 focus:border-blue-500'
                    }`}
                  />
                  {formData.facturaNro &&
                    formData.empresaConcepto &&
                    movimientos.some(
                      (m) =>
                        m.facturaNro &&
                        String(m.facturaNro).trim().toLowerCase() === formData.facturaNro.trim().toLowerCase() &&
                        m.empresaConcepto &&
                        String(m.empresaConcepto).trim().toLowerCase() === formData.empresaConcepto.trim().toLowerCase()
                    ) && (
                      <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3 text-rose-400" />
                        Ya existe una factura con este Nº para {formData.empresaConcepto}
                      </span>
                    )}
                </div>
              </div>

              {/* Dynamic Entity Select according to type with SEARCHABLE DROPDOWN */}
              {modalType === 'MEDICO' ? (
                <div className="relative">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Médico / Profesional <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(!isDropdownOpen)
                        setEntitySearchFilter('')
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between text-slate-200 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                    >
                      <span className={formData.empresaConcepto ? 'text-white font-semibold' : 'text-slate-500'}>
                        {formData.empresaConcepto || '-- Seleccione o busque un médico --'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* Popover con Buscador en Vivo y Lista */}
                    {isDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <div className="p-2 border-b border-slate-800 bg-slate-950">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            <input
                              type="text"
                              autoFocus
                              placeholder="Filtrar médico por nombre..."
                              value={entitySearchFilter}
                              onChange={(e) => setEntitySearchFilter(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto p-1 divide-y divide-slate-800/40">
                          {maestros.medicos
                            ?.filter((m) =>
                              entitySearchFilter === '' ||
                              m.toLowerCase().includes(entitySearchFilter.toLowerCase())
                            )
                            .map((m) => (
                              <div
                                key={m}
                                onClick={() => {
                                  handleInputChange('empresaConcepto', m)
                                  setIsDropdownOpen(false)
                                }}
                                className={`px-3 py-2 text-xs rounded-lg cursor-pointer transition flex items-center justify-between ${
                                  formData.empresaConcepto === m
                                    ? 'bg-blue-600 text-white font-bold'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                <span>{m}</span>
                                {formData.empresaConcepto === m && <Check className="w-3.5 h-3.5 text-white" />}
                              </div>
                            ))}
                          {maestros.medicos?.filter((m) =>
                            m.toLowerCase().includes(entitySearchFilter.toLowerCase())
                          ).length === 0 && (
                            <div className="p-3 text-center text-xs text-slate-500">
                              No se encontraron médicos con "{entitySearchFilter}"
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : modalType === 'EGRESO' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Rubro</label>
                    <select
                      value={formData.rubro}
                      onChange={(e) => {
                        handleInputChange('rubro', e.target.value)
                        handleInputChange('empresaConcepto', '')
                        setIsDropdownOpen(false)
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                    >
                      <option value="PROVEEDOR">PROVEEDOR</option>
                      <option value="EMPLEADOS">EMPLEADOS</option>
                      <option value="IMPUESTO">IMPUESTO</option>
                      <option value="SEGUROS">SEGUROS</option>
                    </select>
                  </div>

                  <div className="relative">
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      {formData.rubro === 'EMPLEADOS'
                        ? 'Empleado / Personal'
                        : formData.rubro === 'IMPUESTO' || formData.rubro === 'SEGUROS'
                        ? 'Organismo / Entidad'
                        : 'Proveedor / Empresa'}{' '}
                      <span className="text-rose-400">*</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(!isDropdownOpen)
                        setEntitySearchFilter('')
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between text-slate-200 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                    >
                      <span className={formData.empresaConcepto ? 'text-white font-semibold truncate' : 'text-slate-500 truncate'}>
                        {formData.empresaConcepto ||
                          `-- Buscar ${
                            formData.rubro === 'EMPLEADOS'
                              ? 'empleado'
                              : formData.rubro === 'IMPUESTO' || formData.rubro === 'SEGUROS'
                              ? 'organismo'
                              : 'proveedor'
                          } --`}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                    </button>

                    {/* Popover con Buscador en Vivo y Lista para Egresos */}
                    {isDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <div className="p-2 border-b border-slate-800 bg-slate-950">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            <input
                              type="text"
                              autoFocus
                              placeholder="Escribe para filtrar opciones..."
                              value={entitySearchFilter}
                              onChange={(e) => setEntitySearchFilter(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto p-1 divide-y divide-slate-800/40">
                          {(formData.rubro === 'EMPLEADOS'
                            ? maestros.empleados
                            : formData.rubro === 'IMPUESTO' || formData.rubro === 'SEGUROS'
                            ? maestros.impuestos
                            : maestros.proveedores
                          )
                            ?.filter((ent) =>
                              entitySearchFilter === '' ||
                              ent.toLowerCase().includes(entitySearchFilter.toLowerCase())
                            )
                            .map((ent) => (
                              <div
                                key={ent}
                                onClick={() => {
                                  handleInputChange('empresaConcepto', ent)
                                  setIsDropdownOpen(false)
                                }}
                                className={`px-3 py-2 text-xs rounded-lg cursor-pointer transition flex items-center justify-between ${
                                  formData.empresaConcepto === ent
                                    ? 'bg-blue-600 text-white font-bold'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                <span className="truncate">{ent}</span>
                                {formData.empresaConcepto === ent && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-2" />}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Concepto de Ingreso <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.empresaConcepto}
                    onChange={(e) => handleInputChange('empresaConcepto', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                  >
                    <option value="">-- Seleccione concepto de ingreso --</option>
                    {maestros.ingresosTipos?.map((it) => (
                      <option key={it} value={it}>
                        {it}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sede y Detalle Corto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Sede / Ubicación</label>
                  <select
                    value={formData.realizadoEn}
                    onChange={(e) => handleInputChange('realizadoEn', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                  >
                    {maestros.sedes?.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Período / Detalle Resumido</label>
                  <input
                    type="text"
                    placeholder="Ej: Hon Ene 26, Gastos Generales..."
                    value={formData.detalle}
                    onChange={(e) => handleInputChange('detalle', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Detalle Extenso / Observaciones Amplias */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Detalle Extenso / Descripción Completa
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Multi-línea</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Escribe aquí información detallada: descripción de insumos, ítems de la factura, notas adicionales..."
                  value={formData.detalleExtenso}
                  onChange={(e) => handleInputChange('detalleExtenso', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
                ></textarea>
              </div>

              {/* Importes según el tipo */}
              {modalType === 'EGRESO' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Importe Pagado ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.pagosS}
                    onChange={(e) => handleInputChange('pagosS', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500 text-lg font-bold"
                  />
                </div>
              )}

              {modalType === 'MEDICO' && (
                <div className="bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-3 sm:space-y-4">
                  {/* Checkbox para activar/desactivar retención */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.aplicarRetencion}
                        onChange={(e) => handleInputChange('aplicarRetencion', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-950 cursor-pointer accent-blue-600"
                      />
                      <span className="text-xs font-semibold text-slate-200">
                        Aplicar Retención Impositiva
                      </span>
                    </label>

                    {formData.aplicarRetencion && (
                      <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 self-start sm:self-auto">
                        <span className="text-[11px] text-slate-400 font-medium">Porcentaje:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          value={formData.porcentajeRetencion}
                          onChange={(e) => handleInputChange('porcentajeRetencion', e.target.value)}
                          className="w-12 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-amber-300 font-mono font-bold text-center focus:outline-none focus:border-amber-500"
                        />
                        <span className="text-xs font-bold text-amber-400">%</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-indigo-400 block mb-1">Bruto Facturado ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={formData.pagosMed}
                        onChange={(e) => handleInputChange('pagosMed', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-amber-400 block mb-1">
                        Retención {formData.aplicarRetencion ? `(${formData.porcentajeRetencion}%)` : '(Sin retención)'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        disabled={!formData.aplicarRetencion}
                        placeholder="0.00"
                        value={formData.retencionesMed}
                        onChange={(e) => handleInputChange('retencionesMed', e.target.value)}
                        className={`w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none ${
                          formData.aplicarRetencion
                            ? 'text-amber-300 focus:border-amber-500'
                            : 'text-slate-500 opacity-50 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-emerald-400 block mb-1">Neto Liquidado ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        readOnly
                        value={formData.netoPagadoMed}
                        className="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono font-bold cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'INGRESO' && (
                <div className="bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-3">
                  <p className="text-xs font-semibold text-slate-300">Desglose de Ingresos por Concepto ($)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block">Alquiler Salón</label>
                      <input
                        type="number"
                        value={formData.alquilerCpoSalon || ''}
                        onChange={(e) => handleInputChange('alquilerCpoSalon', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block">Venta Cantina</label>
                      <input
                        type="number"
                        value={formData.ventaCantina || ''}
                        onChange={(e) => handleInputChange('ventaCantina', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block">Uso Natatorio</label>
                      <input
                        type="number"
                        value={formData.usoNatatorio || ''}
                        onChange={(e) => handleInputChange('usoNatatorio', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block">Consultas</label>
                      <input
                        type="number"
                        value={formData.consultas || ''}
                        onChange={(e) => handleInputChange('consultas', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block">Prácticas</label>
                      <input
                        type="number"
                        value={formData.practicas || ''}
                        onChange={(e) => handleInputChange('practicas', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block">Odontología</label>
                      <input
                        type="number"
                        value={formData.odontologia || ''}
                        onChange={(e) => handleInputChange('odontologia', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pago / Cheque */}
              <div className="bg-slate-950/60 p-3 sm:p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                    Estado y Medio de Pago
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleInputChange('fechaPago', new Date().toISOString().split('T')[0])}
                      className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition cursor-pointer"
                    >
                      ✓ Pagado Hoy
                    </button>
                    {formData.fechaPago && (
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange('fechaPago', '')
                          handleInputChange('chequeOperacion', '')
                        }}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition cursor-pointer"
                      >
                        Dejar Pendiente
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      Fecha de Pago {formData.fechaPago ? '' : '(Opcional)'}
                    </label>
                    <input
                      type="date"
                      value={formData.fechaPago}
                      onChange={(e) => handleInputChange('fechaPago', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      Cheque / Ref. {formData.fechaPago ? '' : '(Opcional)'}
                    </label>
                    <input
                      type="text"
                      placeholder="Nº de Cheque, Transf, etc..."
                      value={formData.chequeOperacion}
                      onChange={(e) => handleInputChange('chequeOperacion', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 sm:pt-4 border-t border-slate-800 flex justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 sm:px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 sm:px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition"
                >
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR NUEVO PERÍODO */}
      {isNewPeriodModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Crear Nuevo Período / Ejercicio</h3>
                  <p className="text-xs text-slate-400">Habilita un nuevo mes y año contable</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPeriodModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreatePeriod} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Mes
                </label>
                <select
                  value={newPeriodMonth}
                  onChange={(e) => setNewPeriodMonth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-bold cursor-pointer"
                >
                  <option value="ENERO">ENERO</option>
                  <option value="FEBRERO">FEBRERO</option>
                  <option value="MARZO">MARZO</option>
                  <option value="ABRIL">ABRIL</option>
                  <option value="MAYO">MAYO</option>
                  <option value="JUNIO">JUNIO</option>
                  <option value="JULIO">JULIO</option>
                  <option value="AGOSTO">AGOSTO</option>
                  <option value="SETIEMBRE">SETIEMBRE</option>
                  <option value="OCTUBRE">OCTUBRE</option>
                  <option value="NOVIEMBRE">NOVIEMBRE</option>
                  <option value="DICIEMBRE">DICIEMBRE</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Año / Ejercicio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['2025', '2026', '2027'].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setNewPeriodYear(yr)}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        newPeriodYear === yr
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <input
                    type="number"
                    min="2020"
                    max="2050"
                    placeholder="O escribe otro año (ej: 2028)"
                    value={newPeriodYear}
                    onChange={(e) => setNewPeriodYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Nombre del Período:</span>
                <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
                  {newPeriodMonth} {newPeriodYear.slice(-2)}
                </span>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewPeriodModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Habilitar Período</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

