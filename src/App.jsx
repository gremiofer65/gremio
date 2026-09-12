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
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Wallet,
  Receipt,
  Scale,
  Printer,
  ChevronRight,
  ChevronDown,
  History,
  Edit2,
  Trash2,
  Check,
  LogIn,
  LogOut,
  ShieldCheck,
  User,
  KeyRound,
  Menu,
  ArrowLeft,
  FolderPlus,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  Landmark,
  Smartphone,
  Zap,
  Sparkles,
  Bell,
  Clock,
  AlertTriangle,
  Download
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'

const MONTH_ORDER = {
  'ENERO': 1,
  'FEBRERO': 2,
  'MARZO': 3,
  'ABRIL': 4,
  'MAYO': 5,
  'JUNIO': 6,
  'JULIO': 7,
  'AGOSTO': 8,
  'SETIEMBRE': 9,
  'SEPTIEMBRE': 9,
  'OCTUBRE': 10,
  'NOVIEMBRE': 11,
  'DICIEMBRE': 12
}

const sortPeriodsChronologically = (periodList = []) => {
  return [...periodList].sort((a, b) => {
    const partsA = (a || '').trim().split(' ')
    const partsB = (b || '').trim().split(' ')
    
    const monthA = partsA[0]?.toUpperCase() || ''
    const yearA = parseInt(partsA[partsA.length - 1]?.length === 2 ? `20${partsA[partsA.length - 1]}` : partsA[partsA.length - 1]) || 2026

    const monthB = partsB[0]?.toUpperCase() || ''
    const yearB = parseInt(partsB[partsB.length - 1]?.length === 2 ? `20${partsB[partsB.length - 1]}` : partsB[partsB.length - 1]) || 2026

    if (yearA !== yearB) return yearA - yearB
    return (MONTH_ORDER[monthA] || 0) - (MONTH_ORDER[monthB] || 0)
  })
}

const sortAlphabetical = (arr = []) => {
  return [...arr].sort((a, b) => (a || '').localeCompare(b || '', 'es', { sensitivity: 'base' }))
}

const getTodayLocalDate = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const BANCOS_ARGENTINA = [
  'Banco de la Nación Argentina (BNA)',
  'Banco de la Provincia de Buenos Aires (BAPRO)',
  'Banco Santander Argentina',
  'Banco Galicia',
  'Banco BBVA Argentina',
  'Banco Macro',
  'Banco Ciudad de Buenos Aires',
  'Banco Credicoop Cooperativo Limitado',
  'Banco Patagonia',
  'Banco de Córdoba (BANCOR)',
  'Banco de Santa Fe',
  'Banco Supervielle',
  'Banco Hipotecario',
  'Banco HSBC Argentina',
  'Banco ICBC (Industrial and Commercial Bank of China)',
  'Banco Itaú Argentina',
  'Banco Comafi',
  'Banco de San Juan',
  'Banco de Entre Ríos',
  'Banco de Santa Cruz',
  'Banco del Chubut',
  'Banco de La Pampa',
  'Banco de Corrientes',
  'Banco de Neuquén (BPN)',
  'Banco de Formosa',
  'Banco de Santiago del Estero',
  'Banco de Tierra del Fuego',
  'Banco Rioja',
  'Banco Municipal de Rosario',
  'Banco Columbia',
  'Banco BICA',
  'Banco BST (Servicios y Transacciones)',
  'Banco CMF',
  'Banco Piano',
  'Banco Industrial (BIND)',
  'Banco Voii',
  'Banco Coinag',
  'Banco Meridian',
  'Banco Roela',
  'Banco Dino',
  'Banco Julio',
  'Banco Mariva',
  'Banco Interfinanzas',
  'Banco Saenz',
  'Banco del Sol',
  'Banco Brubank',
  'Banco Openbank Argentina',
  'Banco Ualá (Wilobank)',
  'Banco Reba (Compañía Financiera)',
  'Banco Citibank Argentina',
  'Banco BNP Paribas',
  'Banco Deutsche Bank',
  'Banco JPMorgan Chase',
  'Banco MUFG Bank',
  'Banco BICE (Inversión y Comercio Exterior)',
  'Caja de Crédito Cuenca',
  'Nuevo Banco del Chaco'
].sort((a, b) => a.localeCompare(b, 'es'))

const defaultMaestros = {
  proveedores: initialData.maestros?.proveedores ? sortAlphabetical(initialData.maestros.proveedores) : [],
  medicos: initialData.maestros?.medicos ? sortAlphabetical(initialData.maestros.medicos) : [],
  empleados: initialData.maestros?.empleados ? sortAlphabetical(initialData.maestros.empleados) : [
    'Administración',
    'Enfermería',
    'Mantenimiento',
    'Secretaría'
  ],
  sedes: initialData.maestros?.sedes && initialData.maestros.sedes.length > 0 ? sortAlphabetical(initialData.maestros.sedes) : [
    'Campo Deportes',
    'CENS',
    'Centro Cultural',
    'CFL',
    'Consultorios Externos',
    'Policlinica AMOS',
    'Sede Social'
  ],
  conceptosGastos: [
    'Asesoramiento',
    'Comisiones Bancarias',
    'Equipamiento e Instalaciones',
    'Gastos Generales',
    'Gastos Gremiales',
    'Impuestos y Tasas',
    'Insumos Médicos y Odontológicos',
    'Librería e Imprenta',
    'Limpieza y Desinfección',
    'Lub. y Combustibles',
    'Publicidad',
    'Seguros',
    'Servicios y Mantenimiento',
    'Sueldos / Cargas Sociales'
  ],
  conceptosHonorarios: [
    'Hon Ene 26',
    'Hon Feb 26',
    'Hon Mar 26',
    'Hon Abr 26',
    'Hon May 26',
    'Hon Jun 26',
    'Hon Jul 26',
    'Hon Ago 26',
    'Hon Set 26',
    'Hon Oct 26',
    'Hon Nov 26',
    'Hon Dic 26',
    'Hon Ene 25',
    'Hon Feb 25',
    'Hon Mar 25',
    'Hon Abr 25',
    'Hon May 25',
    'Hon Jun 25',
    'Hon Jul 25',
    'Hon Ago 25',
    'Hon Set 25',
    'Hon Oct 25',
    'Hon Nov 25',
    'Hon Dic 25'
  ],
  ingresosTipos: [
    'Alquiler Campo de Deportes / Salón',
    'Alquiler Consultorios',
    'Billeteras (Locación Consultorios)',
    'CENS (Centro Nivel Secundario)',
    'CFL (Centro Formación Laboral)',
    'Consultas Médicas',
    'Enfermería',
    'IAM SEGURO',
    'La Estrella Seg de Retiro',
    'Odontología',
    'Prácticas Médicas',
    'Uso Natatorio',
    'Venta Cantina'
  ],
  impuestos: initialData.maestros?.impuestos ? sortAlphabetical(initialData.maestros.impuestos) : [
    'AFIP / ARCA',
    'ARBA',
    'Municipalidad de Chivilcoy',
    'Seguridad e Higiene'
  ]
}

export default function App() {
  // Authentication State con Supabase Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  // Escuchar y restaurar sesión activa de Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true)
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          nombre: session.user.user_metadata?.nombre || session.user.email.split('@')[0].toUpperCase(),
          rol: 'Administrador'
        })
      }
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true)
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          nombre: session.user.user_metadata?.nombre || session.user.email.split('@')[0].toUpperCase(),
          rol: 'Administrador'
        })
      } else {
        setIsAuthenticated(false)
        setCurrentUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthError('')
    setIsAuthLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword.trim()
      })

      if (error) {
        setAuthError(error.message === 'Invalid login credentials' 
          ? 'Credenciales incorrectas. Verifica tu email y contraseña.' 
          : error.message)
      } else if (data?.user) {
        setIsAuthenticated(true)
        setCurrentUser({
          id: data.user.id,
          email: data.user.email,
          nombre: data.user.user_metadata?.nombre || data.user.email.split('@')[0].toUpperCase(),
          rol: 'Administrador'
        })
      }
    } catch (_err) {
      setAuthError('Ocurrió un error al intentar iniciar sesión. Inténtalo de nuevo.')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    setCurrentUser(null)
  }

  // Navigation
  const [activeTab, setActiveTab] = useState('cuentacorriente') // 'cuentacorriente' | 'libro' | 'dashboard' | 'medicos' | 'maestros'
  const [selectedMes, setSelectedMes] = useState('ENERO 26')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isMobileCCDetailOpen, setIsMobileCCDetailOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Data state
  const [movimientos, setMovimientos] = useState(initialData.movimientos || initialData.movimientosEnero || [])
  const [maestros, setMaestros] = useState(() => {
    const base = { ...defaultMaestros, ...(initialData.maestros || {}) }
    const sorted = {}
    Object.keys(base).forEach((k) => {
      sorted[k] = Array.isArray(base[k]) ? sortAlphabetical(base[k]) : base[k]
    })
    return sorted
  })
  const [meses, setMeses] = useState(() => {
    const defaultMeses = [
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
    return sortPeriodsChronologically(initialData.meses || defaultMeses)
  })

  // Carga inicial y sincronización desde Supabase
  const loadDataFromSupabase = useCallback(async () => {
    try {
      // 1. Cargar Períodos y ordenarlos cronológicamente
      const { data: dbPeriodos } = await supabase
        .from('periodos')
        .select('*')

      if (dbPeriodos && dbPeriodos.length > 0) {
        const sorted = sortPeriodsChronologically(dbPeriodos.map((p) => p.nombre.trim()))
        setMeses(sorted)
      }

      // 2. Cargar Tablas Maestras
      const { data: dbMaestros } = await supabase.from('maestros').select('*')
      if (dbMaestros && dbMaestros.length > 0) {
        const grouped = {}
        dbMaestros.forEach((item) => {
          if (!grouped[item.categoria]) grouped[item.categoria] = []
          grouped[item.categoria].push(item.nombre)
        })
        setMaestros((prev) => {
          const merged = { ...prev }
          Object.keys(grouped).forEach((cat) => {
            const combined = Array.from(new Set([...(merged[cat] || []), ...grouped[cat]]))
            merged[cat] = sortAlphabetical(combined)
          })
          return merged
        })
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
          ingresosCFL: Number(m.ingresos_cfl || 0),
          ingresosCENS: Number(m.ingresos_cens || 0),
          ingresosBilleteras: Number(m.ingresos_billeteras || 0),
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
    }
  }, [])

  useEffect(() => {
    loadDataFromSupabase()
  }, [loadDataFromSupabase])

  // Period / Year Filter State & Modal
  const [selectedYear, setSelectedYear] = useState('2026')
  const [isNewPeriodModalOpen, setIsNewPeriodModalOpen] = useState(false)
  const [newPeriodMonth, setNewPeriodMonth] = useState('ENERO')
  const [newPeriodYear, setNewPeriodYear] = useState('2026')

  // Extract unique years from existing period strings
  const availableYears = useMemo(() => {
    const yearsSet = new Set(['2025', '2026', '2027'])
    meses.forEach((m) => {
      const parts = (m || '').trim().split(' ')
      const yearPart = parts[parts.length - 1]
      if (yearPart) {
        const fullYear = yearPart.length === 2 ? `20${yearPart}` : yearPart
        yearsSet.add(fullYear)
      }
    })
    return Array.from(yearsSet).sort()
  }, [meses])

  // Filtered periods list based on selected year (cronológico)
  const filteredPeriods = useMemo(() => {
    const sorted = sortPeriodsChronologically(meses)
    if (selectedYear === 'TODOS') return sorted
    const shortYear = selectedYear.slice(-2)
    return sorted.filter((m) => {
      const parts = (m || '').trim().split(' ')
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

    const updated = sortPeriodsChronologically([...meses, formattedPeriod])
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
  const [ccPeriodFilter, setCcPeriodFilter] = useState('TODOS')
  const [ccYearFilter, setCcYearFilter] = useState('TODOS')
  const [ccStartDate, setCcStartDate] = useState('')
  const [ccEndDate, setCcEndDate] = useState('')

  // Tablas Maestras CRUD state
  const [activeCatalogTab, setActiveCatalogTab] = useState('proveedores')
  const [newItemName, setNewItemName] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  // Catalog tab labels dictionary
  const catalogLabels = {
    proveedores: 'Proveedores y Empresas',
    medicos: 'Médicos y Profesionales',
    conceptosGastos: 'Conceptos y Gastos',
    conceptosHonorarios: 'Honorarios Períodos',
    ingresosTipos: 'Conceptos de Ingresos',
    empleados: 'Personal y Empleados',
    sedes: 'Sedes y Ubicaciones',
    impuestos: 'Impuestos y Organismos'
  }

  // Handlers for Tablas Maestras con Supabase
  const handleAddItem = async (catalogKey) => {
    const trimmed = newItemName.trim()
    if (!trimmed) return

    setMaestros((prev) => {
      const list = prev[catalogKey] || []
      if (list.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
        alert('Este registro ya existe en el catálogo.')
        return prev
      }
      return {
        ...prev,
        [catalogKey]: sortAlphabetical([...list, trimmed])
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

  const handleCreateCategory = (e) => {
    e.preventDefault()
    const trimmed = newCategoryName.trim()
    if (!trimmed) return
    const key = trimmed.replace(/\s+/g, '_')
    if (maestros[key] || maestros[trimmed]) {
      alert('Esta tabla o catálogo ya existe.')
      setActiveCatalogTab(key)
      setIsNewCategoryModalOpen(false)
      return
    }

    setMaestros((prev) => ({
      ...prev,
      [key]: []
    }))
    setActiveCatalogTab(key)
    setNewCategoryName('')
    setIsNewCategoryModalOpen(false)
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
      const updated = list.map((x) => (x === oldVal ? trimmed : x))
      return {
        ...prev,
        [catalogKey]: sortAlphabetical(updated)
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
  const [medicosPagoFilter, setMedicosPagoFilter] = useState('TODOS') // 'TODOS' | 'PENDIENTES' | 'PAGADOS'

  // Search & Filter for Cheques Module
  const [chequeSearchTerm, setChequeSearchTerm] = useState('')
  const [chequeFilterTipo, setChequeFilterTipo] = useState('TODOS') // 'TODOS' | 'PROPIO' | 'TERCERO'
  const [chequeFilterFormato, setChequeFilterFormato] = useState('TODOS') // 'TODOS' | 'FISICO' | 'ECHEQ'
  const [chequeFilterEstado, setChequeFilterEstado] = useState('TODOS') // 'TODOS' | 'VENCIDO' | 'HOY' | 'POR_VENCER' | 'PAGADOS' | 'PENDIENTES'
  const [chequeFilterMes, setChequeFilterMes] = useState('TODOS')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState('EGRESO') // 'EGRESO' | 'MEDICO' | 'INGRESO'
  const [editingId, setEditingId] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [entitySearchFilter, setEntitySearchFilter] = useState('')
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false)
  const [bankSearchFilter, setBankSearchFilter] = useState('')
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  
  // Helper to obtain a fresh, blank form state for any modal type
  const getCleanFormData = useCallback((type = 'EGRESO') => ({
    fecha: getTodayLocalDate(),
    facturaNro: '',
    rubro: type === 'MEDICO' ? 'MÉDICO' : type === 'INGRESO' ? 'INGRESOS' : 'PROVEEDOR',
    empresaConcepto: '',
    detalle: '',
    detalleExtenso: '',
    realizadoEn: 'Policlinica AMOS',
    fechaPago: '',
    chequeOperacion: '',
    // Medio de Pago y Cheques
    medioPagoTipo: 'TRANSFERENCIA', // 'TRANSFERENCIA' | 'CHEQUE' | 'EFECTIVO' | 'DEBITO' | 'OTRO'
    chequeTipo: 'PROPIO', // 'PROPIO' | 'TERCERO'
    chequeFormato: 'FISICO', // 'FISICO' | 'ECHEQ'
    chequeNumero: '',
    chequeBanco: '',
    chequeFechaCobro: '',
    chequeEmisor: '',
    chequeTitular: '',
    chequeCuit: '',
    chequeCruzado: false,
    chequeNoALaOrden: false,
    // Egresos
    pagosS: '',
    // Medicos
    pagosMed: '',
    aplicarRetencion: true,
    porcentajeRetencion: 5,
    retencionesMed: '',
    netoPagadoMed: '',
    // Ingresos Detallados
    ingresosCFL: '',
    ingresosCENS: '',
    ingresosBilleteras: '',
    alquiConsultorios: '',
    alquilerCpoSalon: '',
    ventaCantina: '',
    usoNatatorio: '',
    practicas: '',
    consultas: '',
    enfermeria: '',
    odontologia: '',
    otIngresos: '',
    compensaciones: '',
    observaciones: ''
  }), [])

  // Form State (siempre limpio)
  const [formData, setFormData] = useState(() => getCleanFormData('EGRESO'))

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
            Number(m.ingresosCFL || 0) +
            Number(m.ingresosCENS || 0) +
            Number(m.ingresosBilleteras || 0) +
            Number(m.alquiConsultorios || 0) +
            Number(m.alquilerCpoSalon || 0) +
            Number(m.ventaCantina || 0) +
            Number(m.usoNatatorio || 0) +
            Number(m.practicas || 0) +
            Number(m.consultas || 0) +
            Number(m.enfermeria || 0) +
            Number(m.odontologia || 0) +
            Number(m.otIngresos || 0) +
            Number(m.compensaciones || 0)
          )
        )
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
  const entidadesCC = useMemo(() => {
    const map = {}

    // Init from maestros (sorted alphabetically)
    sortAlphabetical(maestros.proveedores || []).forEach((p) => {
      map[p] = { nombre: p, tipo: 'PROVEEDOR', totalDebito: 0, totalCredito: 0, movimientosCount: 0 }
    })
    sortAlphabetical(maestros.medicos || []).forEach((m) => {
      map[m] = { nombre: m, tipo: 'MÉDICO', totalDebito: 0, totalCredito: 0, movimientosCount: 0 }
    })
    sortAlphabetical(maestros.empleados || []).forEach((e) => {
      map[e] = { nombre: e, tipo: 'EMPLEADOS', totalDebito: 0, totalCredito: 0, movimientosCount: 0 }
    })

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
        const debito = Number(m.netoPagadoMed || m.pagosMed || 0)
        const credito = m.fechaPago ? debito : 0
        map[entName].totalDebito += debito
        map[entName].totalCredito += credito
      } else if (m.rubro === 'INGRESOS') {
        const monto = Number(m.total || 0)
        map[entName].totalDebito += monto
        map[entName].totalCredito += m.fechaPago ? monto : 0
      } else {
        const monto = Number(m.pagosS || 0)
        const debito = monto
        const credito = m.fechaPago ? monto : 0
        map[entName].totalDebito += debito
        map[entName].totalCredito += credito
      }
    })

    return Object.values(map)
      .map((ent) => ({
        ...ent,
        saldo: ent.totalDebito - ent.totalCredito
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
  }, [movimientos, maestros])

  // Filtered entities list with strict alphabetical order
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
  useEffect(() => {
    if (!selectedEntity && filteredEntidades.length > 0) {
      const withMovs = filteredEntidades.find((e) => e.movimientosCount > 0) || filteredEntidades[0]
      setSelectedEntity(withMovs.nombre)
    }
  }, [filteredEntidades, selectedEntity])

  // Extract ledger movements with running balance for the selected entity
  const extractoCuenta = useMemo(() => {
    if (!selectedEntity) return { movimientos: [], totalDebito: 0, totalCredito: 0, saldoFinal: 0 }

    const entMovs = movimientos
      .filter((m) => {
        if (m.empresaConcepto !== selectedEntity) return false

        if (ccPeriodFilter !== 'TODOS') {
          if (m.mesPeriodo && m.mesPeriodo.trim() !== ccPeriodFilter.trim()) {
            return false
          }
        }

        if (ccYearFilter !== 'TODOS') {
          const yearSuffix = ccYearFilter.slice(-2)
          const matchesPeriodYear = m.mesPeriodo && m.mesPeriodo.includes(yearSuffix)
          const matchesDateYear = m.fecha && m.fecha.startsWith(ccYearFilter)
          if (!matchesPeriodYear && !matchesDateYear) return false
        }

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
        runningBalance += debito
        sumDebito += debito
        rows.push({
          id: `${m.id}-dev`,
          movimientoOriginal: m,
          isPagoRow: false,
          fecha: m.fecha,
          comprobante,
          tipoComprobante: 'Factura / Liquidación Honorario',
          detalle: `${descripcion} (Bruto: ${fmtMoney(m.pagosMed)} - Ret: ${fmtMoney(m.retencionesMed)})`,
          referencia: m.realizadoEn || 'Sede',
          debito,
          credito: 0,
          saldo: runningBalance
        })

        if (m.fechaPago) {
          credito = debito
          runningBalance -= credito
          sumCredito += credito
          rows.push({
            id: `${m.id}-pago`,
            movimientoOriginal: m,
            isPagoRow: true,
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
          movimientoOriginal: m,
          isPagoRow: false,
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
        const monto = Number(m.pagosS || 0)
        debito = monto
        runningBalance += debito
        sumDebito += debito
        rows.push({
          id: `${m.id}-fac`,
          movimientoOriginal: m,
          isPagoRow: false,
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
            movimientoOriginal: m,
            isPagoRow: true,
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

  // Helper to export Cuenta Corriente Ledger to CSV/Excel
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

  // Medical Liquidation Summary & Counts
  const medicosCounts = useMemo(() => {
    const medMovs = movimientos.filter((m) => {
      if (m.rubro !== 'MÉDICO') return false
      if (selectedMes && m.mesPeriodo && m.mesPeriodo.trim() !== selectedMes.trim()) return false
      return true
    })
    const total = medMovs.length
    const pendientes = medMovs.filter((m) => !m.fechaPago).length
    const pagados = medMovs.filter((m) => !!m.fechaPago).length
    return { total, pendientes, pagados }
  }, [movimientos, selectedMes])

  const medicosData = useMemo(() => {
    return movimientos.filter((m) => {
      if (m.rubro !== 'MÉDICO') return false
      if (selectedMes && m.mesPeriodo && m.mesPeriodo.trim() !== selectedMes.trim()) return false
      if (medicosPagoFilter === 'PENDIENTES' && m.fechaPago) return false
      if (medicosPagoFilter === 'PAGADOS' && !m.fechaPago) return false
      return true
    })
  }, [movimientos, selectedMes, medicosPagoFilter])

  // Chart Data: Egresos by Rubro
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

  // Chart Data 2: Evolución Mensual
  const evolucionMensualData = useMemo(() => {
    const periodosList = meses.slice().reverse()
    return periodosList.map((p) => {
      const pMovs = movimientos.filter((m) => m.mesPeriodo && m.mesPeriodo.trim() === p.trim())
      let ing = 0
      let egr = 0

      pMovs.forEach((m) => {
        if (m.rubro === 'INGRESOS') {
          ing += Number(
            m.total || (
              Number(m.ingresosCFL || 0) +
              Number(m.ingresosCENS || 0) +
              Number(m.ingresosBilleteras || 0) +
              Number(m.alquiConsultorios || 0) +
              Number(m.alquilerCpoSalon || 0) +
              Number(m.ventaCantina || 0) +
              Number(m.usoNatatorio || 0) +
              Number(m.practicas || 0) +
              Number(m.consultas || 0) +
              Number(m.enfermeria || 0) +
              Number(m.odontologia || 0) +
              Number(m.otIngresos || 0) +
              Number(m.compensaciones || 0)
            )
          )
        } else {
          egr += Number(m.pagosS || 0) + Number(m.netoPagadoMed || 0)
        }
      })

      return {
        mes: p,
        Ingresos: ing,
        Egresos: egr,
        Superavit: ing - egr
      }
    })
  }, [meses, movimientos])

  // Chart Data 3: Distribución del Gasto por Sede
  const gastosPorSedeData = useMemo(() => {
    const sedeMap = {}
    const periodMovs = selectedMes
      ? movimientos.filter((m) => (m.mesPeriodo ? m.mesPeriodo.trim() === selectedMes.trim() : true))
      : movimientos

    periodMovs.forEach((m) => {
      if (m.rubro === 'INGRESOS') return
      const s = m.realizadoEn || 'Policlinica AMOS'
      const amount = Number(m.pagosS || 0) + Number(m.netoPagadoMed || 0)
      sedeMap[s] = (sedeMap[s] || 0) + amount
    })

    return Object.keys(sedeMap)
      .map((k) => ({ name: k, total: sedeMap[k] }))
      .sort((a, b) => b.total - a.total)
  }, [movimientos, selectedMes])

  // Chart Data 4: Top 5 Entidades con Mayor Gasto
  const topEntidadesGasto = useMemo(() => {
    const entMap = {}
    const periodMovs = selectedMes
      ? movimientos.filter((m) => (m.mesPeriodo ? m.mesPeriodo.trim() === selectedMes.trim() : true))
      : movimientos

    periodMovs.forEach((m) => {
      if (m.rubro === 'INGRESOS') return
      const ent = m.empresaConcepto || 'Sin Especificar'
      const amount = Number(m.pagosS || 0) + Number(m.netoPagadoMed || 0)
      if (!entMap[ent]) {
        entMap[ent] = { nombre: ent, total: 0, rubro: m.rubro }
      }
      entMap[ent].total += amount
    })

    return Object.values(entMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [movimientos, selectedMes])

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

  // Cheque Alerts & Notifications (Vencimientos, En Período, Por Vencer)
  const chequeAlerts = useMemo(() => {
    const todayStr = getTodayLocalDate()
    const today = new Date(todayStr + 'T00:00:00')
    const alerts = []

    movimientos.forEach((m) => {
      const ref = m.chequeOperacion || ''
      const upper = ref.toUpperCase()
      const isCheque = upper.includes('CHEQUE') || upper.includes('CHQ') || upper.includes('ECHEQ')
      if (!isCheque) return

      // Extraer fecha de cobro/vencimiento si existe
      let cobroDateStr = null
      const cobroMatch = ref.match(/Cobro:?\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i)
      if (cobroMatch) {
        cobroDateStr = cobroMatch[1]
      } else {
        const slashMatch = ref.match(/Cobro:?\s*([0-9]{2})\/([0-9]{2})\/([0-9]{4})/i)
        if (slashMatch) {
          cobroDateStr = `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`
        }
      }

      // Si no tiene fecha de cobro específica, usamos la fecha del movimiento o de pago
      const effectiveDateStr = cobroDateStr || (m.fechaPago ? String(m.fechaPago).slice(0, 10) : String(m.fecha).slice(0, 10))
      if (!effectiveDateStr) return

      const targetDate = new Date(effectiveDateStr + 'T00:00:00')
      const diffTime = targetDate.getTime() - today.getTime()
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

      const importe = Number(m.pagosS || m.netoPagadoMed || m.total || 0)
      const entidad = m.empresaConcepto || 'Sin Especificar'
      const isPagado = !!m.fechaPago

      let status = 'AL_DIA' // 'PAGADO' | 'VENCIDO' | 'HOY' | 'POR_VENCER' | 'EN_PERIODO' | 'FUTURO'
      let severity = 'info' // 'success' | 'danger' | 'warning' | 'today' | 'info'
      let label = ''

      if (isPagado) {
        status = 'PAGADO'
        severity = 'success'
        label = m.fechaPago ? `✓ Cobrado / Pagado (${m.fechaPago})` : '✓ Cobrado / Pagado'
      } else if (diffDays < 0) {
        status = 'VENCIDO'
        severity = 'danger'
        label = `Vencido hace ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'día' : 'días'}`
      } else if (diffDays === 0) {
        status = 'HOY'
        severity = 'today'
        label = 'Vence HOY'
      } else if (diffDays <= 7) {
        status = 'POR_VENCER'
        severity = 'warning'
        label = `Vence en ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`
      } else if (m.mesPeriodo && selectedMes && m.mesPeriodo.trim() === selectedMes.trim()) {
        status = 'EN_PERIODO'
        severity = 'info'
        label = `En período (${m.mesPeriodo})`
      } else {
        status = 'FUTURO'
        severity = 'info'
        label = `A cobrar/pagar el ${effectiveDateStr}`
      }

      alerts.push({
        id: m.id,
        movimiento: m,
        entidad,
        importe,
        fechaCobro: effectiveDateStr,
        diffDays,
        status,
        severity,
        label,
        isPagado,
        chequeRef: ref,
        tipo: upper.includes('TERCERO') ? 'Tercero' : 'Propio',
        formato: upper.includes('ECHEQ') ? 'E-Cheq' : 'Físico',
        rubro: m.rubro
      })
    })

    // Ordenar: primero los más críticos (vencidos sin pagar, hoy, próximos a vencer, etc.)
    alerts.sort((a, b) => {
      if (a.isPagado && !b.isPagado) return 1
      if (!a.isPagado && b.isPagado) return -1
      return a.diffDays - b.diffDays
    })

    const criticos = alerts.filter((a) => !a.isPagado && (a.status === 'VENCIDO' || a.status === 'HOY' || a.status === 'POR_VENCER'))
    const vencidosCount = alerts.filter((a) => !a.isPagado && a.status === 'VENCIDO').length
    const hoyCount = alerts.filter((a) => !a.isPagado && a.status === 'HOY').length
    const porVencerCount = alerts.filter((a) => !a.isPagado && a.status === 'POR_VENCER').length
    const enPeriodoCount = alerts.filter((a) => !a.isPagado && a.status === 'EN_PERIODO').length
    const pagadosCount = alerts.filter((a) => a.isPagado).length

    return {
      all: alerts,
      criticos,
      vencidosCount,
      hoyCount,
      porVencerCount,
      enPeriodoCount,
      pagadosCount,
      totalAlertas: criticos.length
    }
  }, [movimientos, selectedMes])

  // Cheques filtrados según los controles de búsqueda del módulo
  const filteredCheques = useMemo(() => {
    return chequeAlerts.all.filter((item) => {
      if (chequeSearchTerm) {
        const term = chequeSearchTerm.toLowerCase()
        const matchEnt = item.entidad.toLowerCase().includes(term)
        const matchRef = item.chequeRef.toLowerCase().includes(term)
        const matchDet = (item.movimiento.detalle || '').toLowerCase().includes(term)
        if (!matchEnt && !matchRef && !matchDet) return false
      }

      if (chequeFilterTipo !== 'TODOS') {
        if (chequeFilterTipo === 'PROPIO' && item.tipo !== 'Propio') return false
        if (chequeFilterTipo === 'TERCERO' && item.tipo !== 'Tercero') return false
      }

      if (chequeFilterFormato !== 'TODOS') {
        if (chequeFilterFormato === 'ECHEQ' && item.formato !== 'E-Cheq') return false
        if (chequeFilterFormato === 'FISICO' && item.formato !== 'Físico') return false
      }

      if (chequeFilterEstado !== 'TODOS') {
        if (chequeFilterEstado === 'VENCIDO' && item.status !== 'VENCIDO') return false
        if (chequeFilterEstado === 'HOY' && item.status !== 'HOY') return false
        if (chequeFilterEstado === 'POR_VENCER' && item.status !== 'POR_VENCER') return false
        if (chequeFilterEstado === 'PAGADOS' && !item.isPagado) return false
        if (chequeFilterEstado === 'PENDIENTES' && item.isPagado) return false
      }

      if (chequeFilterMes !== 'TODOS') {
        if (chequeFilterMes === 'ACTIVO') {
          if (item.movimiento.mesPeriodo && item.movimiento.mesPeriodo.trim() !== selectedMes.trim()) return false
        } else {
          if (item.movimiento.mesPeriodo && item.movimiento.mesPeriodo.trim() !== chequeFilterMes.trim()) return false
        }
      }

      return true
    })
  }, [chequeAlerts.all, chequeSearchTerm, chequeFilterTipo, chequeFilterFormato, chequeFilterEstado, chequeFilterMes, selectedMes])

  // Helper para exportar Cheques a Excel (CSV con formato compatible con Microsoft Excel)
  const exportChequesToExcel = (chequesToExport = []) => {
    if (!chequesToExport || chequesToExport.length === 0) {
      alert('No hay cheques para exportar con los filtros seleccionados.')
      return
    }

    const headers = [
      'Titular / Beneficiario',
      'Rubro',
      'Mes / Período',
      'Tipo Cheque',
      'Formato',
      'Estado Vencimiento',
      'Fecha Cobro / Vto',
      'Fecha Emisión',
      'Referencia / Banco',
      'Detalle',
      'Importe',
      'Estado de Pago'
    ]

    const rows = chequesToExport.map((c) => [
      `"${(c.entidad || '').replace(/"/g, '""')}"`,
      `"${(c.rubro || '').replace(/"/g, '""')}"`,
      `"${(c.movimiento.mesPeriodo || '').replace(/"/g, '""')}"`,
      `"${c.tipo}"`,
      `"${c.formato}"`,
      `"${c.label}"`,
      `"${c.fechaCobro || ''}"`,
      `"${c.movimiento.fecha || ''}"`,
      `"${(c.chequeRef || '').replace(/"/g, '""')}"`,
      `"${(c.movimiento.detalle || '').replace(/"/g, '""')}"`,
      Number(c.importe || 0).toFixed(2),
      `"${c.isPagado ? 'Pagado' : 'Pendiente'}"`
    ])

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const fileName = `Reporte_Cheques_${selectedMes.replace(/\s+/g, '_')}_${getTodayLocalDate()}.csv`
    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

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

  // Close modal and reset form completely
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setIsDropdownOpen(false)
    setEntitySearchFilter('')
    setIsBankDropdownOpen(false)
    setBankSearchFilter('')
    setFormData(getCleanFormData(modalType))
  }

  // Open modal for new creation (siempre 100% limpio y sin datos residuales)
  const handleOpenCreateModal = (type = 'EGRESO') => {
    setEditingId(null)
    setModalType(type)
    setIsDropdownOpen(false)
    setEntitySearchFilter('')
    setIsBankDropdownOpen(false)
    setBankSearchFilter('')
    setFormData(getCleanFormData(type))
    setIsModalOpen(true)
  }

  // Open modal for editing an existing movement
  const handleOpenEditModal = (mov) => {
    if (!mov) return
    setEditingId(mov.id)

    const type = mov.rubro === 'MÉDICO' ? 'MEDICO' : mov.rubro === 'INGRESOS' ? 'INGRESO' : 'EGRESO'
    setModalType(type)
    setIsDropdownOpen(false)
    setEntitySearchFilter('')
    setIsBankDropdownOpen(false)
    setBankSearchFilter('')

    const retMed = Number(mov.retencionesMed || 0)
    const pagMed = Number(mov.pagosMed || 0)
    const hasRet = retMed > 0
    const pctRet = hasRet && pagMed > 0 ? Number(((retMed / pagMed) * 100).toFixed(0)) : 5

    const rawRef = mov.chequeOperacion || ''
    let parsedMedioPago = 'TRANSFERENCIA'
    let parsedChequeTipo = 'PROPIO'
    let parsedChequeFormato = 'FISICO'
    let parsedChequeNumero = ''
    let parsedChequeBanco = ''
    let parsedChequeFechaCobro = ''
    let parsedChequeEmisor = ''
    let parsedChequeTitular = ''
    let parsedChequeCuit = ''
    let parsedChequeCruzado = false
    let parsedChequeNoALaOrden = false

    const upperRef = rawRef.toUpperCase()
    if (upperRef.includes('CHEQUE') || upperRef.includes('CHQ') || upperRef.includes('ECHEQ')) {
      parsedMedioPago = 'CHEQUE'
      if (upperRef.includes('TERCERO')) parsedChequeTipo = 'TERCERO'
      else if (upperRef.includes('PROPIO')) parsedChequeTipo = 'PROPIO'
      
      if (upperRef.includes('ECHEQ') || upperRef.includes('ELECTR')) parsedChequeFormato = 'ECHEQ'
      else parsedChequeFormato = 'FISICO'
      
      if (upperRef.includes('CRUZADO')) parsedChequeCruzado = true
      if (upperRef.includes('NO A LA ORDEN')) parsedChequeNoALaOrden = true
      
      // Intentar extraer número si existe "N°..." o "Nº..." o dígitos
      const numMatch = rawRef.match(/N[º°#]?\s*([0-9A-Za-z-]+)/i)
      if (numMatch) parsedChequeNumero = numMatch[1]
      
      // Intentar extraer banco "Bco..." o "Banco..."
      const bcoMatch = rawRef.match(/(?:Banco|Bco\.?)\s+([A-Za-z0-9\s]+?)(?:\s*-\s*|\s*\||\s*\(|$)/i)
      if (bcoMatch) parsedChequeBanco = bcoMatch[1].trim()
      
      // Intentar extraer cobro
      const cobroMatch = rawRef.match(/Cobro:?\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}\/[0-9]{2}\/[0-9]{4})/i)
      if (cobroMatch) parsedChequeFechaCobro = cobroMatch[1].trim()
    } else if (upperRef.includes('EFECTIVO')) {
      parsedMedioPago = 'EFECTIVO'
    } else if (upperRef.includes('DEBITO') || upperRef.includes('DÉBITO') || upperRef.includes('TARJETA')) {
      parsedMedioPago = 'DEBITO'
    }

    setFormData({
      fecha: mov.fecha ? String(mov.fecha).slice(0, 10) : getTodayLocalDate(),
      facturaNro: mov.facturaNro || '',
      rubro: mov.rubro || 'PROVEEDOR',
      empresaConcepto: mov.empresaConcepto || '',
      detalle: mov.detalle || '',
      detalleExtenso: mov.detalleExtenso || '',
      realizadoEn: mov.realizadoEn || 'Policlinica AMOS',
      fechaPago: mov.fechaPago ? String(mov.fechaPago).slice(0, 10) : '',
      chequeOperacion: mov.chequeOperacion || '',
      medioPagoTipo: parsedMedioPago,
      chequeTipo: parsedChequeTipo,
      chequeFormato: parsedChequeFormato,
      chequeNumero: parsedChequeNumero,
      chequeBanco: parsedChequeBanco,
      chequeFechaCobro: parsedChequeFechaCobro,
      chequeEmisor: parsedChequeEmisor,
      chequeTitular: parsedChequeTitular,
      chequeCuit: parsedChequeCuit,
      chequeCruzado: parsedChequeCruzado,
      chequeNoALaOrden: parsedChequeNoALaOrden,
      pagosS: mov.pagosS ? String(mov.pagosS) : '',
      pagosMed: mov.pagosMed ? String(mov.pagosMed) : '',
      aplicarRetencion: hasRet,
      porcentajeRetencion: pctRet,
      retencionesMed: mov.retencionesMed ? String(mov.retencionesMed) : '',
      netoPagadoMed: mov.netoPagadoMed ? String(mov.netoPagadoMed) : '',
      ingresosCFL: mov.ingresosCFL ? String(mov.ingresosCFL) : '',
      ingresosCENS: mov.ingresosCENS ? String(mov.ingresosCENS) : '',
      ingresosBilleteras: mov.ingresosBilleteras ? String(mov.ingresosBilleteras) : '',
      alquiConsultorios: mov.alquiConsultorios ? String(mov.alquiConsultorios) : '',
      alquilerCpoSalon: mov.alquilerCpoSalon ? String(mov.alquilerCpoSalon) : '',
      ventaCantina: mov.ventaCantina ? String(mov.ventaCantina) : '',
      usoNatatorio: mov.usoNatatorio ? String(mov.usoNatatorio) : '',
      practicas: mov.practicas ? String(mov.practicas) : '',
      consultas: mov.consultas ? String(mov.consultas) : '',
      enfermeria: mov.enfermeria ? String(mov.enfermeria) : '',
      odontologia: mov.odontologia ? String(mov.odontologia) : '',
      otIngresos: mov.otIngresos ? String(mov.otIngresos) : '',
      compensaciones: mov.compensaciones ? String(mov.compensaciones) : '',
      observaciones: mov.observaciones || ''
    })
    setIsModalOpen(true)
  }

  // Handle Delete Movement
  const handleDeleteMovement = async () => {
    if (!editingId) return
    const confirmDelete = window.confirm(
      '¿Estás seguro de que deseas ELIMINAR este movimiento permanentemente? Esta acción eliminará el registro de la cuenta corriente y del libro diario.'
    )
    if (!confirmDelete) return

    const idToDelete = editingId
    setMovimientos((prev) => prev.filter((m) => m.id !== idToDelete))
    handleCloseModal()

    try {
      const { error } = await supabase.from('movimientos').delete().eq('id', idToDelete)
      if (error) {
        console.error('Error eliminando movimiento en Supabase:', error.message)
        alert('Error al eliminar en Supabase: ' + error.message)
      }
    } catch (err) {
      console.error('Error al conectar con Supabase:', err)
    }
  }

  // Handle Anular Movement (Void invoice / reset amounts to 0 with audit trail)
  const handleAnularMovement = async () => {
    if (!editingId) return
    const confirmAnular = window.confirm(
      '¿Deseas ANULAR este comprobante? Los importes se pondrán en $0 y se marcará como [ANULADO] en el concepto para mantener constancia contable sin alterar el saldo.'
    )
    if (!confirmAnular) return

    const idToVoid = editingId
    const currentMov = movimientos.find((m) => m.id === idToVoid)
    if (!currentMov) return

    const voidedDetalle = formData.detalle?.startsWith('[ANULADO]')
      ? formData.detalle
      : `[ANULADO] ${formData.detalle || ''}`.trim()
    const voidedObs = `Comprobante anulado el ${new Date().toLocaleDateString('es-AR')}. ${formData.observaciones || ''}`.trim()

    const updatedMov = {
      ...currentMov,
      detalle: voidedDetalle,
      observaciones: voidedObs,
      pagosS: 0,
      pagosMed: 0,
      retencionesMed: 0,
      netoPagadoMed: 0,
      total: 0,
      ingresosCFL: 0,
      ingresosCENS: 0,
      ingresosBilleteras: 0,
      alquiConsultorios: 0,
      alquilerCpoSalon: 0,
      ventaCantina: 0,
      usoNatatorio: 0,
      practicas: 0,
      consultas: 0,
      enfermeria: 0,
      odontologia: 0,
      otIngresos: 0,
      compensaciones: 0,
      fechaPago: null,
      chequeOperacion: null
    }

    setMovimientos((prev) => prev.map((m) => (m.id === idToVoid ? updatedMov : m)))
    handleCloseModal()

    try {
      const { error } = await supabase
        .from('movimientos')
        .update({
          detalle: voidedDetalle,
          observaciones: voidedObs,
          pagos_s: 0,
          pagos_med: 0,
          retenciones_med: 0,
          neto_pagado_med: 0,
          total: 0,
          alquiler_cpo_salon: 0,
          venta_cantina: 0,
          uso_natatorio: 0,
          alqui_consultorios: 0,
          practicas: 0,
          consultas: 0,
          enfermeria: 0,
          odontologia: 0,
          ot_ingresos: 0,
          compensaciones: 0,
          fecha_pago: null,
          cheque_operacion: null
        })
        .eq('id', idToVoid)

      if (error) {
        console.error('Error anulando comprobante en Supabase:', error.message)
      }
    } catch (err) {
      console.error('Error al anular movimiento en Supabase:', err)
    }
  }

  // Detección proactiva de comprobantes duplicados en tiempo real
  const duplicateVoucher = useMemo(() => {
    const rawFactura = formData.facturaNro ? String(formData.facturaNro).trim().toLowerCase() : ''
    if (!rawFactura || rawFactura === '-' || rawFactura === '0' || rawFactura === '0000') return null

    const rawEmpresa = formData.empresaConcepto ? String(formData.empresaConcepto).trim().toLowerCase() : ''

    // 1. Coincidencia exacta (Factura Nº + Titular/Empresa)
    if (rawEmpresa) {
      const exact = movimientos.find((m) => {
        if (editingId && m.id === editingId) return false
        const mFactura = m.facturaNro ? String(m.facturaNro).trim().toLowerCase() : ''
        const mEmpresa = m.empresaConcepto ? String(m.empresaConcepto).trim().toLowerCase() : ''
        return mFactura === rawFactura && mEmpresa === rawEmpresa
      })
      if (exact) return { ...exact, matchType: 'EXACT' }
    }

    // 2. Coincidencia de Nº de comprobante con otro emisor
    const matchNumber = movimientos.find((m) => {
      if (editingId && m.id === editingId) return false
      const mFactura = m.facturaNro ? String(m.facturaNro).trim().toLowerCase() : ''
      return mFactura === rawFactura
    })

    if (matchNumber) return { ...matchNumber, matchType: 'NUMBER_ONLY' }

    return null
  }, [formData.facturaNro, formData.empresaConcepto, movimientos, editingId])

  // Handle Save / Update Movement
  const handleSaveMovement = async (e) => {
    e.preventDefault()

    // Validar duplicados si se detecta coincidencia exacta
    if (duplicateVoucher && duplicateVoucher.matchType === 'EXACT') {
      const proceed = window.confirm(
        `⚠️ COMPROBANTE YA EXISTE:\n\nYa existe un comprobante con el Nº "${formData.facturaNro}" registrado para "${formData.empresaConcepto}".\n\nFecha registrada: ${duplicateVoucher.fecha}\nDetalle: ${duplicateVoucher.detalle || '-'}\nImporte: ${fmtMoney(duplicateVoucher.pagosS || duplicateVoucher.netoPagadoMed || duplicateVoucher.total)}\n\n¿Deseas guardarlo como duplicado de todas formas?`
      )
      if (!proceed) return
    }

    let totalIngresosCalculado = 0
    if (modalType === 'INGRESO') {
      totalIngresosCalculado =
        Number(formData.ingresosCFL || 0) +
        Number(formData.ingresosCENS || 0) +
        Number(formData.ingresosBilleteras || 0) +
        Number(formData.alquiConsultorios || 0) +
        Number(formData.alquilerCpoSalon || 0) +
        Number(formData.ventaCantina || 0) +
        Number(formData.usoNatatorio || 0) +
        Number(formData.practicas || 0) +
        Number(formData.consultas || 0) +
        Number(formData.enfermeria || 0) +
        Number(formData.odontologia || 0) +
        Number(formData.otIngresos || 0) +
        Number(formData.compensaciones || 0)
    }

    // Construir referencia completa de Medio de Pago / Cheque
    let computedChequeRef = formData.chequeOperacion || ''
    if (formData.medioPagoTipo === 'CHEQUE') {
      const partesCheque = []
      const esEcheq = formData.chequeFormato === 'ECHEQ'
      const labelTipo = formData.chequeTipo === 'TERCERO' ? 'Tercero' : 'Propio'
      const labelFormato = esEcheq ? 'E-Cheq' : 'Cheque Físico'
      
      partesCheque.push(`${labelFormato} ${labelTipo}`)
      
      if (formData.chequeNumero) {
        partesCheque.push(`N° ${formData.chequeNumero}`)
      }
      if (formData.chequeBanco) {
        partesCheque.push(`Bco: ${formData.chequeBanco}`)
      }
      if (formData.chequeFechaCobro) {
        partesCheque.push(`Cobro: ${formData.chequeFechaCobro}`)
      }
      if (formData.chequeTipo === 'TERCERO') {
        if (formData.chequeEmisor) partesCheque.push(`Librador: ${formData.chequeEmisor}`)
        if (formData.chequeCuit) partesCheque.push(`CUIT: ${formData.chequeCuit}`)
      }
      if (formData.chequeCruzado) partesCheque.push('Cruzado')
      if (formData.chequeNoALaOrden) partesCheque.push('No a la orden')
      
      computedChequeRef = partesCheque.join(' | ')
    } else if (formData.medioPagoTipo === 'EFECTIVO') {
      computedChequeRef = formData.chequeOperacion ? `Efectivo - ${formData.chequeOperacion}` : 'Efectivo'
    } else if (formData.medioPagoTipo === 'DEBITO') {
      computedChequeRef = formData.chequeOperacion ? `Débito - ${formData.chequeOperacion}` : 'Débito / Tarjeta'
    }

    if (editingId) {
      // 1. MODO EDICIÓN / MODIFICAR
      const currentMov = movimientos.find((m) => m.id === editingId) || {}
      const updatedMov = {
        ...currentMov,
        fecha: formData.fecha,
        facturaNro: formData.facturaNro,
        rubro: modalType === 'MEDICO' ? 'MÉDICO' : modalType === 'INGRESO' ? 'INGRESOS' : formData.rubro,
        empresaConcepto: formData.empresaConcepto || (modalType === 'INGRESO' ? 'Ingresos Varios' : ''),
        detalle: formData.detalle,
        detalleExtenso: formData.detalleExtenso,
        realizadoEn: formData.realizadoEn || 'Policlinica AMOS',
        fechaPago: formData.fechaPago || null,
        chequeOperacion: computedChequeRef || null,
        pagosS: modalType === 'EGRESO' ? Number(formData.pagosS || 0) : 0,
        pagosMed: modalType === 'MEDICO' ? Number(formData.pagosMed || 0) : 0,
        retencionesMed: modalType === 'MEDICO' ? Number(formData.retencionesMed || 0) : 0,
        netoPagadoMed: modalType === 'MEDICO' ? Number(formData.netoPagadoMed || 0) : 0,
        ingresosCFL: Number(formData.ingresosCFL || 0),
        ingresosCENS: Number(formData.ingresosCENS || 0),
        ingresosBilleteras: Number(formData.ingresosBilleteras || 0),
        alquiConsultorios: Number(formData.alquiConsultorios || 0),
        alquilerCpoSalon: Number(formData.alquilerCpoSalon || 0),
        ventaCantina: Number(formData.ventaCantina || 0),
        usoNatatorio: Number(formData.usoNatatorio || 0),
        practicas: Number(formData.practicas || 0),
        consultas: Number(formData.consultas || 0),
        enfermeria: Number(formData.enfermeria || 0),
        odontologia: Number(formData.odontologia || 0),
        otIngresos: Number(formData.otIngresos || 0),
        compensaciones: Number(formData.compensaciones || 0),
        total: totalIngresosCalculado,
        observaciones: formData.observaciones
      }

      setMovimientos((prev) => prev.map((m) => (m.id === editingId ? updatedMov : m)))
      handleCloseModal()

      try {
        const { error } = await supabase
          .from('movimientos')
          .update({
            fecha: updatedMov.fecha,
            factura_nro: updatedMov.facturaNro || null,
            rubro: updatedMov.rubro,
            empresa_concepto: updatedMov.empresaConcepto,
            detalle: updatedMov.detalle || null,
            detalle_extenso: updatedMov.detalleExtenso || null,
            realizado_en: updatedMov.realizadoEn || null,
            fecha_pago: updatedMov.fechaPago || null,
            cheque_operacion: updatedMov.chequeOperacion || null,
            pagos_s: updatedMov.pagosS,
            ingresos_s: updatedMov.ingresosS || 0,
            pagos_med: updatedMov.pagosMed,
            retenciones_med: updatedMov.retencionesMed,
            neto_pagado_med: updatedMov.netoPagadoMed,
            alquiler_cpo_salon: updatedMov.alquilerCpoSalon,
            venta_cantina: updatedMov.ventaCantina,
            uso_natatorio: updatedMov.usoNatatorio,
            alqui_consultorios: updatedMov.alquiConsultorios,
            practicas: updatedMov.practicas,
            consultas: updatedMov.consultas,
            enfermeria: updatedMov.enfermeria,
            odontologia: updatedMov.odontologia,
            ot_ingresos: updatedMov.otIngresos,
            compensaciones: updatedMov.compensaciones,
            total: updatedMov.total,
            observaciones: updatedMov.observaciones || null
          })
          .eq('id', editingId)

        if (error) console.error('Error actualizando movimiento en Supabase:', error.message)
      } catch (err) {
        console.error('Error enviando actualización a Supabase:', err)
      }
    } else {
      // 2. MODO CREACIÓN
      const newMov = {
        id: 'mov-' + Date.now(),
        fecha: formData.fecha,
        facturaNro: formData.facturaNro,
        rubro: modalType === 'MEDICO' ? 'MÉDICO' : modalType === 'INGRESO' ? 'INGRESOS' : formData.rubro,
        empresaConcepto: formData.empresaConcepto || (modalType === 'INGRESO' ? 'Ingresos Varios' : ''),
        detalle: formData.detalle,
        detalleExtenso: formData.detalleExtenso,
        realizadoEn: formData.realizadoEn || 'Policlinica AMOS',
        fechaPago: formData.fechaPago || null,
        chequeOperacion: computedChequeRef || null,
        mesPeriodo: selectedMes,
        pagosS: modalType === 'EGRESO' ? Number(formData.pagosS || 0) : 0,
        pagosMed: modalType === 'MEDICO' ? Number(formData.pagosMed || 0) : 0,
        retencionesMed: modalType === 'MEDICO' ? Number(formData.retencionesMed || 0) : 0,
        netoPagadoMed: modalType === 'MEDICO' ? Number(formData.netoPagadoMed || 0) : 0,
        ingresosCFL: Number(formData.ingresosCFL || 0),
        ingresosCENS: Number(formData.ingresosCENS || 0),
        ingresosBilleteras: Number(formData.ingresosBilleteras || 0),
        alquiConsultorios: Number(formData.alquiConsultorios || 0),
        alquilerCpoSalon: Number(formData.alquilerCpoSalon || 0),
        ventaCantina: Number(formData.ventaCantina || 0),
        usoNatatorio: Number(formData.usoNatatorio || 0),
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
      handleCloseModal()

      try {
        const { data: insertedData, error } = await supabase
          .from('movimientos')
          .insert([
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
          ])
          .select()

        if (error) {
          console.error('Error insertando movimiento en Supabase:', error.message)
        } else if (insertedData && insertedData[0]?.id) {
          // Reemplazar id provisional con el UUID generado por Supabase
          setMovimientos((prev) =>
            prev.map((m) => (m.id === newMov.id ? { ...m, id: insertedData[0].id } : m))
          )
        }
      } catch (err) {
        console.error('Error enviando movimiento a Supabase:', err)
      }
    }
  }

  const selectedEntityObj = entidadesCC.find((e) => e.nombre === selectedEntity)

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 mx-auto flex items-center justify-center shadow-xl shadow-blue-600/30 mb-4 border border-blue-400/30">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Sistema de Gestión</h1>
            <p className="text-sm text-slate-400 mt-1">Acceso Administrativo y Contabilidad</p>
          </div>

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
                  disabled={isAuthLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAuthLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verificando credenciales...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Ingresar al Sistema</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Autenticación Segura
              </span>
              <span className="font-mono text-slate-500">Supabase Auth</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen print:h-auto print:min-h-0 print:overflow-visible print:block bg-slate-950 text-slate-100 overflow-hidden font-sans relative">
      {/* MOBILE OVERLAY */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 ${
          isSidebarCollapsed ? 'w-72 md:w-20' : 'w-72 md:w-64'
        } bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 transform transition-all duration-200 ease-in-out md:static md:translate-x-0 print:hidden ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col min-h-0">
          {/* Logo / Header */}
          <div className="p-3.5 md:p-4 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className={`flex items-center gap-2.5 min-w-0 ${isSidebarCollapsed ? 'md:justify-center md:w-full' : ''}`}>
              <div
                onClick={() => isSidebarCollapsed && setIsSidebarCollapsed(false)}
                className={`w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0 ${
                  isSidebarCollapsed ? 'cursor-pointer' : ''
                }`}
                title={isSidebarCollapsed ? 'Haga clic para expandir menú' : 'Sistema Gestión'}
              >
                <Scale className="w-5 h-5 text-white" />
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <h1 className="font-bold text-sm md:text-base tracking-tight text-white truncate">Sistema Gestión</h1>
                  <p className="text-[11px] text-slate-400 truncate">Contabilidad & Finanzas</p>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop collapse / expand button */}
            {!isSidebarCollapsed && (
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(true)}
                className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Minimizar menú lateral (más espacio)"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className={`px-2 md:px-3 space-y-1.5 mt-3 ${isSidebarCollapsed ? 'md:px-2' : ''}`}>
            <button
              onClick={() => {
                setActiveTab('cuentacorriente')
                setIsMobileSidebarOpen(false)
                setIsMobileCCDetailOpen(false)
              }}
              title="Cuentas Corrientes"
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'md:justify-center md:px-0 md:py-3' : 'gap-3 px-3.5 py-2.5'
              } rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'cuentacorriente'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Cuenta Corriente</span>}
            </button>

            <button
              onClick={() => {
                setActiveTab('libro')
                setIsMobileSidebarOpen(false)
              }}
              title="Libro Diario / Caja"
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'md:justify-center md:px-0 md:py-3' : 'gap-3 px-3.5 py-2.5'
              } rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'libro'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Libro Diario / Caja</span>}
            </button>

            <button
              onClick={() => {
                setActiveTab('cheques')
                setIsMobileSidebarOpen(false)
              }}
              title="Gestión de Cheques"
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'md:justify-center md:px-0 md:py-3' : 'gap-3 px-3.5 py-2.5'
              } rounded-xl text-sm font-medium transition-all cursor-pointer relative ${
                activeTab === 'cheques'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="relative">
                <FileText className="w-4 h-4 shrink-0 text-amber-400" />
                {chequeAlerts.totalAlertas > 0 && isSidebarCollapsed && (
                  <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">Cheques</span>
                  {chequeAlerts.totalAlertas > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-500 text-white shrink-0">
                      {chequeAlerts.totalAlertas}
                    </span>
                  )}
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('dashboard')
                setIsMobileSidebarOpen(false)
              }}
              title="Dashboard & Balances"
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'md:justify-center md:px-0 md:py-3' : 'gap-3 px-3.5 py-2.5'
              } rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Dashboard & Balances</span>}
            </button>

            <button
              onClick={() => {
                setActiveTab('medicos')
                setIsMobileSidebarOpen(false)
              }}
              title="Honorarios Médicos"
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'md:justify-center md:px-0 md:py-3' : 'gap-3 px-3.5 py-2.5'
              } rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'medicos'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0 text-indigo-400" />
              {!isSidebarCollapsed && <span className="truncate">Honorarios Médicos</span>}
            </button>

            <button
              onClick={() => {
                setActiveTab('maestros')
                setIsMobileSidebarOpen(false)
              }}
              title="Tablas Maestras"
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'md:justify-center md:px-0 md:py-3' : 'gap-3 px-3.5 py-2.5'
              } rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'maestros'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Tablas Maestras</span>}
            </button>
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className={`p-3 md:p-3.5 border-t border-slate-800 bg-slate-900/50 space-y-2.5 ${isSidebarCollapsed ? 'md:p-2.5' : ''}`}>
          <div className={`flex items-center justify-between ${isSidebarCollapsed ? 'md:flex-col md:gap-2 md:items-center' : ''}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0"
                title={currentUser?.email || currentUser?.nombre}
              >
                {currentUser?.nombre ? currentUser.nombre.charAt(0) : 'A'}
              </div>
              {!isSidebarCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{currentUser?.nombre}</p>
                  <p className="text-[10px] text-slate-400 truncate">{currentUser?.email}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{entidadesCC.length} Cuentas activas</span>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible print:block print:h-auto bg-slate-950">
        {/* TOP NAVBAR */}
        <header className="min-h-16 py-2.5 md:py-0 border-b border-slate-800 px-3 md:px-6 flex flex-wrap items-center justify-between gap-2.5 bg-slate-900/80 backdrop-blur-md shrink-0 z-30 print:hidden">
          <div className="flex items-center gap-2.5 md:gap-3.5 min-w-0">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 focus:outline-none"
              title="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop toggle button */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title={isSidebarCollapsed ? 'Expandir barra lateral' : 'Minimizar barra lateral (más espacio)'}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4 text-blue-400" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            <div className="min-w-0">
              <h2 className="text-sm md:text-base lg:text-lg font-semibold text-white truncate">
                {activeTab === 'cuentacorriente' && 'Cuentas Corrientes'}
                {activeTab === 'libro' && 'Libro Diario / Caja'}
                {activeTab === 'cheques' && 'Gestión y Cartera de Cheques'}
                {activeTab === 'dashboard' && 'Dashboard y Balances'}
                {activeTab === 'medicos' && 'Honorarios Médicos'}
                {activeTab === 'maestros' && 'Tablas Maestras'}
              </h2>
            </div>
            {(activeTab === 'libro' || activeTab === 'dashboard') && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap shrink-0">
                {selectedMes}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            {/* NOTIFICACIONES DE CHEQUES / VENCIMIENTOS */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative p-2 rounded-lg border transition cursor-pointer flex items-center justify-center ${
                  chequeAlerts.vencidosCount > 0
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 hover:bg-rose-500/20 shadow-sm shadow-rose-950'
                    : chequeAlerts.hoyCount > 0 || chequeAlerts.porVencerCount > 0
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20 shadow-sm shadow-amber-950'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
                title="Notificaciones y Vencimientos de Cheques"
              >
                <Bell className="w-4 h-4" />
                {chequeAlerts.totalAlertas > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-slate-900 animate-pulse">
                    {chequeAlerts.totalAlertas}
                  </span>
                )}
              </button>

              {/* DROPDOWN DE NOTIFICACIONES */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs font-bold text-white">Vencimientos de Cheques</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {chequeAlerts.vencidosCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {chequeAlerts.vencidosCount} Vencidos
                        </span>
                      )}
                      {chequeAlerts.porVencerCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {chequeAlerts.porVencerCount} Próximos
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="p-1 text-slate-400 hover:text-white rounded ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar p-1">
                    {chequeAlerts.all.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs">
                        <CheckCircle2 className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-emerald-400" />
                        No hay cheques registrados en el sistema.
                      </div>
                    ) : (
                      chequeAlerts.all.map((item) => {
                        const isVencido = item.status === 'VENCIDO'
                        const isHoy = item.status === 'HOY'
                        const isPorVencer = item.status === 'POR_VENCER'

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setIsNotificationsOpen(false)
                              handleOpenEditModal(item.movimiento)
                            }}
                            className="p-2.5 hover:bg-slate-800/60 rounded-xl transition cursor-pointer space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-xs text-white truncate">
                                {item.entidad}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border whitespace-nowrap ${
                                  isVencido
                                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                                    : isHoy
                                    ? 'bg-red-500 text-white font-extrabold border-red-400 animate-pulse'
                                    : isPorVencer
                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                }`}
                              >
                                {item.label}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="truncate text-slate-300 font-mono text-[10px]">
                                {item.formato} • {item.tipo}
                              </span>
                              <span className="font-mono font-bold text-white">
                                {fmtMoney(item.importe)}
                              </span>
                            </div>

                            <div className="text-[10px] text-slate-500 truncate">
                              {item.chequeRef}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {chequeAlerts.all.length > 0 && (
                    <div className="p-2.5 bg-slate-950 text-center border-t border-slate-800 text-[11px] text-slate-400">
                      Haz clic en cualquier cheque para ver o editar su estado de pago.
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => handleOpenCreateModal('EGRESO')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              title="Cargar Gasto / Factura"
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Cargar</span> Gasto
            </button>

            <button
              onClick={() => handleOpenCreateModal('MEDICO')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              title="Cargar Honorario Médico"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Honorario</span> Médico
            </button>

            <button
              onClick={() => handleOpenCreateModal('INGRESO')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              title="Nuevo Ingreso"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nuevo</span> Ingreso
            </button>
          </div>
        </header>

        {/* VIEW CONTAINER */}
        <div className="flex-1 overflow-y-auto print:overflow-visible print:block print:h-auto print:p-0 print:m-0 print:space-y-0 p-3 sm:p-5 lg:p-6 space-y-4 md:space-y-6">
          {/* BANNER DE ALERTA DE VENCIMIENTOS DE CHEQUES SI CORRESPONDE */}
          {chequeAlerts.criticos.length > 0 && (
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-3 sm:p-4 shadow-lg flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span>Atención: Hay cheques con vencimiento próximo o vencidos</span>
                    {chequeAlerts.vencidosCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                        {chequeAlerts.vencidosCount} Vencidos
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    {chequeAlerts.criticos.map((c) => `${c.entidad} (${c.label})`).slice(0, 2).join(' • ')}
                    {chequeAlerts.criticos.length > 2 && ` y ${chequeAlerts.criticos.length - 2} más...`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer shadow"
                >
                  Ver Todos los Cheques
                </button>
              </div>
            </div>
          )}
          {/* TAB 1: CUENTA CORRIENTE */}
          {activeTab === 'cuentacorriente' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start print:block print:w-full">
              {/* LEFT COLUMN: ENTITIES SELECTOR */}
              <div
                className={`lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl print:hidden ${
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
                      placeholder="Buscar cuenta por nombre..."
                      value={ccSearchTerm}
                      onChange={(e) => setCcSearchTerm(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Tabs Filter */}
                  <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-lg text-[11px] font-semibold text-slate-400">
                    <button
                      onClick={() => setCcFilterType('TODOS')}
                      className={`py-1 rounded cursor-pointer transition ${
                        ccFilterType === 'TODOS' ? 'bg-blue-600 text-white' : 'hover:text-white'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setCcFilterType('MEDICOS')}
                      className={`py-1 rounded cursor-pointer transition ${
                        ccFilterType === 'MEDICOS' ? 'bg-blue-600 text-white' : 'hover:text-white'
                      }`}
                    >
                      Médicos
                    </button>
                    <button
                      onClick={() => setCcFilterType('PROVEEDORES')}
                      className={`py-1 rounded cursor-pointer transition ${
                        ccFilterType === 'PROVEEDORES' ? 'bg-blue-600 text-white' : 'hover:text-white'
                      }`}
                    >
                      Proveed.
                    </button>
                    <button
                      onClick={() => setCcFilterType('EMPLEADOS')}
                      className={`py-1 rounded cursor-pointer transition ${
                        ccFilterType === 'EMPLEADOS' ? 'bg-blue-600 text-white' : 'hover:text-white'
                      }`}
                    >
                      Personal
                    </button>
                  </div>
                </div>

                {/* Entity List */}
                <div className="max-h-[60vh] lg:max-h-[calc(100vh-250px)] overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
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

              {/* RIGHT COLUMN: EXTRACTO BANCARIO / LIBRO MAYOR */}
              <div
                className={`lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl print:bg-white print:border-none print:shadow-none print:w-full print:p-0 print:block ${
                  !isMobileCCDetailOpen ? 'hidden lg:flex' : 'flex'
                }`}
              >
                {/* Header Summary for Selected Entity */}
                {selectedEntityObj ? (
                  <>
                    {/* PRINT-ONLY OFFICIAL DOCUMENT HEADER */}
                    <div className="hidden print:block mb-4 text-black">
                      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2 mb-3">
                        <div>
                          <h1 className="text-lg font-black uppercase tracking-wide text-slate-900">
                            EXTRACTO DE CUENTA CORRIENTE
                          </h1>
                          <p className="text-xs text-slate-700 font-semibold mt-0.5">
                            {selectedEntityObj.nombre} &bull; <span className="uppercase text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-bold">{selectedEntityObj.tipo}</span>
                          </p>
                        </div>
                        <div className="text-right text-[10px] text-slate-600 leading-tight">
                          <p><strong className="text-slate-900">Fecha de Emisión:</strong> {new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                          <p><strong className="text-slate-900">Período:</strong> {ccPeriodFilter !== 'TODOS' ? ccPeriodFilter : 'Histórico Completo'}</p>
                          {(ccStartDate || ccEndDate) && (
                            <p><strong className="text-slate-900">Rango:</strong> {ccStartDate || 'Inicio'} a {ccEndDate || 'Fin'}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-slate-50 border border-slate-300 rounded p-2.5 mb-3">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-bold block">Titular de la Cuenta</span>
                          <span className="font-bold text-slate-900 text-sm">{selectedEntityObj.nombre}</span>
                        </div>
                        <div className="flex items-center gap-4 text-right font-mono">
                          <div className="border-r border-slate-300 pr-3">
                            <span className="text-[9px] text-slate-500 uppercase font-sans font-bold block">Total Débito</span>
                            <span className="text-xs font-bold text-rose-600">{fmtMoney(extractoCuenta.totalDebito)}</span>
                          </div>
                          <div className="border-r border-slate-300 pr-3">
                            <span className="text-[9px] text-slate-500 uppercase font-sans font-bold block">Total Crédito</span>
                            <span className="text-xs font-bold text-emerald-600">{fmtMoney(extractoCuenta.totalCredito)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-sans font-bold block">Saldo Final</span>
                            <span className={`text-xs font-extrabold ${extractoCuenta.saldoFinal === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {fmtMoney(extractoCuenta.saldoFinal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                      <div className="flex items-center gap-3">
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

                      {/* Resumen Cards */}
                      <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-3 font-mono">
                        <div className="bg-slate-900 border border-slate-800 p-2 sm:px-3 sm:py-2 rounded-xl text-center sm:text-right">
                          <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-sans font-bold block truncate">
                            Débito
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-rose-400">
                            {fmtMoney(extractoCuenta.totalDebito)}
                          </span>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-2 sm:px-3 sm:py-2 rounded-xl text-center sm:text-right">
                          <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-sans font-bold block truncate">
                            Crédito
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-emerald-400">
                            {fmtMoney(extractoCuenta.totalCredito)}
                          </span>
                        </div>

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

                    {/* Filter Toolbar */}
                    <div className="px-3.5 sm:px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="font-semibold text-slate-400 flex items-center gap-1.5 text-xs">
                          <Filter className="w-3.5 h-3.5 text-blue-400" />
                          Filtros:
                        </span>

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
                  <div className="p-6 text-center text-slate-400">Seleccione una cuenta para ver su extracto.</div>
                )}

                {/* Table of Ledger Entries */}
                <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 print:hidden">
                  <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                    <Edit2 className="w-3.5 h-3.5" />
                    Haz clic en cualquier comprobante o pago para modificarlo, registrar pago, anularlo o eliminarlo.
                  </span>
                </div>
                <div className="overflow-x-auto overflow-y-auto max-h-[60vh] print:overflow-visible print:max-h-none print:w-full">
                  <table className="w-full text-left text-xs border-collapse min-w-[650px] print:min-w-0 print:w-full print:text-[10px] print:table-fixed">
                    <thead className="bg-slate-950/80 sticky top-0 z-10 backdrop-blur border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold print:bg-slate-100 print:text-slate-900 print:border-slate-400">
                      <tr>
                        <th className="py-3 px-4 print:py-1.5 print:px-2 print:w-[12%]">Fecha</th>
                        <th className="py-3 px-3 print:py-1.5 print:px-2 print:w-[18%]">Comprobante</th>
                        <th className="py-3 px-4 print:py-1.5 print:px-2 print:w-[40%]">Concepto / Detalle</th>
                        <th className="py-3 px-3 text-right text-rose-400 print:text-rose-700 font-bold print:py-1.5 print:px-2 print:w-[10%]">Débito (+)</th>
                        <th className="py-3 px-3 text-right text-emerald-400 print:text-emerald-700 font-bold print:py-1.5 print:px-2 print:w-[10%]">Crédito (-)</th>
                        <th className="py-3 px-4 text-right text-blue-400 print:text-slate-900 font-extrabold print:py-1.5 print:px-2 print:w-[10%]">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {extractoCuenta.movimientos.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-slate-500 print:text-slate-700 print:py-8">
                            <History className="w-8 h-8 mx-auto mb-2 opacity-40 print:hidden" />
                            No hay movimientos registrados para esta cuenta en el período activo.
                          </td>
                        </tr>
                      ) : (
                        extractoCuenta.movimientos.map((row) => {
                          const isDebito = row.debito > 0
                          const isCredito = row.credito > 0

                          return (
                            <tr
                              key={row.id}
                              onClick={() => handleOpenEditModal(row.movimientoOriginal)}
                              className="hover:bg-blue-600/10 active:bg-blue-600/20 transition cursor-pointer group"
                              title="Haz clic para modificar, registrar pago, anular o eliminar este movimiento"
                            >
                              <td className="py-3 px-4 text-slate-300 print:text-slate-900 print:py-1.5 print:px-2 whitespace-nowrap group-hover:text-blue-300 transition">
                                {row.fecha}
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-300 print:text-slate-900 font-semibold print:py-1.5 print:px-2 whitespace-nowrap group-hover:text-blue-200">
                                {row.comprobante}
                              </td>
                              <td className="py-2.5 px-4 print:py-1.5 print:px-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border print:border-none print:p-0 ${
                                      isDebito
                                        ? 'bg-rose-500/10 text-rose-400 print:text-rose-700 border-rose-500/20'
                                        : 'bg-emerald-500/10 text-emerald-400 print:text-emerald-700 border-emerald-500/20'
                                    }`}
                                  >
                                    {row.tipoComprobante}
                                  </span>
                                </div>
                                <div className="text-slate-300 print:text-slate-800 text-xs print:text-[9.5px] mt-1 leading-snug group-hover:text-slate-100">
                                  <span>{row.detalle}</span>
                                  {row.referencia && (
                                    <span className="text-slate-500 print:text-slate-600 ml-1 text-[11px] print:text-[9px]">
                                      • {row.referencia}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-semibold text-rose-400 print:text-rose-700 print:py-1.5 print:px-2 whitespace-nowrap">
                                {isDebito ? fmtMoney(row.debito) : '-'}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400 print:text-emerald-700 print:py-1.5 print:px-2 whitespace-nowrap">
                                {isCredito ? fmtMoney(row.credito) : '-'}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-white print:text-slate-900 print:py-1.5 print:px-2 whitespace-nowrap bg-slate-950/30 print:bg-transparent">
                                {fmtMoney(row.saldo)}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                    {extractoCuenta.movimientos.length > 0 && (
                      <tfoot className="bg-slate-950 print:bg-slate-100 border-t-2 border-slate-700 print:border-slate-900 font-bold text-xs sticky bottom-0 z-10 shadow-lg print:shadow-none print:static">
                        <tr>
                          <td colSpan={3} className="py-3 px-4 print:py-1.5 print:px-2 text-slate-300 print:text-slate-900 uppercase tracking-wider">
                            Total General
                          </td>
                          <td className="py-3 px-3 print:py-1.5 print:px-2 text-right font-mono text-rose-400 print:text-rose-700 whitespace-nowrap">
                            {fmtMoney(extractoCuenta.totalDebito)}
                          </td>
                          <td className="py-3 px-3 print:py-1.5 print:px-2 text-right font-mono text-emerald-400 print:text-emerald-700 whitespace-nowrap">
                            {fmtMoney(extractoCuenta.totalCredito)}
                          </td>
                          <td className="py-3 px-4 print:py-1.5 print:px-2 text-right font-mono text-white print:text-slate-900 whitespace-nowrap bg-slate-900/80 print:bg-transparent">
                            <span className={extractoCuenta.saldoFinal === 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-amber-400 print:text-amber-700'}>
                              {fmtMoney(extractoCuenta.saldoFinal)}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap justify-between items-center gap-2 text-xs print:hidden">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] sm:text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Partida doble contable aplicada</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-400" />
                      Imprimir
                    </button>
                  </div>
                </div>

                {/* PRINT-ONLY SIGNATURE FOOTER */}
                <div className="hidden print:grid grid-cols-2 gap-8 mt-12 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-600">
                  <div>
                    <div className="border-b border-slate-400 w-48 mx-auto mb-1"></div>
                    <p className="font-bold text-slate-800">Firma y Sello Responsable</p>
                    <p>Administración / Contabilidad</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 w-48 mx-auto mb-1"></div>
                    <p className="font-bold text-slate-800">Firma y Conformidad</p>
                    <p>{selectedEntityObj?.nombre || 'Titular'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIBRO DIARIO / CAJA */}
          {activeTab === 'libro' && (
            <div className="space-y-4">
              {/* SELECTOR DE EJERCICIO / AÑO / PERÍODO */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Año / Ejercicio:
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {selectedMes}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Libro Diario y Caja correspondientes a este período contable
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Selector Año */}
                  <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
                    <span className="text-[11px] text-slate-400 font-semibold">Año:</span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="TODOS" className="bg-slate-900 text-white">Todos</option>
                      {availableYears.map((y) => (
                        <option key={y} value={y} className="bg-slate-900 text-white">
                          Año {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selector Mes / Período */}
                  <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
                    <span className="text-[11px] text-slate-400 font-semibold">Mes:</span>
                    <select
                      value={selectedMes}
                      onChange={(e) => setSelectedMes(e.target.value)}
                      className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
                    >
                      {filteredPeriods.length === 0 ? (
                        <option value="" className="bg-slate-900 text-white">Sin períodos</option>
                      ) : (
                        filteredPeriods.map((m) => (
                          <option key={m} value={m} className="bg-slate-900 text-white">
                            {m}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Botón Nuevo Período */}
                  <button
                    type="button"
                    onClick={() => setIsNewPeriodModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow-md shadow-blue-600/20"
                    title="Crear un nuevo período / ejercicio contable"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Nuevo Período</span>
                  </button>
                </div>
              </div>

              {/* STATS STRIP */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5 sm:mt-2 truncate">Policlínica, CFL, CENS y Otros</p>
                </div>

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
                      placeholder="Buscar por médico, proveedor, factura o detalle..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                    <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <select
                      value={selectedRubro}
                      onChange={(e) => setSelectedRubro(e.target.value)}
                      className="w-full sm:w-auto bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 sm:py-2 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                    >
                      <option value="TODOS">Todos los Rubros</option>
                      <option value="PROVEEDOR">PROVEEDOR</option>
                      <option value="MÉDICO">MÉDICO</option>
                      <option value="INGRESOS">INGRESOS</option>
                      <option value="EMPLEADOS">EMPLEADOS</option>
                      <option value="IMPUESTO">IMPUESTO</option>
                      <option value="SEGUROS">SEGUROS</option>
                    </select>
                  </div>

                  <div className="flex-1 sm:flex-initial">
                    <select
                      value={selectedSede}
                      onChange={(e) => setSelectedSede(e.target.value)}
                      className="w-full sm:w-auto bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 sm:py-2 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                    >
                      <option value="TODAS">Todas las Sedes</option>
                      {(maestros.sedes || []).map((s) => (
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
                        <th className="py-3 px-3">Sede</th>
                        <th className="py-3 px-3">Detalle / Concepto</th>
                        <th className="py-3 px-3">Fecha Pago / Ref.</th>
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
                          <td colSpan={12} className="py-12 text-center text-slate-500">
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
                              onClick={() => handleOpenEditModal(m)}
                              className="hover:bg-blue-600/10 active:bg-blue-600/20 transition cursor-pointer group"
                              title="Haz clic para modificar, registrar pago, anular o eliminar este movimiento"
                            >
                              <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap group-hover:text-blue-300">{m.fecha}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                                {m.facturaNro || '-'}
                              </td>
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
                              <td className="py-2.5 px-3 text-slate-200 font-semibold max-w-[200px] truncate">
                                {m.empresaConcepto}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                {m.realizadoEn ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                    <Building2 className="w-3 h-3 text-blue-400" />
                                    {m.realizadoEn}
                                  </span>
                                ) : (
                                  <span className="text-slate-600 text-xs">-</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-400 max-w-[200px]">
                                <div className="font-medium text-slate-300 truncate">{m.detalle || '-'}</div>
                                {m.detalleExtenso && (
                                  <div className="text-[11px] text-slate-400/90 italic truncate" title={m.detalleExtenso}>
                                    📝 {m.detalleExtenso}
                                  </div>
                                )}
                              </td>
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
                              <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                                {m.pagosS > 0 ? fmtMoney(m.pagosS) : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-indigo-300">
                                {m.pagosMed > 0 ? fmtMoney(m.pagosMed) : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-amber-400/90">
                                {m.retencionesMed > 0 ? fmtMoney(m.retencionesMed) : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-400">
                                {m.netoPagadoMed > 0 ? fmtMoney(m.netoPagadoMed) : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                                {isIngreso ? fmtMoney(m.total || 0) : '-'}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

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
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-400/90 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Ingresos Totales
                      </span>
                      <h3 className="text-2xl font-black text-white mt-1 font-mono">{fmtMoney(stats.totalIngresos)}</h3>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Período: <strong className="text-slate-200">{selectedMes}</strong></span>
                    <span className="text-emerald-400 font-semibold">Cobros Registrados</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-rose-500/40 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-bold text-rose-400/90 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5" />
                        Egresos Operativos
                      </span>
                      <h3 className="text-2xl font-black text-white mt-1 font-mono">{fmtMoney(stats.totalEgresosTotal)}</h3>
                    </div>
                    <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400 group-hover:scale-110 transition">
                      <ArrowDownRight className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Proveedores + Sueldos</span>
                    <span className="text-rose-400 font-semibold">{fmtMoney(stats.totalEgresosS)}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-indigo-500/40 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-bold text-indigo-400/90 uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" />
                        Neto Honorarios
                      </span>
                      <h3 className="text-2xl font-black text-indigo-300 mt-1 font-mono">{fmtMoney(stats.totalNetoMed)}</h3>
                    </div>
                    <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition">
                      <Receipt className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Retenciones aplicadas:</span>
                    <strong className="text-amber-400 font-mono">{fmtMoney(stats.totalRetencionesMed)}</strong>
                  </div>
                </div>

                <div className={`bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border rounded-2xl p-5 shadow-xl relative overflow-hidden group transition ${
                  stats.saldoNeto >= 0 ? 'border-blue-500/30 hover:border-blue-400' : 'border-amber-500/30 hover:border-amber-400'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        stats.saldoNeto >= 0 ? 'text-blue-400' : 'text-amber-400'
                      }`}>
                        <Scale className="w-3.5 h-3.5" />
                        {stats.saldoNeto >= 0 ? 'Superávit Financiero' : 'Déficit del Período'}
                      </span>
                      <h3 className={`text-2xl font-black mt-1 font-mono ${
                        stats.saldoNeto >= 0 ? 'text-blue-300' : 'text-amber-300'
                      }`}>
                        {fmtMoney(stats.saldoNeto)}
                      </h3>
                    </div>
                    <div className={`p-3 rounded-xl border group-hover:scale-110 transition ${
                      stats.saldoNeto >= 0 ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Margen Operativo:</span>
                    <strong className={stats.saldoNeto >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {stats.totalIngresos > 0 ? `${((stats.saldoNeto / stats.totalIngresos) * 100).toFixed(1)}%` : '0%'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Central Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                        Evolución Histórica de Ingresos y Egresos
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tendencia consolidada mes a mes del flujo de caja
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        Ingresos
                      </span>
                      <span className="flex items-center gap-1.5 text-rose-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        Egresos
                      </span>
                    </div>
                  </div>

                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={evolucionMensualData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorIng" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="colorEgr" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="mes" stroke="#64748b" textAnchor="end" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                        <Tooltip
                          formatter={(val) => fmtMoney(val)}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                        />
                        <Area type="monotone" dataKey="Ingresos" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIng)" />
                        <Area type="monotone" dataKey="Egresos" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEgr)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                  <div className="pb-4 border-b border-slate-800">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-indigo-400" />
                      Egresos por Rubro
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">Composición del gasto en {selectedMes}</p>
                  </div>

                  <div className="h-64 w-full my-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={egresosPorRubroData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="valor"
                        >
                          {egresosPorRubroData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val) => fmtMoney(val)}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs">
                    {egresosPorRubroData.slice(0, 4).map((r, i) => {
                      const pct = stats.totalEgresosTotal > 0 ? ((r.valor / stats.totalEgresosTotal) * 100).toFixed(1) : 0
                      return (
                        <div key={r.name} className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-slate-300 truncate">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                            {r.name}
                          </span>
                          <span className="font-mono text-slate-400 font-semibold">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Gastos por Sede & Top 5 Mayores Desembolsos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-amber-400" />
                        Distribución del Gasto por Sede
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Asignación de costos por establecimiento en {selectedMes}</p>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gastosPorSedeData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                        <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(val) => fmtMoney(val)}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                        />
                        <Bar dataKey="total" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                          Mayores Desembolsos del Período
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Top 5 proveedores y profesionales en {selectedMes}</p>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-800/70">
                      {topEntidadesGasto.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500">Sin movimientos registrados en este período.</div>
                      ) : (
                        topEntidadesGasto.map((ent, idx) => (
                          <div key={ent.nombre} className="py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 pr-4">
                              <span className="w-6 h-6 rounded-lg bg-slate-950 text-blue-400 border border-slate-800 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">{ent.nombre}</p>
                                <span className="text-[10px] text-slate-400 font-medium">{ent.rubro}</span>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-rose-400 shrink-0">
                              {fmtMoney(ent.total)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                    <span>Cuentas con mayor impacto financiero</span>
                    <button
                      onClick={() => setActiveTab('cuentacorriente')}
                      className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      Ver Extractos <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                <div className="flex flex-wrap items-center gap-3">
                  {/* Quick Payment Status Filter Pills */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setMedicosPagoFilter('TODOS')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                        medicosPagoFilter === 'TODOS'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      Todos ({medicosCounts.total})
                    </button>
                    <button
                      onClick={() => setMedicosPagoFilter('PENDIENTES')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                        medicosPagoFilter === 'PENDIENTES'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      Pendientes ({medicosCounts.pendientes})
                    </button>
                    <button
                      onClick={() => setMedicosPagoFilter('PAGADOS')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                        medicosPagoFilter === 'PAGADOS'
                          ? 'bg-emerald-600 text-white'
                          : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Pagados ({medicosCounts.pagados})
                    </button>
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
                        <th className="py-2.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>Fecha Pago / Referencia</span>
                            <select
                              value={medicosPagoFilter}
                              onChange={(e) => setMedicosPagoFilter(e.target.value)}
                              className="bg-slate-900 text-[11px] font-semibold text-slate-200 border border-slate-700/80 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer shadow-inner normal-case tracking-normal"
                              title="Filtrar por estado de pago"
                            >
                              <option value="TODOS">Todos ({medicosCounts.total})</option>
                              <option value="PENDIENTES">⏳ Solo Pendientes ({medicosCounts.pendientes})</option>
                              <option value="PAGADOS">✓ Solo Pagados ({medicosCounts.pagados})</option>
                            </select>
                          </div>
                        </th>
                        <th className="py-3 px-4 text-right">Bruto</th>
                        <th className="py-3 px-4 text-right">Retención</th>
                        <th className="py-3 px-4 text-right">Neto Liquidado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {medicosData.map((m, i) => (
                        <tr
                          key={m.id || i}
                          onClick={() => handleOpenEditModal(m)}
                          className="hover:bg-blue-600/10 active:bg-blue-600/20 transition cursor-pointer group"
                          title="Haz clic para modificar, registrar pago, anular o eliminar este movimiento"
                        >
                          <td className="py-3 px-4 text-slate-300 whitespace-nowrap group-hover:text-blue-300 transition">{m.fecha}</td>
                          <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">{m.facturaNro || '-'}</td>
                          <td className="py-3 px-4 text-white font-bold whitespace-nowrap">{m.empresaConcepto}</td>
                          <td className="py-3 px-4 text-slate-400 max-w-[200px] truncate">{m.detalle || '-'}</td>
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

          {/* TAB 5: TABLAS MAESTRAS (CRUD COMPLETO CON NUEVA TABLA) */}
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
                      Agrega, modifica o elimina proveedores, conceptos de gastos, honorarios, ingresos, médicos y sedes. Ordenados alfabéticamente.
                    </p>
                  </div>

                  {/* Create New Category / Table Button */}
                  <button
                    type="button"
                    onClick={() => setIsNewCategoryModalOpen(true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition cursor-pointer self-start md:self-auto shrink-0"
                  >
                    <FolderPlus className="w-4 h-4 text-blue-400" />
                    <span>+ Nueva Tabla / Catálogo</span>
                  </button>
                </div>

                {/* Catalog Category Selector Tabs */}
                <div className="pt-4 flex flex-wrap gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold overflow-x-auto">
                  {Object.keys(maestros).map((catKey) => {
                    const label = catalogLabels[catKey] || catKey.replace(/_/g, ' ')
                    const count = Array.isArray(maestros[catKey]) ? maestros[catKey].length : 0
                    const isActive = activeCatalogTab === catKey

                    return (
                      <button
                        key={catKey}
                        onClick={() => {
                          setActiveCatalogTab(catKey)
                          setEditingItem(null)
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {catKey === 'proveedores' && <Briefcase className="w-3.5 h-3.5" />}
                        {catKey === 'medicos' && <UserCheck className="w-3.5 h-3.5" />}
                        {catKey === 'empleados' && <Users className="w-3.5 h-3.5" />}
                        {catKey === 'conceptosGastos' && <Receipt className="w-3.5 h-3.5" />}
                        {catKey === 'conceptosHonorarios' && <Calendar className="w-3.5 h-3.5" />}
                        {catKey === 'ingresosTipos' && <TrendingUp className="w-3.5 h-3.5" />}
                        {catKey === 'sedes' && <Building2 className="w-3.5 h-3.5" />}
                        {catKey === 'impuestos' && <Scale className="w-3.5 h-3.5" />}
                        <span>{label}</span>
                        <span className="text-[10px] px-1 py-0.2 bg-slate-800/80 rounded font-mono">
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Form to Add New Item + Search Filter */}
                <div className="pt-4 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
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
                      placeholder={`Nuevo ítem para ${catalogLabels[activeCatalogTab] || activeCatalogTab}...`}
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

                  <div className="md:col-span-5 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 sm:top-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={`Filtrar en ${catalogLabels[activeCatalogTab] || activeCatalogTab}...`}
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 sm:py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Items List Table with Edit and Delete */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-3.5 sm:p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider">
                    Listado de {catalogLabels[activeCatalogTab] || activeCatalogTab} (Orden Alfabético)
                  </span>
                  <span className="text-slate-400 font-mono">
                    Total: {maestros[activeCatalogTab]?.length || 0} registros
                  </span>
                </div>

                <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
                  {sortAlphabetical(maestros[activeCatalogTab] || [])
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
                          key={item + index}
                          className="px-3.5 sm:px-5 py-3 flex items-center justify-between hover:bg-slate-800/40 transition group"
                        >
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
          {/* TAB 6: GESTIÓN DE CHEQUES */}
          {activeTab === 'cheques' && (
            <div className="space-y-4 md:space-y-6 animate-in fade-in duration-150">
              {/* HEADER & METRICS CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400 font-medium truncate">Total Cheques</p>
                    <p className="text-lg sm:text-xl font-black text-white font-mono">{chequeAlerts.all.length}</p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-3.5 sm:p-4 shadow-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-rose-300 font-medium truncate">Cheques Vencidos</p>
                    <p className="text-lg sm:text-xl font-black text-rose-400 font-mono">{chequeAlerts.vencidosCount}</p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 shadow-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-amber-300 font-medium truncate">Vencen Hoy / 7 Días</p>
                    <p className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                      {chequeAlerts.hoyCount + chequeAlerts.porVencerCount}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 shadow-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400 font-medium truncate">Monto en Cartera</p>
                    <p className="text-sm sm:text-base font-black text-emerald-400 font-mono truncate">
                      {fmtMoney(chequeAlerts.all.reduce((acc, c) => acc + c.importe, 0))}
                    </p>
                  </div>
                </div>
              </div>

              {/* FILTERS & SEARCH BAR & ACTIONS */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg space-y-3 print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 min-w-[240px] relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar por titular, banco, Nº de cheque o referencia..."
                      value={chequeSearchTerm}
                      onChange={(e) => setChequeSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Filtro Estado */}
                    <select
                      value={chequeFilterEstado}
                      onChange={(e) => setChequeFilterEstado(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                    >
                      <option value="TODOS">Todos los Estados</option>
                      <option value="VENCIDO">🚨 Vencidos ({chequeAlerts.vencidosCount})</option>
                      <option value="HOY">⚡ Vence Hoy ({chequeAlerts.hoyCount})</option>
                      <option value="POR_VENCER">⏳ Próximos 7 días ({chequeAlerts.porVencerCount})</option>
                      <option value="PENDIENTES">⏳ Sin Pagar (Pendientes)</option>
                      <option value="PAGADOS">✓ Pagados</option>
                    </select>

                    {/* Filtro Tipo: Propio vs Tercero */}
                    <select
                      value={chequeFilterTipo}
                      onChange={(e) => setChequeFilterTipo(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                    >
                      <option value="TODOS">Todos los Tipos</option>
                      <option value="PROPIO">Cheque Propio</option>
                      <option value="TERCERO">Cheque de Tercero</option>
                    </select>

                    {/* Filtro Formato: Físico vs Echeq */}
                    <select
                      value={chequeFilterFormato}
                      onChange={(e) => setChequeFilterFormato(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                    >
                      <option value="TODOS">Todos los Formatos</option>
                      <option value="ECHEQ">E-Cheq (Electrónico)</option>
                      <option value="FISICO">Papel / Físico</option>
                    </select>

                    {/* Filtro Mes/Período */}
                    <select
                      value={chequeFilterMes}
                      onChange={(e) => setChequeFilterMes(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                    >
                      <option value="TODOS">Todos los Períodos</option>
                      <option value="ACTIVO">Solo Período Activo ({selectedMes})</option>
                      {meses.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>

                    {/* Botón Exportar a Excel */}
                    <button
                      type="button"
                      onClick={() => exportChequesToExcel(filteredCheques)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition cursor-pointer"
                      title="Descargar listado de cheques filtrados en Excel (CSV)"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Descargar Excel</span>
                    </button>

                    {/* Botón Imprimir */}
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                      title="Imprimir listado completo de cheques"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-400" />
                      <span>Imprimir</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* PRINT HEADER FOR CHEQUES */}
              <div className="hidden print:block mb-4 p-2 border-b-2 border-slate-900">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-xl font-black uppercase text-slate-950">
                      Reporte de Gestión y Cartera de Cheques
                    </h1>
                    <p className="text-xs text-slate-700">
                      Gremio / Policlínica AMOS • Período: {selectedMes} • Fecha de emisión: {getTodayLocalDate()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-950">Total Registros: {filteredCheques.length}</p>
                    <p className="text-xs font-black font-mono text-slate-950">
                      Suma Total: {fmtMoney(filteredCheques.reduce((a, b) => a + b.importe, 0))}
                    </p>
                  </div>
                </div>
              </div>

              {/* TABLE OF CHEQUES */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden print:border-none print:shadow-none print:bg-transparent">
                <div className="overflow-x-auto max-h-[600px] print:max-h-none overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs print:text-[10px]">
                    <thead className="bg-slate-950/80 print:bg-slate-100 sticky top-0 z-10 text-[11px] print:text-[10px] text-slate-400 print:text-slate-900 uppercase tracking-wider font-semibold border-b border-slate-800 print:border-slate-900">
                      <tr>
                        <th className="py-3 px-4 print:py-1.5 print:px-2">Estado / Vencimiento</th>
                        <th className="py-3 px-3 print:py-1.5 print:px-2">Tipo / Formato</th>
                        <th className="py-3 px-3 print:py-1.5 print:px-2">Titular / Beneficiario</th>
                        <th className="py-3 px-4 print:py-1.5 print:px-2">Detalle / Referencia Bancaria</th>
                        <th className="py-3 px-3 print:py-1.5 print:px-2">Emisión</th>
                        <th className="py-3 px-4 print:py-1.5 print:px-2 text-right">Importe</th>
                        <th className="py-3 px-3 print:py-1.5 print:px-2 text-center print:hidden">Gestión</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 print:divide-slate-300 font-medium">
                      {filteredCheques.map((item) => {
                          const isPagado = item.isPagado || item.status === 'PAGADO'
                          const isVencido = !isPagado && item.status === 'VENCIDO'
                          const isHoy = !isPagado && item.status === 'HOY'
                          const isPorVencer = !isPagado && item.status === 'POR_VENCER'

                          return (
                            <tr
                              key={item.id}
                              onClick={() => handleOpenEditModal(item.movimiento)}
                              className="hover:bg-blue-600/10 active:bg-blue-600/20 transition cursor-pointer group"
                              title="Haz clic para ver o editar la información completa del cheque"
                            >
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold border w-fit ${
                                      isPagado
                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-semibold'
                                        : isVencido
                                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                                        : isHoy
                                        ? 'bg-red-500 text-white font-extrabold border-red-400 animate-pulse'
                                        : isPorVencer
                                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                    }`}
                                  >
                                    {isPagado && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                                    {isVencido && <AlertTriangle className="w-2.5 h-2.5" />}
                                    {isHoy && <Zap className="w-2.5 h-2.5" />}
                                    {isPorVencer && <Clock className="w-2.5 h-2.5" />}
                                    <span>{item.label}</span>
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Cobro: {item.fechaCobro}
                                  </span>
                                </div>
                              </td>

                              <td className="py-3 px-3 whitespace-nowrap">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                      item.tipo === 'Propio'
                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                        : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                    }`}
                                  >
                                    {item.tipo}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                      item.formato === 'E-Cheq'
                                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    }`}
                                  >
                                    {item.formato}
                                  </span>
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-200 group-hover:text-blue-300 transition">
                                  {item.entidad}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {item.rubro} • {item.movimiento.mesPeriodo || 'Sin mes'}
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <div className="text-slate-300 font-mono text-xs font-semibold">
                                  {item.chequeRef}
                                </div>
                                {item.movimiento.detalle && (
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    {item.movimiento.detalle}
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                                {item.movimiento.fecha}
                              </td>

                              <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap text-sm">
                                {fmtMoney(item.importe)}
                              </td>

                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    item.isPagado
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  }`}
                                >
                                  {item.isPagado ? '✓ Pagado' : '⏳ Pendiente'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}

                      {chequeAlerts.all.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-16 text-center text-slate-500">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            No hay cheques registrados en el sistema actualmente.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
                  {editingId ? <Edit2 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base text-white truncate">
                      {editingId ? (
                        modalType === 'MEDICO'
                          ? 'Modificar Honorario Médico'
                          : modalType === 'INGRESO'
                          ? 'Modificar Ingreso'
                          : 'Modificar Comprobante / Gasto'
                      ) : (
                        modalType === 'EGRESO' && 'Cargar Egreso / Factura'
                      )}
                      {!editingId && modalType === 'MEDICO' && 'Cargar Honorario Médico'}
                      {!editingId && modalType === 'INGRESO' && 'Cargar Ingreso (CFL, CENS, Billeteras, Policlínica)'}
                    </h3>
                    {editingId && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          formData.fechaPago
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {formData.fechaPago ? `✓ Pagado (${formData.fechaPago})` : '⏳ Pendiente de Pago'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {editingId ? `Editando registro existente` : `Período: ${selectedMes}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
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
                      duplicateVoucher
                        ? duplicateVoucher.matchType === 'EXACT'
                          ? 'border-rose-500 bg-rose-950/30 text-rose-200 focus:border-rose-400 font-semibold'
                          : 'border-amber-500/80 bg-amber-950/20 text-amber-200 focus:border-amber-400'
                        : 'border-slate-800 focus:border-blue-500'
                    }`}
                  />
                  {duplicateVoucher && (
                    <span
                      className={`text-[11px] font-semibold flex items-center gap-1 mt-1 ${
                        duplicateVoucher.matchType === 'EXACT' ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {duplicateVoucher.matchType === 'EXACT'
                        ? `¡Factura ya cargada para ${duplicateVoucher.empresaConcepto}!`
                        : `Existe comprobante Nº ${duplicateVoucher.facturaNro} cargado para ${duplicateVoucher.empresaConcepto}`}
                    </span>
                  )}
                </div>
              </div>

              {/* AVISO PROACTIVO DE COMPROBANTE EXISTENTE PARA NO CARGAR DE GUSTO */}
              {duplicateVoucher && (
                <div
                  className={`p-3.5 rounded-xl border space-y-2.5 animate-in fade-in zoom-in-95 duration-150 ${
                    duplicateVoucher.matchType === 'EXACT'
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                      : 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        {duplicateVoucher.matchType === 'EXACT'
                          ? '⚠️ COMPROBANTE YA EXISTENTE EN EL SISTEMA'
                          : 'ℹ️ Factura coincidente encontrada en otro registro'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                      Período: {duplicateVoucher.mesPeriodo || 'N/A'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Titular / Empresa:</span>
                      <strong className="text-white truncate block">{duplicateVoucher.empresaConcepto}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Fecha / Concepto:</span>
                      <span className="text-slate-300 block truncate">
                        {duplicateVoucher.fecha} {duplicateVoucher.detalle ? `(${duplicateVoucher.detalle})` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Importe / Estado:</span>
                      <span className="font-mono font-bold text-white block">
                        {fmtMoney(
                          duplicateVoucher.pagosS ||
                            duplicateVoucher.netoPagadoMed ||
                            duplicateVoucher.pagosMed ||
                            duplicateVoucher.total
                        )}
                        <span
                          className={`ml-1.5 text-[10px] font-normal ${
                            duplicateVoucher.fechaPago ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {duplicateVoucher.fechaPago ? '✓ Pagada' : '⏳ Pendiente'}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
                    <p className="text-[11px] text-slate-300">
                      Para evitar cargar los datos nuevamente, puedes abrir este comprobante directamente para modificarlo.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(duplicateVoucher)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Abrir Comprobante Existente
                    </button>
                  </div>
                </div>
              )}

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
                          {sortAlphabetical(maestros.medicos || [])
                            .filter((m) =>
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
                          {sortAlphabetical(
                            formData.rubro === 'EMPLEADOS'
                              ? maestros.empleados || []
                              : formData.rubro === 'IMPUESTO' || formData.rubro === 'SEGUROS'
                              ? maestros.impuestos || []
                              : maestros.proveedores || []
                          )
                            .filter((ent) =>
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
                    Concepto Principal de Ingreso <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.empresaConcepto}
                    onChange={(e) => handleInputChange('empresaConcepto', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                  >
                    <option value="">-- Seleccione concepto de ingreso --</option>
                    {sortAlphabetical(maestros.ingresosTipos || []).map((it) => (
                      <option key={it} value={it}>
                        {it}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sede y Detalle Desplegable con Palomita */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Sede / Ubicación
                  </label>
                  <select
                    value={formData.realizadoEn}
                    onChange={(e) => handleInputChange('realizadoEn', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                  >
                    {sortAlphabetical(maestros.sedes || []).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {modalType === 'MEDICO' ? 'Período / Detalle' : 'Concepto / Detalle'} <span className="text-rose-400">*</span>
                  </label>
                  
                  {/* Desplegable Palomita */}
                  <select
                    value={formData.detalle}
                    onChange={(e) => handleInputChange('detalle', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                  >
                    <option value="">-- Seleccione opción sugerida --</option>
                    {(modalType === 'MEDICO'
                      ? maestros.conceptosHonorarios || []
                      : maestros.conceptosGastos || []
                    ).map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <div className="mt-1.5">
                    <input
                      type="text"
                      placeholder={modalType === 'MEDICO' ? 'O escribe período específico (ej: Hon Ago 26)...' : 'O escribe detalle personalizado...'}
                      value={formData.detalle}
                      onChange={(e) => handleInputChange('detalle', e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
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
                  rows={2}
                  placeholder="Escribe aquí información adicional, número de remito, notas..."
                  value={formData.detalleExtenso}
                  onChange={(e) => handleInputChange('detalleExtenso', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
                ></textarea>
              </div>

              {/* Importes según el tipo */}
              {modalType === 'EGRESO' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Importe Pagado / Factura ($)</label>
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

              {/* MODAL INGRESO: CAMPOS SEPARADOS PARA CFL, CENS, BILLETERAS, POLICLÍNICA */}
              {modalType === 'INGRESO' && (
                <div className="bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Desglose de Ingresos por Origen ($)
                    </p>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      Total: {fmtMoney(
                        Number(formData.ingresosCFL || 0) +
                        Number(formData.ingresosCENS || 0) +
                        Number(formData.ingresosBilleteras || 0) +
                        Number(formData.alquiConsultorios || 0) +
                        Number(formData.alquilerCpoSalon || 0) +
                        Number(formData.ventaCantina || 0) +
                        Number(formData.usoNatatorio || 0) +
                        Number(formData.practicas || 0) +
                        Number(formData.consultas || 0) +
                        Number(formData.enfermeria || 0) +
                        Number(formData.odontologia || 0) +
                        Number(formData.otIngresos || 0) +
                        Number(formData.compensaciones || 0)
                      )}
                    </span>
                  </div>

                  {/* Bloque Institucional & Cobros Digitales */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                    <div>
                      <label className="text-[11px] font-bold text-blue-400 block mb-1">
                        🏛️ Ingresos CFL
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.ingresosCFL}
                        onChange={(e) => handleInputChange('ingresosCFL', e.target.value)}
                        className="w-full bg-slate-950 border border-blue-500/40 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-indigo-400 block mb-1">
                        🎓 Ingresos CENS
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.ingresosCENS}
                        onChange={(e) => handleInputChange('ingresosCENS', e.target.value)}
                        className="w-full bg-slate-950 border border-indigo-500/40 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-emerald-400 block mb-1">
                        📱 Billeteras (Loc. Consultorios)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.ingresosBilleteras}
                        onChange={(e) => handleInputChange('ingresosBilleteras', e.target.value)}
                        className="w-full bg-slate-950 border border-emerald-500/40 rounded px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Resto de Rubros */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Alquiler Consultorios (Otros)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.alquiConsultorios}
                        onChange={(e) => handleInputChange('alquiConsultorios', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Alquiler Salón / Campo</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.alquilerCpoSalon}
                        onChange={(e) => handleInputChange('alquilerCpoSalon', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Venta Cantina</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.ventaCantina}
                        onChange={(e) => handleInputChange('ventaCantina', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Uso Natatorio</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.usoNatatorio}
                        onChange={(e) => handleInputChange('usoNatatorio', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Consultas</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.consultas}
                        onChange={(e) => handleInputChange('consultas', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Prácticas</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.practicas}
                        onChange={(e) => handleInputChange('practicas', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Odontología</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.odontologia}
                        onChange={(e) => handleInputChange('odontologia', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Enfermería</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.enfermeria}
                        onChange={(e) => handleInputChange('enfermeria', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Otros Ingresos / Comp.</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.otIngresos}
                        onChange={(e) => handleInputChange('otIngresos', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pago / Cheque / Medio de Pago */}
              <div className="bg-slate-950/70 p-3.5 sm:p-4 rounded-xl border border-slate-800/90 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Estado y Medio de Pago
                    </span>
                    {formData.fechaPago ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {formData.fechaPago === getTodayLocalDate() ? '✓ Pagado Hoy' : `✓ Pagado (${formData.fechaPago})`}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        ⏳ Pendiente de Pago
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        handleInputChange('fechaPago', getTodayLocalDate())
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                        formData.fechaPago === getTodayLocalDate()
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      Pagado Hoy
                    </button>
                    {formData.fechaPago && (
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange('fechaPago', '')
                          handleInputChange('chequeOperacion', '')
                        }}
                        className="px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition cursor-pointer flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        Dejar Pendiente
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-[11px] font-medium block mb-1">
                      {formData.fechaPago === getTodayLocalDate() ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Fecha de Pago (Cargada Automáticamente: Hoy)
                        </span>
                      ) : formData.fechaPago ? (
                        <span className="text-emerald-400 font-semibold">
                          Fecha de Pago
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          Fecha de Pago (Opcional)
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={formData.fechaPago}
                      onChange={(e) => handleInputChange('fechaPago', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      Medio / Instrumento de Pago
                    </label>
                    <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                      {[
                        { id: 'TRANSFERENCIA', label: 'Transf.', icon: Landmark },
                        { id: 'CHEQUE', label: 'Cheque', icon: FileText },
                        { id: 'EFECTIVO', label: 'Efectivo', icon: Wallet },
                        { id: 'DEBITO', label: 'Débito', icon: CreditCard }
                      ].map((m) => {
                        const Icon = m.icon
                        const isSelected = formData.medioPagoTipo === m.id
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleInputChange('medioPagoTipo', m.id)}
                            className={`flex items-center justify-center gap-1 py-1.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{m.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Sub-formulario detallado cuando se elige CHEQUE */}
                {formData.medioPagoTipo === 'CHEQUE' && (
                  <div className="bg-slate-900/90 border border-blue-500/30 rounded-xl p-3 sm:p-3.5 space-y-3 shadow-inner">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold">
                        <FileText className="w-4 h-4" />
                        <span>Detalles del Cheque</span>
                      </div>
                      
                      {/* Tipo de Cheque: Propio vs Tercero */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Tipo:</span>
                        <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleInputChange('chequeTipo', 'PROPIO')}
                            className={`px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                              formData.chequeTipo === 'PROPIO'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Propio
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInputChange('chequeTipo', 'TERCERO')}
                            className={`px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                              formData.chequeTipo === 'TERCERO'
                                ? 'bg-purple-600 text-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            De Tercero
                          </button>
                        </div>

                        {/* Formato: Físico vs E-Cheq */}
                        <span className="text-[11px] text-slate-400 ml-1">Formato:</span>
                        <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleInputChange('chequeFormato', 'FISICO')}
                            className={`px-2 py-0.5 rounded font-semibold transition cursor-pointer flex items-center gap-1 ${
                              formData.chequeFormato === 'FISICO'
                                ? 'bg-emerald-600 text-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <FileText className="w-2.5 h-2.5" />
                            Papel / Físico
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInputChange('chequeFormato', 'ECHEQ')}
                            className={`px-2 py-0.5 rounded font-semibold transition cursor-pointer flex items-center gap-1 ${
                              formData.chequeFormato === 'ECHEQ'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Zap className="w-2.5 h-2.5" />
                            E-Cheq (Electrónico)
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                          Nº de Cheque
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: 00482910"
                          value={formData.chequeNumero}
                          onChange={(e) => handleInputChange('chequeNumero', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="relative">
                        <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                          Banco Emisor / Cuenta
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Buscar banco (ej: Galicia, Nación, BBVA)..."
                            value={formData.chequeBanco}
                            onFocus={() => {
                              setIsBankDropdownOpen(true)
                              setBankSearchFilter(formData.chequeBanco || '')
                            }}
                            onChange={(e) => {
                              handleInputChange('chequeBanco', e.target.value)
                              setBankSearchFilter(e.target.value)
                              setIsBankDropdownOpen(true)
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 pr-14"
                          />
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                            {formData.chequeBanco && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleInputChange('chequeBanco', '')
                                  setBankSearchFilter('')
                                }}
                                className="p-1 hover:text-slate-200 text-slate-500 rounded"
                                title="Limpiar selección"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                              className="p-1 text-slate-400 hover:text-slate-200 rounded"
                            >
                              <ChevronDown className={`w-3 h-3 transition-transform ${isBankDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {/* Searchable Dropdown List */}
                        {isBankDropdownOpen && (
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            <div className="p-1.5 border-b border-slate-800 bg-slate-950/80 flex items-center gap-1.5">
                              <Search className="w-3 h-3 text-slate-400 shrink-0" />
                              <input
                                type="text"
                                autoFocus
                                placeholder="Filtrar entre todos los bancos..."
                                value={bankSearchFilter}
                                onChange={(e) => setBankSearchFilter(e.target.value)}
                                className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                              />
                              {bankSearchFilter && (
                                <button
                                  type="button"
                                  onClick={() => setBankSearchFilter('')}
                                  className="text-slate-500 hover:text-slate-300 text-[10px]"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/40 custom-scrollbar">
                              {BANCOS_ARGENTINA.filter((b) =>
                                b.toLowerCase().includes((bankSearchFilter || '').toLowerCase().trim())
                              ).map((banco) => (
                                <button
                                  key={banco}
                                  type="button"
                                  onClick={() => {
                                    handleInputChange('chequeBanco', banco)
                                    setIsBankDropdownOpen(false)
                                    setBankSearchFilter('')
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 text-xs transition flex items-center justify-between cursor-pointer ${
                                    formData.chequeBanco === banco
                                      ? 'bg-blue-600/30 text-blue-300 font-semibold'
                                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                                  }`}
                                >
                                  <span className="truncate">{banco}</span>
                                  {formData.chequeBanco === banco && (
                                    <Check className="w-3 h-3 text-blue-400 shrink-0 ml-1" />
                                  )}
                                </button>
                              ))}
                              {BANCOS_ARGENTINA.filter((b) =>
                                b.toLowerCase().includes((bankSearchFilter || '').toLowerCase().trim())
                              ).length === 0 && (
                                <div className="px-3 py-3 text-center text-xs text-slate-500">
                                  <span>No se encontró ningún banco oficial con ese nombre.</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleInputChange('chequeBanco', bankSearchFilter)
                                      setIsBankDropdownOpen(false)
                                    }}
                                    className="block mx-auto mt-1 text-[11px] text-blue-400 hover:underline cursor-pointer"
                                  >
                                    Usar "{bankSearchFilter}" como banco personalizado
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                          Fecha Cobro / Vencimiento
                        </label>
                        <input
                          type="date"
                          value={formData.chequeFechaCobro}
                          onChange={(e) => handleInputChange('chequeFechaCobro', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {formData.chequeTipo === 'TERCERO' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                            Librador / Titular del Cheque (Tercero)
                          </label>
                          <input
                            type="text"
                            placeholder="Nombre / Razón Social del emisor original"
                            value={formData.chequeEmisor}
                            onChange={(e) => handleInputChange('chequeEmisor', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                            CUIT Librador
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: 30-71234567-9"
                            value={formData.chequeCuit}
                            onChange={(e) => handleInputChange('chequeCuit', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.chequeCruzado}
                          onChange={(e) => handleInputChange('chequeCruzado', e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                        />
                        <span>Cruzado</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.chequeNoALaOrden}
                          onChange={(e) => handleInputChange('chequeNoALaOrden', e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                        />
                        <span>No a la orden</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Campo de Referencia / Transferencia / OP para cuando no es Cheque o como complemento */}
                {formData.medioPagoTipo !== 'CHEQUE' && (
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      Referencia / Nº de Transf. / OP {formData.fechaPago ? '' : '(Opcional)'}
                    </label>
                    <input
                      type="text"
                      placeholder="Nº de Transferencia, comprobante bancario, OP, etc..."
                      value={formData.chequeOperacion}
                      onChange={(e) => handleInputChange('chequeOperacion', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Submit / Action Buttons */}
              <div className="pt-3 sm:pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                {editingId ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDeleteMovement}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                      title="Eliminar definitivamente este registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAnularMovement}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition cursor-pointer"
                      title="Anular comprobante dejando importes en $0"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Anular</span>
                    </button>
                  </div>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-3.5 sm:px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 sm:px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition cursor-pointer font-medium"
                  >
                    {editingId ? 'Guardar Cambios' : 'Guardar Movimiento'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR NUEVA CATEGORÍA / TABLA MAESTRA */}
      {isNewCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Crear Nueva Tabla / Catálogo</h3>
                  <p className="text-xs text-slate-400">Habilita una nueva categoría de maestros</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewCategoryModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Nombre de la Tabla o Catálogo
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej: Insumos de Farmacia, Convenios, Bancos..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Crear Tabla</span>
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
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
                <div className="flex flex-wrap gap-2">
                  {['2025', '2026', '2027', '2028', '2029', '2030'].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setNewPeriodYear(yr)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        newPeriodYear === yr
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
                <div className="mt-2.5">
                  <input
                    type="number"
                    min="2020"
                    max="2050"
                    placeholder="O escribe otro año específico (ej: 2031, 2032...)"
                    value={newPeriodYear}
                    onChange={(e) => setNewPeriodYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Nombre del Período:</span>
                <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
                  {newPeriodMonth} {newPeriodYear.slice(-2)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewPeriodModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
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
