export function numberToWordsTR(amount: number): string {
    if (amount === 0) return 'Sıfır Türk Lirası';

    const units = ['', 'Bir', 'İki', 'Üç', 'Dört', 'Beş', 'Altı', 'Yedi', 'Sekiz', 'Dokuz'];
    const tens = ['', 'On', 'Yirmi', 'Otuz', 'Kırk', 'Elli', 'Altmış', 'Yetmiş', 'Seksen', 'Doksan'];
    const scales = ['', 'Bin', 'Milyon', 'Milyar', 'Trilyon'];

    const getBelowThousand = (num: number): string => {
        let word = '';
        const hundreds = Math.floor(num / 100);
        const remainder = num % 100;

        if (hundreds > 0) {
            if (hundreds === 1) {
                word += 'Yüz ';
            } else {
                word += units[hundreds] + ' Yüz ';
            }
        }

        const tenVal = Math.floor(remainder / 10);
        const unitVal = remainder % 10;

        if (tenVal > 0) {
            word += tens[tenVal] + ' ';
        }
        if (unitVal > 0) {
            word += units[unitVal] + ' ';
        }

        return word.trim();
    };

    const convertIntegerPart = (num: number): string => {
        if (num === 0) return 'Sıfır';

        let word = '';
        let scaleIndex = 0;

        while (num > 0) {
            const chunk = num % 1000;
            if (chunk > 0) {
                const chunkStr = getBelowThousand(chunk);

                // "Bir Bin" kullanımını engellemek için kontrol
                if (scaleIndex === 1 && chunk === 1) {
                    word = scales[scaleIndex] + ' ' + word;
                } else {
                    word = chunkStr + (scales[scaleIndex] ? ' ' + scales[scaleIndex] : '') + ' ' + word;
                }
            }
            num = Math.floor(num / 1000);
            scaleIndex++;
        }

        return word.trim();
    };

    // Parçalara ayır (Lira ve Kuruş)
    const intPart = Math.floor(amount);
    const floatPart = Math.round((amount - intPart) * 100);

    let result = convertIntegerPart(intPart) + ' Türk Lirası';

    if (floatPart > 0) {
        result += ' ' + convertIntegerPart(floatPart) + ' Kuruş';
    }

    return result;
}
