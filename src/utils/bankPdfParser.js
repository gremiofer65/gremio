import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'

// Configurar worker de PDF.js para Vite / ES Modules
try {
  if (pdfjsLib?.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker
  }
} catch (e) {
  console.warn('PDF.js worker setup warning:', e)
}

/**
 * Reglas de categorización exactas del Programa Banco (recuperadas de generador_recovered.py)
 */
export const REGLAS_CATEGORIAS = {
  'IMPUESTOS DEB/CRED': [
    'gravamenley25413sdeb',
    'gravamenley25413scred',
    'reintegroley25413deb',
    'reintegroley25413cred',
    'vsgytley25413'
  ],
  'IVA DEBITO': ['ivabase'],
  'COMISIONES Y GASTOS': [
    'comispservrecaudacion',
    'comispserv',
    'comistransfne24',
    'comiscompensacionatenc',
    'comiscanjeobancos'
  ],
  'CHEQUES DEBITADOS': ['pagochequepropiacasa'],
  'INTERDEPOSITOS': [
    'debtraninterblink',
    'debtraninterblinkres',
    'pagovepafip',
    'pagoedensa',
    'dbcredintranslinkcia',
    'debitopagodirecto',
    'pagomovistar',
    'pagomovistarhogar',
    'pagocajademedaportp',
    'pagofaecys',
    '48hsbancos'
  ],
  'DEPOSITOS': [
    'debtraninterblinktit',
    'rendpservrecaudacion',
    'transfintdistlinklar',
    'cbetrobcodsuc0001k',
    'rendicionpagoslink',
    'debin',
    'transfintdistbanelar',
    'crtrvariosvsuc0001',
    'crtransfinterlinkres',
    'dep',
    'deposito',
    'efectivo',
    'ch',
    'transfintermmlinkular',
    'camfeddistpzaobcos',
    'crtransfinterbaneres',
    'creditosvarios',
    'cobradoporcaja',
    'crtrfacturasuc0001'
  ]
}

export const ORDEN_CATEGORIAS = [
  'IMPUESTOS DEB/CRED',
  'IVA DEBITO',
  'COMISIONES Y GASTOS',
  'CHEQUES DEBITADOS',
  'INTERDEPOSITOS',
  'DEPOSITOS'
]

/**
 * Normaliza textos para comparación exacta
 */
function normText(str = '') {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita tildes
    .replace(/[^a-z0-9]/g, '')       // Solo alfanuméricos
}

/**
 * Asigna una categoría a partir del detalle normalizado
 */
export function clasificarMovimientoBanco(detalle = '') {
  const detalleNorm = normText(detalle)
  for (const [categoria, palabrasClave] of Object.entries(REGLAS_CATEGORIAS)) {
    if (palabrasClave.some((kw) => detalleNorm.includes(kw))) {
      return categoria
    }
  }
  return 'NO CATEGORIZADAS'
}

/**
 * Extrae texto línea por línea de un archivo PDF usando PDF.js
 */
async function extractTextLinesFromPDF(arrayBuffer) {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise
  const allLines = []
  let rawFullText = ''

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    
    const items = textContent.items || []
    if (items.length === 0) continue

    const lineMap = new Map()
    for (const item of items) {
      if (!item.str) continue
      const y = Math.round(item.transform[5])
      let foundY = null
      for (const existingY of lineMap.keys()) {
        if (Math.abs(existingY - y) <= 3) {
          foundY = existingY
          break
        }
      }
      const groupY = foundY !== null ? foundY : y
      if (!lineMap.has(groupY)) {
        lineMap.set(groupY, [])
      }
      lineMap.get(groupY).push(item)
    }

    const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a)

    for (const y of sortedYs) {
      const lineItems = lineMap.get(y).sort((a, b) => a.transform[4] - b.transform[4])
      const lineStr = lineItems.map((it) => it.str).join(' ').trim()
      if (lineStr) {
        allLines.push(lineStr)
        rawFullText += lineStr + '\n'
      }
    }
  }

  return { allLines, rawFullText, numPages: pdf.numPages }
}

/**
 * Parsea el extracto bancario oficial en PDF (Banco Provincia / Link / etc.)
 */
export async function parsePdfExtractoBanco(file) {
  const arrayBuffer = await file.arrayBuffer()
  const { allLines, rawFullText, numPages } = await extractTextLinesFromPDF(arrayBuffer)

  // 1. Detectar Cuenta
  let account = 'Cuenta_Desconocida'
  const matchCta = rawFullText.match(/\b(2341052324|2341055145)\b/)
  if (matchCta) {
    account = matchCta[1]
  } else {
    const matchGen = rawFullText.match(/cuenta\s*n[°o\.:]?\s*([0-9\/\-]+)/i)
    if (matchGen) {
      account = matchGen[1].replace(/[^0-9]/g, '')
    }
  }

  let tipo = 'Desconocido'
  if (account.includes('2341052324')) tipo = 'Cobros'
  else if (account.includes('2341055145')) tipo = 'Pagos'

  // 2. Extraer Transacciones
  const transactions = []
  let lastSaldo = null
  let saldoAnterior = null

  const dateRegex = /^\d{2}\/\d{2}\/\d{2,4}/
  const numberRegex = /[\d.]+,[0-9]{2}/g

  for (const rawLine of allLines) {
    const line = rawLine.replace(/^_+/, '').trim()

    if (line.toUpperCase().includes('SALDO ANTERIOR')) {
      const match = line.match(/([\d.]+,[0-9]{2})/)
      if (match) {
        saldoAnterior = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
        lastSaldo = saldoAnterior
      }
    }

    if (dateRegex.test(line)) {
      const fecha = line.slice(0, 8)
      const resto = line.slice(8).trim()

      const numerosMatch = Array.from(line.matchAll(numberRegex))
      if (numerosMatch.length < 1) continue

      const saldoStr = numerosMatch[numerosMatch.length - 1][0]
      const saldo = parseFloat(saldoStr.replace(/\./g, '').replace(',', '.'))

      const comprobMatch = resto.match(/\s(\d+[A-Z0-9]*)\s+(?:[\d.]+,[0-9]{2})/)
      if (comprobMatch) {
        const comprob = comprobMatch[1]
        const detalleEnd = comprobMatch.index
        const detalle = resto.slice(0, detalleEnd).trim()
        const restoNumeros = resto.slice(comprobMatch.index)
        const montos = restoNumeros.match(/[\d.]+,[0-9]{2}/g) || []

        let debitos = 0
        let creditos = 0

        if (montos.length >= 3) {
          const val1 = parseFloat(montos[0].replace(/\./g, '').replace(',', '.'))
          const val2 = parseFloat(montos[1].replace(/\./g, '').replace(',', '.'))
          if (val1 > 0 && val2 === 0) {
            debitos = val1
          } else if (val2 > 0 && val1 === 0) {
            creditos = val2
          } else {
            debitos = val1
            creditos = val2
          }
        } else if (montos.length >= 2) {
          const monto = parseFloat(montos[0].replace(/\./g, '').replace(',', '.'))
          if (lastSaldo !== null) {
            if (saldo > lastSaldo) {
              creditos = monto
            } else {
              debitos = monto
            }
          } else {
            debitos = monto
          }
        }

        if (detalle && (debitos > 0 || creditos > 0)) {
          const categoria = clasificarMovimientoBanco(detalle)
          transactions.push({
            id: `tx-${transactions.length + 1}-${Date.now()}`,
            FECHA: fecha,
            DETALLE: detalle,
            COMPROB: comprob,
            DEBITOS: debitos,
            CREDITOS: creditos,
            SALDO: saldo,
            CATEGORIA: categoria,
            conciliado: false
          })
        }
        lastSaldo = saldo
      }
    }
  }

  // 3. Generar Cálculos Agrupados
  const fechas = transactions.map((t) => t.FECHA).filter(Boolean)
  const periodo = fechas.length ? `${fechas[0]} al ${fechas[fechas.length - 1]}` : 'Desconocido'

  let detectedMonthNumber = null
  let detectedYear = null
  if (fechas.length > 0) {
    const parts = fechas[0].split('/')
    if (parts.length === 3) {
      detectedMonthNumber = parseInt(parts[1], 10)
      detectedYear = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
    }
  }

  // Totales por Detalle
  const totalesPorDetalle = {}
  for (const t of transactions) {
    let det = t.DETALLE || 'Sin detalle'
    if (det.toLowerCase().includes('debin')) det = 'DEBIN'

    if (!totalesPorDetalle[det]) {
      totalesPorDetalle[det] = { detalle: det, debitos: 0, creditos: 0, cantidad: 0 }
    }
    totalesPorDetalle[det].debitos += t.DEBITOS
    totalesPorDetalle[det].creditos += t.CREDITOS
    totalesPorDetalle[det].cantidad += 1
  }
  const listaTotalesDetalle = Object.values(totalesPorDetalle).sort((a, b) => b.cantidad - a.cantidad)

  // Resumen por Categoría
  const resumenCategorias = {}
  for (const cat of ORDEN_CATEGORIAS) {
    resumenCategorias[cat] = { categoria: cat, debitos: 0, creditos: 0, cantidad: 0 }
  }
  for (const t of transactions) {
    const cat = t.CATEGORIA
    if (resumenCategorias[cat]) {
      resumenCategorias[cat].debitos += t.DEBITOS
      resumenCategorias[cat].creditos += t.CREDITOS
      resumenCategorias[cat].cantidad += 1
    }
  }

  // Detalle por Categoría
  const detallePorCategoria = {}
  for (const cat of [...ORDEN_CATEGORIAS, 'NO CATEGORIZADAS']) {
    detallePorCategoria[cat] = {}
  }
  for (const t of transactions) {
    const cat = t.CATEGORIA
    const det = t.DETALLE || ''
    if (!detallePorCategoria[cat][det]) {
      detallePorCategoria[cat][det] = { categoria: cat, detalle: det, debitos: 0, creditos: 0, cantidad: 0 }
    }
    detallePorCategoria[cat][det].debitos += t.DEBITOS
    detallePorCategoria[cat][det].creditos += t.CREDITOS
    detallePorCategoria[cat][det].cantidad += 1
  }

  return {
    account,
    tipo,
    periodo,
    detectedMonthNumber,
    detectedYear,
    saldoAnterior,
    saldoFinal: transactions.length > 0 ? transactions[transactions.length - 1].SALDO : lastSaldo,
    totalDebitos: transactions.reduce((acc, t) => acc + t.DEBITOS, 0),
    totalCreditos: transactions.reduce((acc, t) => acc + t.CREDITOS, 0),
    transactions,
    listaTotalesDetalle,
    resumenCategorias: ORDEN_CATEGORIAS.map((cat) => resumenCategorias[cat]),
    detallePorCategoria,
    numPages
  }
}

/**
 * Exporta el libro y análisis bancario completo a archivo Excel .XLSX con 4 hojas idénticas al Programa Banco original
 */
export function exportarAnalisisBancoExcel(analisis) {
  if (!analisis || !analisis.transactions) return

  const wb = XLSX.utils.book_new()

  // 1. Hoja 1: Estado de Cuenta
  const ws1Data = [
    [`Cuenta: ${analisis.account}`],
    [`Tipo: ${analisis.tipo}`],
    [`Período: ${analisis.periodo}`],
    [],
    ['FECHA', 'DETALLE', 'COMPROB.', 'DEBITOS', 'CREDITOS', 'SALDO', 'CATEGORIA']
  ]
  analisis.transactions.forEach((t) => {
    ws1Data.push([t.FECHA, t.DETALLE, t.COMPROB, t.DEBITOS, t.CREDITOS, t.SALDO, t.CATEGORIA])
  })
  const ws1 = XLSX.utils.aoa_to_sheet(ws1Data)
  XLSX.utils.book_append_sheet(wb, ws1, 'Estado de Cuenta')

  // 2. Hoja 2: Totales por Detalle
  const ws2Data = [
    [`Cuenta: ${analisis.account}`],
    [`Tipo: ${analisis.tipo}`],
    [`Período: ${analisis.periodo}`],
    [],
    ['DETALLE', 'CANTIDAD', 'TOTAL DEBITOS', 'TOTAL CREDITOS', 'SALDO NETO']
  ]
  analisis.listaTotalesDetalle.forEach((row) => {
    const saldoNeto = row.creditos - row.debitos
    ws2Data.push([row.detalle, row.cantidad, row.debitos, row.creditos, saldoNeto])
  })
  const ws2 = XLSX.utils.aoa_to_sheet(ws2Data)
  XLSX.utils.book_append_sheet(wb, ws2, 'Totales por Detalle')

  // 3. Hoja 3: Resumen por Categoria
  const ws3Data = [
    [`Cuenta: ${analisis.account}`],
    [`Tipo: ${analisis.tipo}`],
    [`Período: ${analisis.periodo}`],
    [],
    ['CATEGORIA', 'CANTIDAD', 'TOTAL DEBITOS', 'TOTAL CREDITOS', 'SALDO NETO']
  ]
  analisis.resumenCategorias.forEach((row) => {
    const saldoNeto = row.creditos - row.debitos
    ws3Data.push([row.categoria, row.cantidad, row.debitos, row.creditos, saldoNeto])
  })
  const ws3 = XLSX.utils.aoa_to_sheet(ws3Data)
  XLSX.utils.book_append_sheet(wb, ws3, 'Resumen por Categoria')

  // 4. Hoja 4: Detalle por Categoria
  const ws4Data = [
    [`Cuenta: ${analisis.account}`],
    [`Tipo: ${analisis.tipo}`],
    [`Período: ${analisis.periodo}`],
    [],
    ['CATEGORIA', 'DETALLE', 'CANTIDAD', 'TOTAL DEBITOS', 'TOTAL CREDITOS', 'SALDO NETO']
  ]
  for (const cat of [...ORDEN_CATEGORIAS, 'NO CATEGORIZADAS']) {
    const subObj = analisis.detallePorCategoria[cat] || {}
    const items = Object.values(subObj).sort((a, b) => (b.creditos - b.debitos) - (a.creditos - a.debitos))
    items.forEach((row) => {
      const saldoNeto = row.creditos - row.debitos
      ws4Data.push([cat, row.detalle, row.cantidad, row.debitos, row.creditos, saldoNeto])
    })
  }
  const ws4 = XLSX.utils.aoa_to_sheet(ws4Data)
  XLSX.utils.book_append_sheet(wb, ws4, 'Detalle por Categoria')

  const filename = `estado_cuenta_final_${analisis.account}_${analisis.periodo.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
  XLSX.writeFile(wb, filename)
}

/**
 * Autocompleta el archivo oficial de Conciliación Sindicato (.xlsx)
 * PRESERVANDO AL 100% todos los estilos, colores, fuentes, bordes, tamaños de fila y fórmulas
 * mediante coincidencia EXACTA de etiquetas (sin tocar depósitos ni cheques pendientes).
 */
export async function autocompletarExcelConciliacionSindicato(excelFile, pdfAnalisis, targetSheetName = null) {
  if (!excelFile || !pdfAnalisis) {
    throw new Error('Debe proporcionar el archivo de Excel y el extracto PDF analizado.')
  }

  const arrayBuffer = await excelFile.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(arrayBuffer)

  // 1. Identificar la hoja correspondiente (ej: "Conciliac Sept 2026", "Conciliac Ago 2026", etc.)
  let targetWs = null
  let foundSheetName = targetSheetName

  const sheetNames = []
  workbook.eachSheet((worksheet) => {
    sheetNames.push(worksheet.name)
  })

  if (!foundSheetName) {
    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sept', 'Octub', 'Nov', 'Dic'
    ]
    const mNum = pdfAnalisis.detectedMonthNumber || 9
    const mPrefix = monthNames[mNum - 1]
    const yr = pdfAnalisis.detectedYear || '2026'

    foundSheetName = sheetNames.find((s) => {
      const sLow = s.toLowerCase()
      return sLow.includes(mPrefix.toLowerCase()) && (sLow.includes(yr) || sLow.includes(yr.slice(-2)))
    })

    if (!foundSheetName) {
      foundSheetName = sheetNames.find((s) => s.toLowerCase().includes(mPrefix.toLowerCase()))
    }
  }

  if (foundSheetName) {
    targetWs = workbook.getWorksheet(foundSheetName)
  }

  if (!targetWs) {
    throw new Error(`No se encontró una hoja para el período en el archivo Excel. Hojas disponibles: ${sheetNames.join(', ')}`)
  }

  // 2. Determinar si es Cuenta Cobros (Columna B / izquierda) o Cuenta Pagos (Columna H / derecha)
  const isPagos = pdfAnalisis.account.includes('2341055145') || pdfAnalisis.tipo === 'Pagos'

  const labelColIdx = isPagos ? 7 : 1 // Columna G = 7 ó Columna A = 1
  const valColIdx = isPagos ? 8 : 2   // Columna H = 8 ó Columna B = 2

  // Obtener los totales por categoría del análisis
  const catTotals = {}
  pdfAnalisis.resumenCategorias.forEach((c) => {
    catTotals[c.categoria] = c
  })

  // 3. Mapear e insertar valores fila por fila con COINCIDENCIA EXACTA DE ETIQUETA
  targetWs.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber > 45) return

    const labelCell = row.getCell(labelColIdx)
    const labelVal = labelCell?.value
    const labelRaw = typeof labelVal === 'string' ? labelVal.trim() : ''
    const labelNorm = normText(labelRaw)

    if (!labelNorm) return

    const targetCell = row.getCell(valColIdx)

    // Función para actualizar solo el valor numérico conservando estilos
    const setAmount = (val) => {
      const numVal = Number(Number(val || 0).toFixed(2))
      targetCell.value = numVal
      if (!targetCell.numFmt) {
        targetCell.numFmt = '#,##0.00'
      }
    }

    // A. Saldo anterior
    if (labelNorm === 'saldoanteriorsbco' && pdfAnalisis.saldoAnterior !== null && pdfAnalisis.saldoAnterior !== undefined) {
      setAmount(pdfAnalisis.saldoAnterior)
    }
    // B. Impuestos Débito/Crédito (Ley 25.413)
    else if (labelNorm === 'impuestosdebcred') {
      const deb = catTotals['IMPUESTOS DEB/CRED'] ? catTotals['IMPUESTOS DEB/CRED'].debitos : 0
      setAmount(deb)
    }
    // C. IVA Débito
    else if (labelNorm === 'ivadebito') {
      const deb = catTotals['IVA DEBITO'] ? catTotals['IVA DEBITO'].debitos : 0
      setAmount(deb)
    }
    // D. Comisiones y Gastos
    else if (labelNorm === 'comisionesygastos') {
      const deb = catTotals['COMISIONES Y GASTOS'] ? catTotals['COMISIONES Y GASTOS'].debitos : 0
      setAmount(deb)
    }
    // E. Cheques Debitados
    else if (labelNorm === 'chequesdebitados') {
      const deb = catTotals['CHEQUES DEBITADOS'] ? catTotals['CHEQUES DEBITADOS'].debitos : 0
      setAmount(deb)
    }
    // F. Interdepósitos
    else if (labelNorm === 'interdepositos') {
      const deb = catTotals['INTERDEPOSITOS'] ? catTotals['INTERDEPOSITOS'].debitos : 0
      setAmount(deb)
    }
    // G. Depósitos (Créditos en el banco) - SOLO cuando la etiqueta sea EXACTAMENTE "DEPÓSITOS", NUNCA si dice "PENDIENTES"
    else if (labelNorm === 'depositos') {
      const cred = catTotals['DEPOSITOS'] ? catTotals['DEPOSITOS'].creditos : 0
      setAmount(cred)
    }
    // H. Subtotal
    else if (labelNorm === 'subtotal' && pdfAnalisis.saldoFinal !== null && pdfAnalisis.saldoFinal !== undefined) {
      setAmount(pdfAnalisis.saldoFinal)
    }
  })

  // 4. Actualizar celda de Saldo Contable si existe en la fila inferior
  for (let r = 25; r <= 35; r++) {
    const row = targetWs.getRow(r)
    const nextCell = row.getCell(valColIdx + 1)
    const nextVal = typeof nextCell?.value === 'string' ? normText(nextCell.value) : ''

    if (nextVal === 'saldocontable') {
      const targetCell = row.getCell(valColIdx)
      if (pdfAnalisis.saldoFinal !== null && pdfAnalisis.saldoFinal !== undefined) {
        targetCell.value = Number(Number(pdfAnalisis.saldoFinal).toFixed(2))
        if (!targetCell.numFmt) targetCell.numFmt = '#,##0.00'
      }
    }
  }

  // 5. Escribir el libro completo con ExcelJS
  const updatedBuffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([updatedBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  
  const baseName = excelFile.name.replace(/\.xlsx$/i, '')
  link.setAttribute('download', `${baseName}_Actualizado_${foundSheetName.replace(/\s+/g, '_')}.xlsx`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  return {
    success: true,
    sheetUpdated: foundSheetName,
    cuentaActualizada: isPagos ? '23410551/45 (Pagos)' : '23410523/24 (Cobros)'
  }
}
