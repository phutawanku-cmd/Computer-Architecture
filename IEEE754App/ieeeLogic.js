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

export const simulateAddition = (valA, valB) => {
  const steps = [];
  const binA = decimalToBinary(valA, false); 
  const binB = decimalToBinary(valB, false);
  const compA = getComponents(binA, false);
  const compB = getComponents(binB, false);

  let expA = parseInt(compA.exponent, 2) - 127;
  let expB = parseInt(compB.exponent, 2) - 127;
  let manA = 1 + parseInt(compA.mantissa, 2) / Math.pow(2, 23);
  let manB = 1 + parseInt(compB.mantissa, 2) / Math.pow(2, 23);

  if (valA === 0) manA = 0;
  if (valB === 0) manB = 0;
  
  steps.push({ 
    title: "1.ยกองค์ประกอบ(Extract)", 
    desc: `A: 1.${compA.mantissa.substring(0,5)}... x 2^${expA}\nB: 1.${compB.mantissa.substring(0,5)}... x 2^${expB}` 
  });

  if (expA > expB) {
    const shift = expA - expB;
    manB = manB / Math.pow(2, shift);
    steps.push({ 
      title: "2.ปรับเลขยกกำลัง(Align)", 
      desc: `Exp \nB (${expB}) น้อยกว่า A (${expA})\nเลื่อนจุดทศนิยม B ไปทางซ้าย (Shift Right) ${shift} บิต\nMantissa B ใหม่: ${manB.toFixed(6)}...`
    });
    expB = expA;
  } else if (expB > expA) {
    const shift = expB - expA;
    manA = manA / Math.pow(2, shift);
    steps.push({ 
      title: "2.ปรับเลขยกกำลัง(Align)", 
      desc: `เลขชี้กำลัง A (${expA}) น้อยกว่า B (${expB})\nเลื่อน Mantissa A ไปทางขวา ${shift} บิต\nMantissa A ใหม่: ${manA.toFixed(6)}...`
    });
    expA = expB;
  } else {
    steps.push({ title: "2.ปรับเลขยกกำลัง(Align)", desc: "เลขชี้กำลังเท่ากันแล้วไม่ต้องเลื่อนบิต" });
  }

  const signValA = compA.sign === '1' ? -1 : 1;
  const signValB = compB.sign === '1' ? -1 : 1;
  
  let resultMan = (manA * signValA) + (manB * signValB);
  steps.push({ 
    title: "3.บวกส่วน Mantissa(Add)", 
    desc: `(${signValA === 1 ? '+' : '-'} ${manA.toFixed(4)}) + (${signValB === 1 ? '+' : '-'} ${manB.toFixed(4)}) \n= ${resultMan.toFixed(6)}...` 
  });

  let resultExp = expA;
  
  if (resultMan === 0) {
    steps.push({ title: "4.จัดรูปมาตรฐาน(Normalize)", desc: "ผลลัพธ์เป็นศูนย์(Zero)" });
    return { result: 0, steps };
  }

  const resultSign = resultMan < 0 ? '1' : '0';
  resultMan = Math.abs(resultMan);
  if (resultMan >= 2.0) {
    while (resultMan >= 2.0) {
      resultMan /= 2;
      resultExp++;
      steps.push({ title: "4.จัดรูปมาตรฐาน(Overflow)", desc: `Mantissa >= 2.0 เลื่อนบิตขวา (>>> 1)\nเพิ่มเลขชี้กำลังเป็น ${resultExp}` });
    }
  } 
  else if (resultMan < 1.0) {
    let loopCount = 0; 
    while (resultMan < 1.0 && resultExp > -126 && loopCount < 30) {
      resultMan *= 2;
      resultExp--;
      loopCount++;
    }
    steps.push({ title: "4. จัดรูปมาตรฐาน(Underflow)", desc: `Mantissa < 1.0 เลื่อนบิตซ้าย (<<) จนได้ 1.xxx\nลดเลขชี้กำลังเป็น ${resultExp}` });
  } else {
    steps.push({ title: "4. จัดรูปมาตรฐาน(Normalize)", desc: "Mantissa อยู่ในรูปมาตรฐานแล้ว (1.0 <= M < 2.0)" });
  }

  const finalVal = valA + valB;
  steps.push({ 
    title: "5.ผลลัพธ์(Final Result)", 
    desc: `ผลลัพธ์: ${finalVal}\n(รูปแบบฐานสอง: Sign=${resultSign}, Exp=${resultExp + 127}, Mantissa=~${(resultMan-1).toFixed(6)})`
  });

  return { result: finalVal, steps };
};