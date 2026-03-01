import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhone(phone: string | null | undefined) {
  if (!phone) return null;
  const digits = phone.replaceAll(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
  return phone;
}

export function formatXAxisTick(value: string) {
  // If value is a date string (YYYY-MM-DD or similar), format it nicely
  const datePattern = /^\d{4}-\d{2}-\d{2}/;
  if (datePattern.test(value)) {
    try {
      const date = new Date(value);
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    } catch (e) { // NOSONAR
      // Fall through
    }
  }

  // Truncate if longer than 12 chars
  if (value.length > 12) {
    return `${value.slice(0, 10)}...`;
  }

  return value;
}

// Helper to flatten nested scores into a single level object with net values
// Supports both TYT and AYT structures
export function flattenExamScores(scores: any, type?: string) {
  if (!scores) return {}

  // Parse if string
  if (typeof scores === 'string') {
    try { scores = JSON.parse(scores) }
    catch { return {} }
  }

  if (typeof scores !== 'object') return {}

  const flat: Record<string, number | null> = {}

  // Helper to safely get net value
  const getNet = (val: any) => {
    if (typeof val === 'number') return val
    if (typeof val === 'string' && !Number.isNaN(Number.parseFloat(val))) return Number.parseFloat(val)
    if (val && typeof val === 'object' && 'net' in val) {
      const netVal = val.net
      if (typeof netVal === 'number') return netVal
      if (typeof netVal === 'string' && !Number.isNaN(Number.parseFloat(netVal))) return Number.parseFloat(netVal)
    }
    return null
  }

  const setNet = (key: string, val: any) => {
    if (val !== undefined) {
      const net = getNet(val);
      if (net !== null) flat[key] = net;
    }
  }

  // Common subjects (TYT/AYT)
  setNet('Matematik', scores?.matematik)
  setNet('Türkçe', scores?.turkce)
  setNet('Sosyal', scores?.sosyal)
  setNet('Fen', scores?.fen)
  setNet('Tarih', scores?.tarih)
  setNet('Coğrafya', scores?.cografya)
  setNet('Felsefe', scores?.felsefe)
  setNet('Din Kültürü', scores?.din)
  setNet('Fizik', scores?.fizik)
  setNet('Kimya', scores?.kimya)
  setNet('Biyoloji', scores?.biyoloji)
  setNet('Edebiyat', scores?.edebiyat)

  // AYT Specific Nested Structures
  if (type === 'AYT' || !type) {
    // Fen Bilimleri (AYT)
    setNet('Fizik', scores?.fen_bilimleri?.fizik)
    setNet('Kimya', scores?.fen_bilimleri?.kimya)
    setNet('Biyoloji', scores?.fen_bilimleri?.biyoloji)

    // T.D. Edebiyat Sos-1 (AYT)
    setNet('Edebiyat', scores?.td_edebiyat_sos1?.edebiyat)
    setNet('Tarih-1', scores?.td_edebiyat_sos1?.tarih1)
    setNet('Coğrafya-1', scores?.td_edebiyat_sos1?.cografya1)

    // Sosyal-2 (AYT)
    setNet('Tarih-2', scores?.sosyal2?.tarih2)
    setNet('Coğrafya-2', scores?.sosyal2?.cografya2)
    setNet('Felsefe', scores?.sosyal2?.felsefe)
    setNet('Din Kültürü', scores?.sosyal2?.din)
  }

  return flat
}

// Helper to flatten nested scores into a single level object with full details (dogru, yanlis, net)
export function flattenExamDetails(scores: any, type?: string) {
  if (!scores) return {}

  // Parse if string
  if (typeof scores === 'string') {
    try { scores = JSON.parse(scores) }
    catch { return {} }
  }

  if (typeof scores !== 'object') return {}

  const flat: Record<string, any> = {}

  // Helper to safely get data object
  const getData = (val: any) => {
    // If scalar (net), return mock detail. Or if we want to be safe, standard object.
    // Assuming number is just net.
    if (typeof val === 'number') return { net: val, dogru: 0, yanlis: 0 }
    if (typeof val === 'string' && !Number.isNaN(Number.parseFloat(val))) return { net: Number.parseFloat(val), dogru: 0, yanlis: 0 }
    if (val && typeof val === 'object') {
      const netVal = val.net
      if (typeof netVal === 'string' && !Number.isNaN(Number.parseFloat(netVal))) {
        return { ...val, net: Number.parseFloat(netVal) }
      }
      return val
    }
    return null
  }

  const setData = (key: string, val: any) => {
    if (val !== undefined) {
      const data = getData(val);
      if (data !== null) flat[key] = data;
    }
  }

  // Common subjects (TYT/AYT)
  setData('Matematik', scores?.matematik)
  setData('Türkçe', scores?.turkce)
  setData('Sosyal', scores?.sosyal)
  setData('Fen', scores?.fen)
  setData('Tarih', scores?.tarih)
  setData('Coğrafya', scores?.cografya)
  setData('Felsefe', scores?.felsefe)
  setData('Din Kültürü', scores?.din)
  setData('Fizik', scores?.fizik)
  setData('Kimya', scores?.kimya)
  setData('Biyoloji', scores?.biyoloji)
  setData('Edebiyat', scores?.edebiyat)

  // AYT Specific Nested Structures
  if (type === 'AYT' || !type) {
    // Fen Bilimleri (AYT)
    setData('Fizik', scores?.fen_bilimleri?.fizik)
    setData('Kimya', scores?.fen_bilimleri?.kimya)
    setData('Biyoloji', scores?.fen_bilimleri?.biyoloji)

    // T.D. Edebiyat Sos-1 (AYT)
    setData('Edebiyat', scores?.td_edebiyat_sos1?.edebiyat)
    setData('Tarih-1', scores?.td_edebiyat_sos1?.tarih1)
    setData('Coğrafya-1', scores?.td_edebiyat_sos1?.cografya1)

    // Sosyal-2 (AYT)
    setData('Tarih-2', scores?.sosyal2?.tarih2)
    setData('Coğrafya-2', scores?.sosyal2?.cografya2)
    setData('Felsefe', scores?.sosyal2?.felsefe)
    setData('Din Kültürü', scores?.sosyal2?.din)
  }

  return flat
}
