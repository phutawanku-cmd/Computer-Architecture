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

export const getComponents = (binaryStr, isDouble) => {
  const cleanStr = binaryStr.replace(/\s/g, '');
  if (isDouble) {
    return { sign: cleanStr[0] || '0', exponent: cleanStr.slice(1, 12).padEnd(11, '0'), mantissa: cleanStr.slice(12).padEnd(52, '0'), bias: 1023 };
  } else {
    return { sign: cleanStr[0] || '0', exponent: cleanStr.slice(1, 9).padEnd(8, '0'), mantissa: cleanStr.slice(9).padEnd(23, '0'), bias: 127 };
  }
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

  // 1: EXTRACT (จัดการเครื่องหมายโชว์บน UI)
  let displayValB = valB;
  let opSymbol = '+';

  if (operation === 'SUB') {
    displayValB = -valB;
    opSymbol = '+'; // A + (-B)
  } else if (operation === 'MUL') {
    opSymbol = '×';
  } else if (operation === 'DIV') {
    opSymbol = '÷';
  }

  steps.push({ 
    type: 'EXTRACT',
    title: "1. แยกองค์ประกอบ (Extract)",
    data: { 
      valA: valA, 
      valB: displayValB,
      opSymbol: opSymbol,
      expA, expB, 
      manAStr: `1.${compA.mantissa.substring(0,6)}...`, 
      manBStr: `1.${compB.mantissa.substring(0,6)}...` 
    }
  });

  let resultMan = 0;
  let resultExp = 0;
  let resultSign = '0';
  if (operation === 'ADD' || operation === 'SUB') {
    let signValA = compA.sign === '1' ? -1 : 1;
    let signValB = compB.sign === '1' ? -1 : 1;
    if (operation === 'SUB') signValB *= -1; 

    //2:ALIGN
    if (expA > expB) {
      const shift = expA - expB;
      const oldManB = manB; manB = manB / Math.pow(2, shift);
      steps.push({ type: 'ALIGN', title: "2. ปรับเลขชี้กำลัง (Align)", data: { diff: shift, target: 'B', valBefore: oldManB.toFixed(6), valAfter: manB.toFixed(6), exp: expA } });
      expB = expA;
    } else if (expB > expA) {
      const shift = expB - expA;
      const oldManA = manA; manA = manA / Math.pow(2, shift);
      steps.push({ type: 'ALIGN', title: "2. ปรับเลขชี้กำลัง (Align)", data: { diff: shift, target: 'A', valBefore: oldManA.toFixed(6), valAfter: manA.toFixed(6), exp: expB } });
      expA = expB;
    } else {
      steps.push({ type: 'ALIGN_NONE', title: "2. ปรับเลขชี้กำลัง (Align)", data: { val: "Exponent เท่ากันแล้ว", exp: expA } });
    }

    //3:MANTISSA
    resultMan = (manA * signValA) + (manB * signValB);
    resultSign = resultMan < 0 ? '1' : '0';
    resultMan = Math.abs(resultMan);
    resultExp = expA;

    steps.push({ 
      type: 'COMPUTE', 
      title: operation === 'ADD' ? "3. บวกส่วน Mantissa" : "3. หักล้างส่วน Mantissa",
      data: { opA: (manA * signValA).toFixed(4), opB: (manB * signValB).toFixed(4), sign: '+', result: resultMan.toFixed(6) }
    });
  } 
  else if (operation === 'MUL' || operation === 'DIV') {
    resultSign = (compA.sign === compB.sign) ? '0' : '1';

    //2:EXPONENTCALCULATION
    if (operation === 'MUL') {
      resultExp = expA + expB;
      steps.push({ type: 'EXP_CALC', title: "2. รวมเลขชี้กำลัง (บวกกัน)", data: { expA, expB, op: '+', result: resultExp } });
    } else {
      resultExp = expA - expB;
      steps.push({ type: 'EXP_CALC', title: "2. หักล้างเลขชี้กำลัง (ลบกัน)", data: { expA, expB, op: '-', result: resultExp } });
    }

    //3:MANTISSACALCULATION
    if (operation === 'MUL') {
      resultMan = manA * manB;
      steps.push({ type: 'COMPUTE', title: "3. คูณส่วน Mantissa", data: { opA: manA.toFixed(4), opB: manB.toFixed(4), sign: '×', result: resultMan.toFixed(6) } });
    } else {
      resultMan = manB === 0 ? 0 : manA / manB;
      steps.push({ type: 'COMPUTE', title: "3. หารส่วน Mantissa", data: { opA: manA.toFixed(4), opB: manB.toFixed(4), sign: '÷', result: resultMan.toFixed(6) } });
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
    steps.push({ type: 'NORMALIZE', title: "4. จัดรูปมาตรฐาน (Overflow)", data: { mode: 'Overflow', shift: shiftCount, before: oldMan.toFixed(4), after: resultMan.toFixed(4), newExp: resultExp } });
  } else if (resultMan < 1.0) {
    let shiftCount = 0; const oldMan = resultMan;
    while (resultMan < 1.0 && resultExp > -126 && shiftCount < 30) { resultMan *= 2; resultExp--; shiftCount++; }
    steps.push({ type: 'NORMALIZE', title: "4. จัดรูปมาตรฐาน (Underflow)", data: { mode: 'Underflow', shift: shiftCount, before: oldMan.toFixed(4), after: resultMan.toFixed(4), newExp: resultExp } });
  } else {
    steps.push({ type: 'NORMALIZE_NONE', title: "4. จัดรูปมาตรฐาน", data: { val: resultMan.toFixed(4) } });
  }

  //5:สรุป
  let finalVal = 0;
  if (operation === 'ADD') finalVal = valA + valB;
  if (operation === 'SUB') finalVal = valA - valB;
  if (operation === 'MUL') finalVal = valA * valB;
  if (operation === 'DIV') finalVal = valA / valB;

  steps.push({ 
    type: 'FINAL', title: "5. ผลลัพธ์สุดท้าย", 
    data: { finalVal, binary: `Sign=${resultSign}, Exp=${resultExp + 127}, Mantissa=~${(resultMan-1).toFixed(6)}` }
  });

  return { result: finalVal, steps };
};