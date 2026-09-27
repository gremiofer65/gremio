import React, { useState, useMemo } from 'react'
import {
  FileText,
  Printer,
  CheckCircle2,
  AlertCircle,
  X,
  PlusCircle,
  Trash2,
  Building2,
  DollarSign,
  CreditCard,
  Search,
  Calendar,
  Layers,
  Receipt
} from 'lucide-react'

export default function OrdenesPagoModal({
  isOpen = false,
  onClose = () => {},
  movimientos = [],
  maestros = {},
  maestrosCuit = {},
  selectedMes = '',
  initialBeneficiario = '',
  onEmitirOP = async () => {},
  fmtMoney = (n) => `$ ${Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
  BANCOS_ARGENTINA = []
}) {
  const [beneficiario, setBeneficiario] = useState(initialBeneficiario || '')
  const [beneficiarioSearch, setBeneficiarioSearch] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const [opNumero, setOpNumero] = useState(() => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    return `OP-${new Date().getFullYear()}-${randomSuffix}`
  })
  const [opFecha, setOpFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [opObservaciones, setOpObservaciones] = useState('')

  // Comprobantes seleccionados para pagar (Set de IDs)
  const [selectedMovIds, setSelectedMovIds] = useState([])

  // Retenciones
  const [retencionGanancias, setRetencionGanancias] = useState(0)
  const [retencionIIBB, setRetencionIIBB] = useState(0)
  const [retencionSUSS, setRetencionSUSS] = useState(0)
  const [otrasRetenciones, setOtrasRetenciones] = useState(0)

  // Medios de Pago entregados
  const [pagosEfectivo, setPagosEfectivo] = useState(0)
  const [pagosTransferencia, setPagosTransferencia] = useState({
    banco: 'Banco Provincia',
    referencia: '',
    monto: 0
  })
  const [pagosCheque, setPagosCheque] = useState({
    tipo: 'PROPIO', // 'PROPIO' | 'TERCERO'
    formato: 'ECHEQ', // 'ECHEQ' | 'FISICO'
    numero: '',
    banco: 'Banco Provincia',
    fechaCobro: new Date().toISOString().slice(0, 10),
    monto: 0
  })

  // Vista Previa de Impresión
  const [showPrintPreview, setShowPrintPreview] = useState(false)

  // Lista de todos los beneficiarios posibles (médicos + proveedores + empleados)
  const allBeneficiarios = useMemo(() => {
    const list = [
      ...(maestros.medicos || []),
      ...(maestros.proveedores || []),
      ...(maestros.empleados || [])
    ]
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, 'es'))
  }, [maestros])

  // Comprobantes pendientes del beneficiario seleccionado
  const facturasPendientes = useMemo(() => {
    if (!beneficiario) return []
    return movimientos.filter((m) => {
      const isEntity = (m.empresaConcepto || '').trim().toLowerCase() === beneficiario.trim().toLowerCase()
      const isPending = !m.fechaPago
      const isEgreso = m.rubro !== 'INGRESOS' && (m.pagosS > 0 || m.netoPagadoMed > 0 || m.pagosMed > 0 || m.total > 0)
      return isEntity && isPending && isEgreso
    })
  }, [movimientos, beneficiario])

  // Cálculos
  const totalFacturasSeleccionadas = useMemo(() => {
    return facturasPendientes
      .filter((m) => selectedMovIds.includes(m.id))
      .reduce((sum, m) => sum + Number(m.pagosS || m.netoPagadoMed || m.pagosMed || m.total || 0), 0)
  }, [facturasPendientes, selectedMovIds])

  const totalRetenciones = useMemo(() => {
    return (
      Number(retencionGanancias || 0) +
      Number(retencionIIBB || 0) +
      Number(retencionSUSS || 0) +
      Number(otrasRetenciones || 0)
    )
  }, [retencionGanancias, retencionIIBB, retencionSUSS, otrasRetenciones])

  const netoAPagar = useMemo(() => {
    return Math.max(0, totalFacturasSeleccionadas - totalRetenciones)
  }, [totalFacturasSeleccionadas, totalRetenciones])

  const totalValoresEntregados = useMemo(() => {
    return (
      Number(pagosEfectivo || 0) +
      Number(pagosTransferencia.monto || 0) +
      Number(pagosCheque.monto || 0)
    )
  }, [pagosEfectivo, pagosTransferencia.monto, pagosCheque.monto])

  const diferenciaPago = useMemo(() => {
    return totalValoresEntregados - netoAPagar
  }, [totalValoresEntregados, netoAPagar])

  // Seleccionar todas las facturas
  const handleSelectAll = () => {
    if (selectedMovIds.length === facturasPendientes.length) {
      setSelectedMovIds([])
    } else {
      setSelectedMovIds(facturasPendientes.map((m) => m.id))
    }
  }

  const handleToggleSelectMov = (id) => {
    setSelectedMovIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // Auto-llenar monto de medio de pago con el neto restante
  const handleAutofillEfectivo = () => setPagosEfectivo(netoAPagar)
  const handleAutofillTransferencia = () => setPagosTransferencia((p) => ({ ...p, monto: netoAPagar }))
  const handleAutofillCheque = () => setPagosCheque((p) => ({ ...p, monto: netoAPagar }))

  // Confirmar y Guardar OP
  const handleConfirmarOP = async () => {
    if (!beneficiario) {
      alert('Debe seleccionar un beneficiario.')
      return
    }
    if (selectedMovIds.length === 0) {
      alert('Debe seleccionar al menos un comprobante para pagar.')
      return
    }
    if (totalValoresEntregados <= 0) {
      alert('Debe ingresar al menos un medio de pago entregado.')
      return
    }

    const opData = {
      id: `op-${Date.now()}`,
      numero: opNumero,
      fecha: opFecha,
      beneficiario,
      cuit: maestrosCuit[beneficiario] || '-',
      comprobantesIds: selectedMovIds,
      comprobantesDetalle: facturasPendientes.filter((m) => selectedMovIds.includes(m.id)),
      totalBruto: totalFacturasSeleccionadas,
      retenciones: {
        ganancias: Number(retencionGanancias || 0),
        iibb: Number(retencionIIBB || 0),
        suss: Number(retencionSUSS || 0),
        otras: Number(otrasRetenciones || 0),
        total: totalRetenciones
      },
      netoPagado: netoAPagar,
      mediosPago: {
        efectivo: Number(pagosEfectivo || 0),
        transferencia: pagosTransferencia,
        cheque: pagosCheque,
        totalEntregado: totalValoresEntregados
      },
      observaciones: opObservaciones,
      mesPeriodo: selectedMes
    }

    await onEmitirOP(opData)
    setShowPrintPreview(true)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Generar Orden de Pago (OP)</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-600/20 text-blue-300 border border-blue-500/30">
                  {opNumero}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cancelación de facturas con recibo formal, retenciones fiscales y detalle de valores
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* Fila 1: Beneficiario + Fecha + Nro OP */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative sm:col-span-1">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Beneficiario (Proveedor / Médico) <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen)
                  setBeneficiarioSearch('')
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-left flex items-center justify-between text-slate-200 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
              >
                <span className={beneficiario ? 'text-white font-semibold truncate' : 'text-slate-500 truncate'}>
                  {beneficiario || '-- Seleccionar Beneficiario --'}
                </span>
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in">
                  <div className="p-2 border-b border-slate-800 bg-slate-950">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Filtrar beneficiario..."
                      value={beneficiarioSearch}
                      onChange={(e) => setBeneficiarioSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto p-1 divide-y divide-slate-800/40">
                    {allBeneficiarios
                      .filter((b) =>
                        beneficiarioSearch === '' ||
                        b.toLowerCase().includes(beneficiarioSearch.toLowerCase())
                      )
                      .map((b) => (
                        <div
                          key={b}
                          onClick={() => {
                            setBeneficiario(b)
                            setSelectedMovIds([])
                            setIsDropdownOpen(false)
                          }}
                          className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer transition flex items-center justify-between ${
                            beneficiario === b
                              ? 'bg-blue-600 text-white font-bold'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{b}</span>
                          {maestrosCuit[b] && (
                            <span className="text-[10px] font-mono text-cyan-300 ml-1 shrink-0">
                              {maestrosCuit[b]}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Fecha Emisión OP</label>
              <input
                type="date"
                value={opFecha}
                onChange={(e) => setOpFecha(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Número de Orden de Pago</label>
              <input
                type="text"
                value={opNumero}
                onChange={(e) => setOpNumero(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-blue-300 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Fila 2: Comprobantes Pendientes de Pago con Checkboxes */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-blue-400" />
                Comprobantes / Facturas a Cancelar ({selectedMovIds.length} seleccionados)
              </span>
              {facturasPendientes.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] text-blue-400 hover:underline font-semibold cursor-pointer"
                >
                  {selectedMovIds.length === facturasPendientes.length
                    ? 'Desmarcar Todos'
                    : 'Seleccionar Todos'}
                </button>
              )}
            </div>

            {facturasPendientes.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                {beneficiario
                  ? 'No hay comprobantes pendientes de pago para este beneficiario.'
                  : 'Seleccione un beneficiario para visualizar sus facturas adeudadas.'}
              </p>
            ) : (
              <div className="divide-y divide-slate-800 max-h-44 overflow-y-auto">
                {facturasPendientes.map((m) => {
                  const importe = Number(m.pagosS || m.netoPagadoMed || m.pagosMed || m.total || 0)
                  const isChecked = selectedMovIds.includes(m.id)

                  return (
                    <div
                      key={m.id}
                      onClick={() => handleToggleSelectMov(m.id)}
                      className={`py-2 px-2.5 flex items-center justify-between text-xs rounded-lg cursor-pointer transition ${
                        isChecked ? 'bg-blue-600/15 text-white font-semibold' : 'text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span className="font-mono text-slate-400">{m.fecha}</span>
                        <span className="font-mono text-white font-bold">{m.facturaNro || 'S/N'}</span>
                        <span className="text-slate-400 truncate max-w-[200px]">{m.detalle || m.rubro}</span>
                      </div>
                      <span className="font-mono font-bold text-white shrink-0">{fmtMoney(importe)}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400 font-sans font-semibold">Subtotal Facturas Bruto:</span>
              <span className="text-sm font-bold text-white">{fmtMoney(totalFacturasSeleccionadas)}</span>
            </div>
          </div>

          {/* Fila 3: Retenciones Fiscales Practicadas */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <span className="text-xs font-bold text-slate-200 block">
              Retenciones Impositivas Practicadas (Certificados Oficiales)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[11px] text-slate-400 block mb-0.5">Ret. Ganancias (RG 830)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={retencionGanancias}
                  onChange={(e) => setRetencionGanancias(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-amber-300"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-0.5">Ret. IIBB / ARBA</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={retencionIIBB}
                  onChange={(e) => setRetencionIIBB(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-amber-300"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-0.5">Ret. SUSS / Seg. Social</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={retencionSUSS}
                  onChange={(e) => setRetencionSUSS(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-amber-300"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-0.5">Otras Retenciones</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={otrasRetenciones}
                  onChange={(e) => setOtrasRetenciones(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-amber-300"
                />
              </div>
            </div>
            <div className="pt-1.5 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400 font-sans font-semibold">Total Retenido:</span>
              <span className="font-bold text-amber-400">{fmtMoney(totalRetenciones)}</span>
            </div>
          </div>

          {/* Fila 4: Detalle de Medios de Pago Entregados */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200">
                Medios de Pago / Valores Entregados
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                Neto a Cancelar: {fmtMoney(netoAPagar)}
              </span>
            </div>

            {/* Efectivo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-semibold text-slate-300">1. Efectivo:</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={pagosEfectivo || ''}
                onChange={(e) => setPagosEfectivo(parseFloat(e.target.value) || 0)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-emerald-300"
              />
              <button
                type="button"
                onClick={handleAutofillEfectivo}
                className="text-[10px] text-blue-400 hover:underline font-semibold self-center sm:self-auto text-left sm:text-right"
              >
                Pagar todo en efectivo ({fmtMoney(netoAPagar)})
              </button>
            </div>

            {/* Transferencia */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-semibold text-slate-300">2. Transferencia:</span>
              <input
                type="text"
                placeholder="Banco Origen / Cta"
                value={pagosTransferencia.banco}
                onChange={(e) => setPagosTransferencia({ ...pagosTransferencia, banco: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
              />
              <input
                type="text"
                placeholder="Nº Transferencia / Ref"
                value={pagosTransferencia.referencia}
                onChange={(e) => setPagosTransferencia({ ...pagosTransferencia, referencia: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Monto"
                  value={pagosTransferencia.monto || ''}
                  onChange={(e) =>
                    setPagosTransferencia({ ...pagosTransferencia, monto: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-emerald-300"
                />
                <button
                  type="button"
                  onClick={handleAutofillTransferencia}
                  className="text-[10px] text-blue-400 hover:underline font-bold shrink-0"
                  title="Copiar saldo restante"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Cheque / E-Cheq */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-semibold text-slate-300">3. Cheque / E-Cheq:</span>
              <select
                value={pagosCheque.formato}
                onChange={(e) => setPagosCheque({ ...pagosCheque, formato: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200"
              >
                <option value="ECHEQ">E-Cheq</option>
                <option value="FISICO">Cheque Papel</option>
              </select>
              <input
                type="text"
                placeholder="Nº de Cheque"
                value={pagosCheque.numero}
                onChange={(e) => setPagosCheque({ ...pagosCheque, numero: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200"
              />
              <input
                type="date"
                value={pagosCheque.fechaCobro}
                onChange={(e) => setPagosCheque({ ...pagosCheque, fechaCobro: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200"
                title="Fecha de cobro del cheque"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Monto"
                  value={pagosCheque.monto || ''}
                  onChange={(e) =>
                    setPagosCheque({ ...pagosCheque, monto: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-emerald-300"
                />
                <button
                  type="button"
                  onClick={handleAutofillCheque}
                  className="text-[10px] text-blue-400 hover:underline font-bold shrink-0"
                  title="Copiar saldo restante"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Total valores entregados vs Neto */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-mono font-bold">
              <span className="text-slate-300 font-sans">Total Valores Entregados:</span>
              <span
                className={`text-sm ${
                  diferenciaPago === 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {fmtMoney(totalValoresEntregados)}{' '}
                {diferenciaPago !== 0 && (
                  <span className="text-[10px] font-normal text-amber-400">
                    ({diferenciaPago > 0 ? `+${fmtMoney(diferenciaPago)} a favor` : `${fmtMoney(diferenciaPago)} saldo pendiente`})
                  </span>
                )}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Observaciones / Leyenda de la Orden de Pago
            </label>
            <input
              type="text"
              placeholder="Ej: Pago de honorarios profesionales mes corriente / Facturas varias..."
              value={opObservaciones}
              onChange={(e) => setOpObservaciones(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/70 flex justify-between items-center shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          >
            Cancelar
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirmarOP}
              disabled={selectedMovIds.length === 0 || totalValoresEntregados <= 0}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Emitir Orden de Pago</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL / TALÓN DE IMPRESIÓN OFICIAL DE LA ORDEN DE PAGO */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white text-slate-950 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95">
            {/* Header Impresión */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-xl font-black uppercase tracking-wider">ORDEN DE PAGO Y RECIBO</h1>
                <p className="text-xs font-bold text-slate-700">POLICLÍNICA AMOS / ENTIDAD GREMIAL</p>
                <p className="text-[11px] text-slate-600">Comprobante de Cancelación y Recibo Conforme</p>
              </div>
              <div className="text-right font-mono">
                <p className="text-base font-black text-blue-900">{opNumero}</p>
                <p className="text-xs font-semibold text-slate-700">Fecha: {opFecha}</p>
                <p className="text-[11px] text-slate-500">Período: {selectedMes}</p>
              </div>
            </div>

            {/* Datos Beneficiario */}
            <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-300 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Beneficiario / Razón Social:</span>
                <strong className="text-sm font-bold text-slate-900">{beneficiario}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">CUIT / CUIL:</span>
                <span className="text-sm font-mono font-bold text-slate-800">{maestrosCuit[beneficiario] || '-'}</span>
              </div>
            </div>

            {/* Facturas Canceladas */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase mb-1.5 border-b border-slate-300 pb-1">
                Comprobantes / Facturas Canceladas
              </h4>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-[10px] text-slate-600 font-bold uppercase">
                    <th className="py-1">Fecha</th>
                    <th className="py-1">Comprobante Nº</th>
                    <th className="py-1">Concepto / Detalle</th>
                    <th className="py-1 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {facturasPendientes
                    .filter((m) => selectedMovIds.includes(m.id))
                    .map((m) => (
                      <tr key={m.id}>
                        <td className="py-1 font-mono">{m.fecha}</td>
                        <td className="py-1 font-mono font-bold">{m.facturaNro || '-'}</td>
                        <td className="py-1 text-slate-700">{m.detalle || m.rubro}</td>
                        <td className="py-1 text-right font-mono font-bold">
                          {fmtMoney(m.pagosS || m.netoPagadoMed || m.total)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Liquidación: Bruto - Retenciones = Neto */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-700">
                <span>Total Bruto Facturado:</span>
                <span>{fmtMoney(totalFacturasSeleccionadas)}</span>
              </div>
              {totalRetenciones > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>(-) Total Retenciones Impositivas:</span>
                  <span>- {fmtMoney(totalRetenciones)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-950 pt-1 border-t border-slate-300">
                <span>NETO A COBRAR:</span>
                <span>{fmtMoney(netoAPagar)}</span>
              </div>
            </div>

            {/* Detalle de Valores Entregados */}
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-slate-800 uppercase border-b border-slate-300 pb-1">
                Valores / Medios de Pago Entregados
              </h4>
              {pagosEfectivo > 0 && (
                <p className="font-mono text-slate-800">
                  • <strong>Efectivo:</strong> {fmtMoney(pagosEfectivo)}
                </p>
              )}
              {pagosTransferencia.monto > 0 && (
                <p className="font-mono text-slate-800">
                  • <strong>Transferencia Bancaria:</strong> {fmtMoney(pagosTransferencia.monto)} ({pagosTransferencia.banco} - Ref: {pagosTransferencia.referencia || 'S/N'})
                </p>
              )}
              {pagosCheque.monto > 0 && (
                <p className="font-mono text-slate-800">
                  • <strong>{pagosCheque.formato === 'ECHEQ' ? 'E-Cheq' : 'Cheque Físico'}:</strong> {fmtMoney(pagosCheque.monto)} (Nº {pagosCheque.numero || 'S/N'} - Cobro: {pagosCheque.fechaCobro})
                </p>
              )}
            </div>

            {/* Talón de Recibo Conforme y Firma */}
            <div className="border-t-2 border-dashed border-slate-400 pt-5 space-y-4">
              <p className="text-[11px] text-slate-700 italic">
                Recibí de la entidad la suma de pesos <strong>{fmtMoney(totalValoresEntregados)}</strong> en concepto de cancelación total/parcial de los comprobantes detallados en la presente Orden de Pago.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                <div className="border-t border-slate-800 pt-1">
                  <p className="font-bold text-slate-900">Firma Autorizada</p>
                  <p className="text-[10px] text-slate-500">Tesorería / Administración</p>
                </div>
                <div className="border-t border-slate-800 pt-1">
                  <p className="font-bold text-slate-900">Firma del Beneficiario</p>
                  <p className="text-[10px] text-slate-500">Aclaración y DNI</p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 print:hidden">
              <button
                type="button"
                onClick={() => {
                  setShowPrintPreview(false)
                  onClose()
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Orden de Pago</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
