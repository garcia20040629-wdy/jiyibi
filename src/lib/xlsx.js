// 轻量 xlsx 解析器:零依赖,针对微信/支付宝账单这类纯文本+数字的简单表格
// xlsx = zip 压缩包,内含 sharedStrings.xml 与 worksheets/sheetN.xml

function readLE(u8, off, len) {
  let n = 0
  for (let i = 0; i < len; i++) n += u8[off + i] * Math.pow(256, i)
  return n
}

function listZipEntries(u8) {
  let eocd = -1
  const min = Math.max(0, u8.length - 22 - 65536)
  for (let i = u8.length - 22; i >= min; i--) {
    if (u8[i] === 0x50 && u8[i + 1] === 0x4b && u8[i + 2] === 0x05 && u8[i + 3] === 0x06) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('不是有效的 Excel 文件')
  const count = readLE(u8, eocd + 10, 2)
  let off = readLE(u8, eocd + 16, 4)
  const dec = new TextDecoder('utf-8')
  const entries = []
  for (let i = 0; i < count; i++) {
    if (u8[off] !== 0x50 || u8[off + 1] !== 0x4b || u8[off + 2] !== 0x01 || u8[off + 3] !== 0x02) break
    const method = readLE(u8, off + 10, 2)
    const compSize = readLE(u8, off + 20, 4)
    const nameLen = readLE(u8, off + 28, 2)
    const extraLen = readLE(u8, off + 30, 2)
    const commentLen = readLE(u8, off + 32, 2)
    const localOff = readLE(u8, off + 42, 4)
    const name = dec.decode(u8.slice(off + 46, off + 46 + nameLen))
    const lnameLen = readLE(u8, localOff + 26, 2)
    const lextraLen = readLE(u8, localOff + 28, 2)
    entries.push({ name, method, compSize, dataStart: localOff + 30 + lnameLen + lextraLen })
    off += 46 + nameLen + extraLen + commentLen
  }
  return entries
}

async function inflateRaw(comp) {
  const ds = new DecompressionStream('deflate-raw')
  const stream = new Blob([comp]).stream().pipeThrough(ds)
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

function unescapeXml(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function parseSharedStrings(xml) {
  const out = []
  const re = /<si>([\s\S]*?)<\/si>/g
  let m
  while ((m = re.exec(xml))) {
    const ts = [...m[1].matchAll(/<t(?: [^>]*)?>([\s\S]*?)<\/t>/g)].map((x) => unescapeXml(x[1]))
    out.push(ts.join(''))
  }
  return out
}

function colIndex(ref) {
  const m = ref.match(/^([A-Z]+)/)
  if (!m) return 0
  let n = 0
  for (const ch of m[1]) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

function sheetToRows(xml, shared) {
  const rows = []
  const rowRe = /<row[^>]*>([\s\S]*?)<\/row>/g
  let rm
  while ((rm = rowRe.exec(xml))) {
    const cells = []
    const cRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g
    let cm
    while ((cm = cRe.exec(rm[1]))) {
      const attrs = cm[1]
      const inner = cm[2] || ''
      const r = (attrs.match(/\br="([^"]*)"/) || [])[1] || ''
      const t = (attrs.match(/\bt="([^"]*)"/) || [])[1] || 'n'
      const v = (inner.match(/<v[^>]*>([\s\S]*?)<\/v>/) || [])[1]
      let val = ''
      if (t === 's') {
        val = v !== undefined && shared[Number(v)] !== undefined ? shared[Number(v)] : ''
      } else if (t === 'inlineStr') {
        const is = (inner.match(/<is[^>]*>([\s\S]*?)<\/is>/) || [])[1] || ''
        val = [...is.matchAll(/<t(?: [^>]*)?>([\s\S]*?)<\/t>/g)].map((x) => unescapeXml(x[1])).join('')
      } else if (v !== undefined) {
        val = unescapeXml(v)
      }
      const col = r ? colIndex(r) : cells.length
      while (cells.length < col) cells.push('')
      cells[col] = val
    }
    if (cells.some((x) => x !== '')) rows.push(cells)
  }
  return rows
}

export async function parseXlsx(buf) {
  const u8 = new Uint8Array(buf)
  const entries = listZipEntries(u8)
  const readXml = async (suffix) => {
    const e = entries.find((x) => x.name === suffix || x.name.endsWith('/' + suffix))
    if (!e) return ''
    const raw = u8.slice(e.dataStart, e.dataStart + e.compSize)
    const data = e.method === 0 ? raw : await inflateRaw(raw)
    return new TextDecoder('utf-8').decode(data)
  }

  const sharedXml = await readXml('sharedStrings.xml')
  let sheetXml = await readXml('sheet1.xml')
  if (!sheetXml) {
    const alt = entries.find((x) => /worksheets\/sheet\d+\.xml$/.test(x.name))
    if (alt) sheetXml = await readXml(alt.name.split('/').pop())
  }
  if (!sheetXml) throw new Error('Excel 文件里没有找到工作表')

  const shared = sharedXml ? parseSharedStrings(sharedXml) : []
  const rows = sheetToRows(sheetXml, shared)
  if (!rows.length) throw new Error('Excel 文件是空的')
  return rows
}
