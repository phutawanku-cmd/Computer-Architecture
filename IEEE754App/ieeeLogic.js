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

export const getComponents = (binaryStr, isDouble) => {
  const cleanStr = binaryStr.replace(/\s/g, '');
  if (isDouble) {
    return { sign: cleanStr[0] || '0', exponent: cleanStr.slice(1, 12).padEnd(11, '0'), mantissa: cleanStr.slice(12).padEnd(52, '0'), bias: 1023 };
  } else {
    return { sign: cleanStr[0] || '0', exponent: cleanStr.slice(1, 9).padEnd(8, '0'), mantissa: cleanStr.slice(9).padEnd(23, '0'), bias: 127 };
  }
};
const formatBin = (val, fracBits = 8) => {
  if (isNaN(val)) return "NaN";
  if (val === 0) return "0." + "0".repeat(fracBits);
  
  let signStr = val < 0 ? "-" : "";
  let absVal = Math.abs(val);
  let intPart = Math.floor(absVal);
  let fracPart = absVal - intPart;
  
  let res = intPart.toString(2) + ".";
  
  // แปลงส่วนทศนิยมทีละบิต
  for (let i = 0; i < fracBits; i++) {
    fracPart *= 2;
    let b = Math.floor(fracPart);
    res += b;
    fracPart -= b;
  }
  return signStr + res;
};

export const simulateArithmetic = (valA, valB, operation = 'ADD') => {
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

  // 1: EXTRACT
  let displayValB = valB;
  let opSymbol = '+';

  if (operation === 'SUB') {
    displayValB = -valB;
    opSymbol = '+';
  } else if (operation === 'MUL') {
    opSymbol = '×';
  } else if (operation === 'DIV') {
    opSymbol = '÷';
  }
  const visualBits = 8; 

  steps.push({ 
    type: 'EXTRACT',
    title: "1. แยกองค์ประกอบ (Extract)",
    data: { 
      valA: valA, 
      valB: displayValB,
      opSymbol: opSymbol,
      expA, expB, 
      manAStr: formatBin(manA, visualBits), 
      manBStr: formatBin(manB, visualBits) 
    }
  });

  let resultMan = 0;
  let resultExp = 0;
  let resultSign = '0';

  // LOGIC สำหรับ "บวก" และ "ลบ"
  if (operation === 'ADD' || operation === 'SUB') {
    let signValA = compA.sign === '1' ? -1 : 1;
    let signValB = compB.sign === '1' ? -1 : 1;
    if (operation === 'SUB') signValB *= -1; 

    //2:ALIGN
    if (expA > expB) {
      const shift = expA - expB;
      const oldManB = manB; 
      manB = manB / Math.pow(2, shift);
      steps.push({ 
        type: 'ALIGN', 
        title: "2. เลื่อนจุดเพื่อให้ Exponent เท่ากัน", 
        data: { diff: shift, target: 'B', valBefore: formatBin(oldManB, visualBits), valAfter: formatBin(manB, visualBits), exp: expA } 
      });
      expB = expA;
    } else if (expB > expA) {
      const shift = expB - expA;
      const oldManA = manA; 
      manA = manA / Math.pow(2, shift);
      steps.push({ 
        type: 'ALIGN', 
        title: "2. เลื่อนจุดเพื่อให้ Exponent เท่ากัน", 
        data: { diff: shift, target: 'A', valBefore: formatBin(oldManA, visualBits), valAfter: formatBin(manA, visualBits), exp: expB } 
      });
      expA = expB;
    } else {
      steps.push({ type: 'ALIGN_NONE', title: "2. ปรับเลขชี้กำลัง (Align)", data: { val: "Exponent เท่ากันแล้ว ไม่ต้องเลื่อนบิต", exp: expA } });
    }

    //3:COMPUTE
    resultMan = (manA * signValA) + (manB * signValB);
    resultSign = resultMan < 0 ? '1' : '0';
    resultMan = Math.abs(resultMan);
    resultExp = expA;

    steps.push({ 
      type: 'COMPUTE', 
      title: operation === 'ADD' ? "3. บวก Mantissa (ฐานสอง)" : "3. หักล้าง Mantissa (ฐานสอง)",
      data: { 
        opA: formatBin(manA * signValA, visualBits), 
        opB: formatBin(manB * signValB, visualBits), 
        sign: '+', 
        result: formatBin(resultMan, visualBits) 
      }
    });
  } 
  //LOGIC สำหรับ "คูณ" และ "หาร"
  else if (operation === 'MUL' || operation === 'DIV') {
    resultSign = (compA.sign === compB.sign) ? '0' : '1';

    if (operation === 'MUL') {
      resultExp = expA + expB;
      steps.push({ type: 'EXP_CALC', title: "2. รวมเลขชี้กำลัง (บวกกัน)", data: { expA, expB, op: '+', result: resultExp } });
      resultMan = manA * manB;
      steps.push({ type: 'COMPUTE', title: "3. คูณแมนทิสซา (ฐานสอง)", data: { opA: formatBin(manA, visualBits), opB: formatBin(manB, visualBits), sign: '×', result: formatBin(resultMan, visualBits) } });
    } else {
      resultExp = expA - expB;
      steps.push({ type: 'EXP_CALC', title: "2. หักล้างเลขชี้กำลัง (ลบกัน)", data: { expA, expB, op: '-', result: resultExp } });
      resultMan = manB === 0 ? 0 : manA / manB;
      steps.push({ type: 'COMPUTE', title: "3. หารแมนทิสซา (ฐานสอง)", data: { opA: formatBin(manA, visualBits), opB: formatBin(manB, visualBits), sign: '÷', result: formatBin(resultMan, visualBits) } });
    }
  }

  //4:Normalize
  if (resultMan === 0 || isNaN(resultMan)) {
    steps.push({ type: 'FINISH_ZERO', title: "4. ผลลัพธ์เป็นศูนย์", data: { result: 0 } });
    return { result: 0, steps };
  }

  if (resultMan >= 2.0) {
    let shiftCount = 0; const oldMan = resultMan;
    while (resultMan >= 2.0) { resultMan /= 2; resultExp++; shiftCount++; }
    steps.push({ 
      type: 'NORMALIZE', title: "4. จัดรูปมาตรฐาน (Shift Right)", 
      data: { mode: 'Overflow', shift: shiftCount, before: formatBin(oldMan, visualBits), after: formatBin(resultMan, visualBits), newExp: resultExp } 
    });
  } else if (resultMan < 1.0) {
    let shiftCount = 0; const oldMan = resultMan;
    while (resultMan < 1.0 && resultExp > -126 && shiftCount < 30) { resultMan *= 2; resultExp--; shiftCount++; }
    steps.push({ 
      type: 'NORMALIZE', title: "4. จัดรูปมาตรฐาน (Shift Left)", 
      data: { mode: 'Underflow', shift: shiftCount, before: formatBin(oldMan, visualBits), after: formatBin(resultMan, visualBits), newExp: resultExp } 
    });
  } else {
    steps.push({ type: 'NORMALIZE_NONE', title: "4. จัดรูปมาตรฐาน", data: { val: formatBin(resultMan, visualBits) } });
  }

  //5:สรุป
  let finalVal = 0;
  if (operation === 'ADD') finalVal = valA + valB;
  if (operation === 'SUB') finalVal = valA - valB;
  if (operation === 'MUL') finalVal = valA * valB;
  if (operation === 'DIV') finalVal = valA / valB;

  const finalBinaryStr = decimalToBinary(finalVal, false);
  const finalComps = getComponents(finalBinaryStr, false);

  steps.push({ 
    type: 'FINAL', title: "5. ผลลัพธ์สุดท้าย", 
    data: { 
      finalVal, 
      binary: `${finalComps.sign} ${finalComps.exponent} ${finalComps.mantissa}` 
    }
  });

  return { result: finalVal, steps };
};