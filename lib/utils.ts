import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhone(phone: string | null | undefined) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
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
    } catch (e) {
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
    if (val && typeof val === 'object' && 'net' in val) return val.net
    return null
  }

  // Common subjects (TYT/AYT)
  // Check common keys directly
  if (scores.matematik) flat['Matematik'] = getNet(scores.matematik)
  if (scores.turkce) flat['Türkçe'] = getNet(scores.turkce)
  if (scores.sosyal) flat['Sosyal'] = getNet(scores.sosyal)
  if (scores.fen) flat['Fen'] = getNet(scores.fen)
  if (scores.tarih) flat['Tarih'] = getNet(scores.tarih)
  if (scores.cografya) flat['Coğrafya'] = getNet(scores.cografya)
  if (scores.felsefe) flat['Felsefe'] = getNet(scores.felsefe)
  if (scores.din) flat['Din Kültürü'] = getNet(scores.din)
  if (scores.fizik) flat['Fizik'] = getNet(scores.fizik)
  if (scores.kimya) flat['Kimya'] = getNet(scores.kimya)
  if (scores.biyoloji) flat['Biyoloji'] = getNet(scores.biyoloji)
  if (scores.edebiyat) flat['Edebiyat'] = getNet(scores.edebiyat)

  // AYT Specific Nested Structures
  // If type is explicitly AYT or implied by presence of specific keys
  if (type === 'AYT' || !type) {
    // Fen Bilimleri (AYT)
    if (scores.fen_bilimleri) {
      if (scores.fen_bilimleri.fizik) flat['Fizik'] = getNet(scores.fen_bilimleri.fizik)
      if (scores.fen_bilimleri.kimya) flat['Kimya'] = getNet(scores.fen_bilimleri.kimya)
      if (scores.fen_bilimleri.biyoloji) flat['Biyoloji'] = getNet(scores.fen_bilimleri.biyoloji)
    }

    // T.D. Edebiyat Sos-1 (AYT)
    if (scores.td_edebiyat_sos1) {
      if (scores.td_edebiyat_sos1.edebiyat) flat['Edebiyat'] = getNet(scores.td_edebiyat_sos1.edebiyat)
      if (scores.td_edebiyat_sos1.tarih1) flat['Tarih-1'] = getNet(scores.td_edebiyat_sos1.tarih1)
      if (scores.td_edebiyat_sos1.cografya1) flat['Coğrafya-1'] = getNet(scores.td_edebiyat_sos1.cografya1)
    }

    // Sosyal-2 (AYT)
    if (scores.sosyal2) {
      if (scores.sosyal2.tarih2) flat['Tarih-2'] = getNet(scores.sosyal2.tarih2)
      if (scores.sosyal2.cografya2) flat['Coğrafya-2'] = getNet(scores.sosyal2.cografya2)
      if (scores.sosyal2.felsefe) flat['Felsefe'] = getNet(scores.sosyal2.felsefe)
      if (scores.sosyal2.din) flat['Din Kültürü'] = getNet(scores.sosyal2.din)
    }
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
    if (val && typeof val === 'object') return val
    return null
  }

  // Common subjects (TYT/AYT)
  if (scores.matematik) flat['Matematik'] = getData(scores.matematik)
  if (scores.turkce) flat['Türkçe'] = getData(scores.turkce)
  if (scores.sosyal) flat['Sosyal'] = getData(scores.sosyal)
  if (scores.fen) flat['Fen'] = getData(scores.fen)
  if (scores.tarih) flat['Tarih'] = getData(scores.tarih)
  if (scores.cografya) flat['Coğrafya'] = getData(scores.cografya)
  if (scores.felsefe) flat['Felsefe'] = getData(scores.felsefe)
  if (scores.din) flat['Din Kültürü'] = getData(scores.din)
  if (scores.fizik) flat['Fizik'] = getData(scores.fizik)
  if (scores.kimya) flat['Kimya'] = getData(scores.kimya)
  if (scores.biyoloji) flat['Biyoloji'] = getData(scores.biyoloji)
  if (scores.edebiyat) flat['Edebiyat'] = getData(scores.edebiyat)

  // AYT Specific Nested Structures
  if (type === 'AYT' || !type) {
    // Fen Bilimleri (AYT)
    if (scores.fen_bilimleri) {
      if (scores.fen_bilimleri.fizik) flat['Fizik'] = getData(scores.fen_bilimleri.fizik)
      if (scores.fen_bilimleri.kimya) flat['Kimya'] = getData(scores.fen_bilimleri.kimya)
      if (scores.fen_bilimleri.biyoloji) flat['Biyoloji'] = getData(scores.fen_bilimleri.biyoloji)
    }

    // T.D. Edebiyat Sos-1 (AYT)
    if (scores.td_edebiyat_sos1) {
      if (scores.td_edebiyat_sos1.edebiyat) flat['Edebiyat'] = getData(scores.td_edebiyat_sos1.edebiyat)
      if (scores.td_edebiyat_sos1.tarih1) flat['Tarih-1'] = getData(scores.td_edebiyat_sos1.tarih1)
      if (scores.td_edebiyat_sos1.cografya1) flat['Coğrafya-1'] = getData(scores.td_edebiyat_sos1.cografya1)
    }

    // Sosyal-2 (AYT)
    if (scores.sosyal2) {
      if (scores.sosyal2.tarih2) flat['Tarih-2'] = getData(scores.sosyal2.tarih2)
      if (scores.sosyal2.cografya2) flat['Coğrafya-2'] = getData(scores.sosyal2.cografya2)
      if (scores.sosyal2.felsefe) flat['Felsefe'] = getData(scores.sosyal2.felsefe)
      if (scores.sosyal2.din) flat['Din Kültürü'] = getData(scores.sosyal2.din)
    }
  }

  return flat
}
