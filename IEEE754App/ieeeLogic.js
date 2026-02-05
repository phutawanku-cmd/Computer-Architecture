//ฟังก์ชันแปลง Decimal เป็น Binary String
export const decimalToBinary = (num, isDouble) => {
  if (isNaN(num)) return isDouble ? "NaN".padEnd(64, '0') : "NaN".padEnd(32, '0');
  if (!isFinite(num)) {
    const sign = num > 0 ? '0' : '1';
    if (isDouble) return sign + '11111111111' + '0'.repeat(52);
    return sign + '11111111' + '0'.repeat(23);
  }

  const buffer = new ArrayBuffer(isDouble ? 8 : 4);
  const view = new DataView(buffer);

  if (isDouble) {
    view.setFloat64(0, num);
    const bigInt = view.getBigUint64(0);
    return bigInt.toString(2).padStart(64, '0');
  } else {
    view.setFloat32(0, num);
    const intVal = view.getUint32(0);
    return intVal.toString(2).padStart(32, '0');
  }
};

//ฟังก์ชันแยกส่วนประกอบ (Sign, Exponent, Mantissa)
export const getComponents = (binaryStr, isDouble) => {
  const cleanStr = binaryStr.replace(/\s/g, '');
  
  if (isDouble) {
    //64-bit
    return {
      sign: cleanStr[0] || '0',
      exponent: cleanStr.slice(1, 12).padEnd(11, '0'),
      mantissa: cleanStr.slice(12).padEnd(52, '0'),
      bias: 1023
    };
  } else {
    //32-bit
    return {
      sign: cleanStr[0] || '0',
      exponent: cleanStr.slice(1, 9).padEnd(8, '0'),
      mantissa: cleanStr.slice(9).padEnd(23, '0'),
      bias: 127
    };
  }
};