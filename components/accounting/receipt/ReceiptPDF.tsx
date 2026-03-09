'use client';

// @react-pdf/renderer ile JSX tabanlı PDF makbuz şablonu
import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import type { ReceiptData } from '@/lib/actions/receipt';

// Türkçe dahil geniş unicode desteği için Noto Sans yüklendi
// Fontlar public/fonts/ klasöründen okunup data URL olarak kaydedilir
// Bu yöntem CORS ve subset glyph sorunlarını tamamen önler
export function registerFonts(fontSrcs: { regular: string; bold: string; italic: string }) {
    // Önceki kayıtları temizle (react-pdf font cache sorununu önler)
    Font.register({
        family: 'NotoSans',
        fonts: [
            { src: fontSrcs.regular, fontWeight: 400, fontStyle: 'normal' },
            { src: fontSrcs.italic, fontWeight: 400, fontStyle: 'italic' },
            { src: fontSrcs.bold, fontWeight: 700, fontStyle: 'normal' },
        ],
    });
}

/**
 * PDF metin sanitizer:
 * ı (U+0131, noktasız I) react-pdf'de '1' ya da görünmez olarak render edilip
 * sonraki boşluğu yutuyor, kelimeleri birleştiriyor.
 * Çözüm: noktali-i ile değiştir. Görünce düzeltme.
 */
function s(text: string | null | undefined): string {
    if (!text) return '';
    return text
        .replaceAll('ı', 'i')
        .replaceAll('İ', 'I');
}

// Para birimi formatı: ₺ sembolü (U+20BA) birçok fontta yok, º olarak görünür.
// Bu yüzden sayıyı elle formatla ve sonuna "TL" ekle.
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount) + ' TL';
}

// PDF stilleri
const styles = StyleSheet.create({
    page: {
        fontFamily: 'NotoSans',
        fontSize: 10,
        paddingTop: 30,
        paddingBottom: 40,
        paddingHorizontal: 40,
        backgroundColor: '#FFFFFF',
        color: '#1a1a2e',
    },
    // Header: Kurum bilgileri
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 2,
        borderBottomColor: '#135bec',
        borderBottomStyle: 'solid',
    },
    orgLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    orgLogo: {
        width: 48,
        height: 48,
        objectFit: 'contain',
        borderRadius: 4,
    },
    orgName: {
        fontSize: 16,
        fontWeight: 700,
        color: '#135bec',
        marginBottom: 2,
    },
    orgContactText: {
        fontSize: 8,
        color: '#6b7280',
        marginTop: 2,
    },
    // Makbuz başlığı
    titleBlock: {
        alignItems: 'center',
        marginBottom: 20,
    },
    titleText: {
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: 2,
        color: '#1a1a2e',
        textTransform: 'uppercase',
    },
    receiptMeta: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginTop: 6,
    },
    receiptMetaItem: {
        fontSize: 9,
        color: '#6b7280',
    },
    receiptMetaValue: {
        fontSize: 9,
        fontWeight: 700,
        color: '#374151',
    },
    // Bilgi bölümleri
    section: {
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 8,
        fontWeight: 700,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        borderBottomStyle: 'solid',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    label: {
        fontSize: 9,
        color: '#6b7280',
        width: '38%',
    },
    value: {
        fontSize: 9,
        fontWeight: 700,
        color: '#1a1a2e',
        width: '60%',
        textAlign: 'right',
    },
    // Tutar vurgulama
    amountBlock: {
        backgroundColor: '#f0f4ff',
        borderRadius: 8,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#c7d7fd',
        borderStyle: 'solid',
    },
    amountLabel: {
        fontSize: 8,
        color: '#6b7280',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    amountValue: {
        fontSize: 22,
        fontWeight: 700,
        color: '#135bec',
        marginBottom: 6,
    },
    amountWords: {
        fontSize: 8.5,
        color: '#374151',
        fontStyle: 'italic',
        lineHeight: 1.5,
    },
    // Finansal durum
    financialsBlock: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f9fafb',
        borderRadius: 6,
        padding: 10,
        marginBottom: 14,
    },
    financialItem: {
        alignItems: 'center',
    },
    financialLabel: {
        fontSize: 8,
        color: '#9ca3af',
        marginBottom: 3,
    },
    financialValue: {
        fontSize: 10,
        fontWeight: 700,
        color: '#374151',
    },
    financialValueRed: {
        fontSize: 10,
        fontWeight: 700,
        color: '#dc2626',
    },
    // Not
    noteBlock: {
        backgroundColor: '#fffbeb',
        borderRadius: 5,
        padding: 8,
        marginBottom: 14,
        borderLeftWidth: 3,
        borderLeftColor: '#f59e0b',
        borderLeftStyle: 'solid',
    },
    noteText: {
        fontSize: 8,
        color: '#92400e',
        lineHeight: 1.4,
    },
    // Alt imza alanı
    signatureBlock: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        borderTopStyle: 'solid',
    },
    signatureBox: {
        width: '45%',
        alignItems: 'center',
    },
    signatureTitle: {
        fontSize: 8,
        fontWeight: 700,
        color: '#374151',
        marginBottom: 4,
        textAlign: 'center',
        lineHeight: 1.4,
    },
    signatureName: {
        fontSize: 8,
        color: '#6b7280',
        marginBottom: 30,
        textAlign: 'center',
    },
    signatureLine: {
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: '#9ca3af',
        borderTopStyle: 'solid',
        marginTop: 4,
    },
    signatureHint: {
        fontSize: 7,
        color: '#9ca3af',
        marginTop: 4,
        textAlign: 'center',
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        borderTopStyle: 'solid',
        paddingTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: {
        fontSize: 7,
        color: '#9ca3af',
    },
});

interface ReceiptPDFProps {
    data: ReceiptData;
}

export function ReceiptPDF({ data }: Readonly<ReceiptPDFProps>) {
    const { organization, student, payment, details, financials, operator, receiptNumber, dateFormatted } = data;

    const displayName = student.parentName
        ? `${student.fullName} (Veli: ${student.parentName})`
        : student.fullName;

    return (
        <Document title={`Tahsilat Makbuzu ${receiptNumber}`} author={organization.name}>
            <Page size="A4" style={styles.page}>

                {/* HEADER: Kurum */}
                <View style={styles.header}>
                    <View style={styles.orgLeft}>
                        {/* base64 encode edilmiş logo; CORS olmaz ve react-pdf ile güvenle çalışır */}
                        {organization.logo_base64 && (
                            <Image src={organization.logo_base64} style={styles.orgLogo} />
                        )}
                        <View>
                            <Text style={styles.orgName}>{s(organization.name)}</Text>
                            {organization.address && (
                                <Text style={styles.orgContactText}>{s(organization.address)}</Text>
                            )}
                            {organization.phone && (
                                <Text style={styles.orgContactText}>Tel: {s(organization.phone)}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Makbuz Başlığı */}
                <View style={styles.titleBlock}>
                    <Text style={styles.titleText}>TAHSILAT MAKBUZU</Text>
                    <View style={styles.receiptMeta}>
                        <Text style={styles.receiptMetaItem}>
                            Makbuz No: <Text style={styles.receiptMetaValue}>{receiptNumber}</Text>
                        </Text>
                        <Text style={styles.receiptMetaItem}>
                            Tarih: <Text style={styles.receiptMetaValue}>{s(dateFormatted)}</Text>
                        </Text>
                    </View>
                </View>

                {/* Öğrenci / Veli Bilgileri */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>OGRENCI / VELI BILGILERI</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Ad Soyad</Text>
                        <Text style={styles.value}>{s(displayName)}</Text>
                    </View>
                    {student.tcNo && (
                        <View style={styles.row}>
                            <Text style={styles.label}>TC Kimlik No</Text>
                            <Text style={styles.value}>{student.tcNo}</Text>
                        </View>
                    )}
                    <View style={styles.row}>
                        <Text style={styles.label}>Odeme Sekli</Text>
                        <Text style={styles.value}>{s(payment.method)}</Text>
                    </View>
                    {payment.referenceNo && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Referans No</Text>
                            <Text style={styles.value}>{payment.referenceNo}</Text>
                        </View>
                    )}
                </View>

                {/* Açıklama */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ODEME ACIKLAMASI</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Hizmet</Text>
                        <Text style={styles.value}>{s(details.serviceName)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Donem</Text>
                        <Text style={styles.value}>{s(details.academicPeriod)}</Text>
                    </View>
                    {payment.notes && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Not</Text>
                            <Text style={styles.value}>{s(payment.notes)}</Text>
                        </View>
                    )}
                </View>

                {/* Tahsil Edilen Tutar */}
                <View style={styles.amountBlock}>
                    <Text style={styles.amountLabel}>TAHSIL EDILEN TUTAR</Text>
                    <Text style={styles.amountValue}>{formatCurrency(payment.amount)}</Text>
                    <Text style={styles.amountWords}>{s(payment.amountWords)}</Text>
                </View>

                {/* Finansal Durum */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>FINANSAL DURUM</Text>
                    <View style={styles.financialsBlock}>
                        <View style={styles.financialItem}>
                            <Text style={styles.financialLabel}>Toplam Borc</Text>
                            <Text style={styles.financialValue}>{formatCurrency(financials.totalDebt)}</Text>
                        </View>
                        <View style={styles.financialItem}>
                            <Text style={styles.financialLabel}>Toplam Odenen</Text>
                            <Text style={styles.financialValue}>{formatCurrency(financials.totalPaid)}</Text>
                        </View>
                        <View style={styles.financialItem}>
                            <Text style={styles.financialLabel}>Kalan Borc</Text>
                            <Text style={financials.remainingDebt > 0 ? styles.financialValueRed : styles.financialValue}>
                                {formatCurrency(financials.remainingDebt)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Uyarı Notu */}
                <View style={styles.noteBlock}>
                    <Text style={styles.noteText}>
                        Not: Bu belge tahsilat makbuzudur, resmi fatura yerine gecmez.
                    </Text>
                </View>

                {/* İmza Alanları */}
                <View style={styles.signatureBlock}>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureTitle}>Tahsilati Yapan{'\n'}Kurum Yetkilisi</Text>
                        <Text style={styles.signatureName}>{s(operator.fullName)}</Text>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureHint}>Imza / Kase</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureTitle}>Odemeyi Yapan{'\n'}Veli / Ogrenci</Text>
                        <Text style={styles.signatureName}>{s(student.parentName || student.fullName)}</Text>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureHint}>Imza</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>{s(organization.name)} — {receiptNumber}</Text>
                    <Text style={styles.footerText}>{s(dateFormatted)}</Text>
                </View>

            </Page>
        </Document>
    );
}
