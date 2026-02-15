import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, Switch, TouchableOpacity, SafeAreaView, Platform, Dimensions } from 'react-native';
import { decimalToBinary, getComponents, simulateAddition } from './ieeeLogic';

const COLORS = {
  sign: '#3B82F6',    
  exp: '#10B981',     
  mantissa: '#F59E0B',
  bg: '#F3F4F6',
  card: '#FFFFFF',
  text: '#1F2937',
  primary: '#4F46E5',
  secondary: '#9CA3AF',
  danger: '#EF4444',
  success: '#10B981'
};

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function App() {
  const [isDouble, setIsDouble] = useState(false); 
  const [decimalInput, setDecimalInput] = useState('0');
  const [binaryStr, setBinaryStr] = useState('');
  const [components, setComponents] = useState({ sign: '0', exponent: '', mantissa: '', bias: 127 });
  
  //Simulator State
  const [simA, setSimA] = useState('12.5');
  const [simB, setSimB] = useState('2.5');
  const [simSteps, setSimSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0); // ตัวแปรคุมว่าอยู่ Step ไหน
  const [isSimulating, setIsSimulating] = useState(false);

  const handleDecimalChange = (text) => {
    setDecimalInput(text);
    if (text === '' || text === '-' || text === '.'){
      setBinaryStr('');
      return;
    }
    const val = parseFloat(text);
    if (!isNaN(val)){
      const bin = decimalToBinary(val, isDouble);
      setBinaryStr(bin);
    }
  };

  useEffect(() => { handleDecimalChange(decimalInput); }, [isDouble]);
  useEffect(() => {
    const comps = getComponents(binaryStr, isDouble);
    setComponents(comps);
  }, [binaryStr, isDouble]);

  const rawExponent = parseInt(components.exponent, 2);
  const realExponent = isNaN(rawExponent) ? 0 : rawExponent - components.bias;

  const handleSimulate = () => {
    const valA = parseFloat(simA);
    const valB = parseFloat(simB);
    if (!isNaN(valA) && !isNaN(valB)){
      const { steps } = simulateAddition(valA, valB);
      setSimSteps(steps);
      setCurrentStep(0); // Reset ไป step แรก
      setIsSimulating(true);
    }
  };

  const nextStep = () => {
    if (currentStep < simSteps.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  //ฟังก์ชันวาด UI แต่ละ Step
  const renderStepContent = (step) => {
    const d = step.data;
    switch (step.type) {
      case 'EXTRACT':
        return (
          <View>
            <View style={styles.paramBox}>
              <Text style={styles.paramLabel}>A ({d.valA})</Text>
              <Text style={styles.paramValue}>Exp: <Text style={{color:COLORS.exp, fontWeight:'bold'}}>{d.expA}</Text></Text>
              <Text style={styles.paramValue}>Man: {d.manAStr}</Text>
            </View>
            <View style={[styles.paramBox, {marginTop: 10}]}>
              <Text style={styles.paramLabel}>B ({d.valB})</Text>
              <Text style={styles.paramValue}>Exp: <Text style={{color:COLORS.exp, fontWeight:'bold'}}>{d.expB}</Text></Text>
              <Text style={styles.paramValue}>Man: {d.manBStr}</Text>
            </View>
          </View>
        );
      
      case 'ALIGN':
        return (
          <View style={{alignItems:'center'}}>
             <Text style={styles.descText}>
               Exponent ของ {d.target} น้อยกว่าอยู่ <Text style={{color:COLORS.danger, fontWeight:'bold'}}>{d.diff}</Text> ระดับ
             </Text>
             
             {/* Animation Visual */}
             <View style={styles.shiftBox}>
               <Text style={styles.shiftLabel}>Before</Text>
               <Text style={styles.shiftValue}>{d.valBefore}</Text>
             </View>
             
             <Text style={{fontSize: 24, marginVertical: 5}}>⬇️ Shift Right {d.diff} bit</Text>
             
             <View style={[styles.shiftBox, {borderColor: COLORS.success}]}>
               <Text style={styles.shiftLabel}>After</Text>
               <Text style={[styles.shiftValue, {color: COLORS.success}]}>{d.valAfter}</Text>
             </View>
             
             <Text style={{marginTop: 10, color:'#666', fontSize:12}}>* เพื่อให้ Exponent เท่ากันที่ {d.exp}</Text>
          </View>
        );

      case 'ADD':
        return (
          <View style={{alignItems:'center'}}>
            <Text style={{fontSize: 20, fontWeight:'bold', color:'#333'}}>{d.opA}</Text>
            <Text style={{fontSize: 20, fontWeight:'bold', color:'#333'}}>+ {d.opB}</Text>
            <View style={{height:2, width: '60%', backgroundColor:'#333', marginVertical:5}}/>
            <Text style={{fontSize: 24, fontWeight:'bold', color: COLORS.primary}}>{d.result}</Text>
          </View>
        );

      case 'NORMALIZE':
        return (
          <View style={{alignItems:'center'}}>
             <Text style={[styles.badge, {backgroundColor: d.mode==='Overflow' ? '#FEF3C7' : '#DBEAFE', color: d.mode==='Overflow' ? '#D97706' : '#2563EB'}]}>
                {d.mode} Detected!
             </Text>
             <Text style={{marginVertical:10, textAlign:'center', color:'#555'}}>
               ผลลัพธ์ {d.mode==='Overflow' ? 'เกิน 2.0' : 'ต่ำกว่า 1.0'} ต้องขยับจุด
             </Text>
             <Text style={styles.bigVal}>{d.before} ➡️ {d.after}</Text>
             <Text style={{marginTop:10}}>Exponent: {d.newExp}</Text>
          </View>
        );

      case 'FINAL':
         return (
           <View style={{alignItems:'center', padding: 10}}>
             <Text style={{fontSize: 40, fontWeight:'bold', color: COLORS.primary}}>{d.finalVal}</Text>
             <View style={{backgroundColor:'#1F2937', padding:10, borderRadius:8, marginTop:20, width:'100%'}}>
               <Text style={{color:'#10B981', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', textAlign:'center'}}>
                 {d.binary}
               </Text>
             </View>
           </View>
         );

      default:
        return <Text style={{textAlign:'center'}}>ไม่มีการเปลี่ยนแปลงในขั้นตอนนี้</Text>;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>IEEE 754 Visualizer</Text>
          <View style={styles.toggleContainer}>
            <Text style={styles.label}>{isDouble ? "64-bit" : "32-bit"}</Text>
            <Switch value={isDouble} onValueChange={setIsDouble} trackColor={{ false: "#767577", true: COLORS.exp }} />
          </View>
        </View>

        {/* Input Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Converter</Text>
          <Text style={styles.label}>Decimal Value:</Text> 
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={decimalInput}
            onChangeText={handleDecimalChange}
            placeholder="e.g. 10.5"
          />
          <Text style={styles.label}>Hex Representation:</Text>
          <View style={styles.hexBox}>
            <Text style={styles.hexText}>
              {binaryStr && /^[01]+$/.test(binaryStr)? '0x' + BigInt('0b' + binaryStr).toString(16).toUpperCase() : '-'}
            </Text>
          </View>
        </View>

        {/* Visualizer Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Structure Visualizer</Text>
          <View style={styles.bitContainer}>
            <View style={[styles.bitBox, { backgroundColor: COLORS.sign, flex: 1 }]}>
              <Text style={styles.bitText}>{components.sign}</Text>
            </View>
            <View style={[styles.bitBox, { backgroundColor: COLORS.exp, flex: isDouble ? 3 : 2.5 }]}>
              <Text style={styles.bitText} numberOfLines={1}>{components.exponent}</Text>
            </View>
            <View style={[styles.bitBox, { backgroundColor: COLORS.mantissa, flex: isDouble ? 6 : 5 }]}>
              <Text style={styles.bitText} numberOfLines={1} ellipsizeMode='tail'>{components.mantissa}</Text>
            </View>
          </View>
          <View style={styles.legendContainer}>
            <DetailRow color={COLORS.sign} label="Sign" value={components.sign === '0' ? '+ (Positive)' : '- (Negative)'} />
            <DetailRow color={COLORS.exp} label="Exponent" value={`Raw: ${rawExponent} | Actual: ${realExponent}`} />
            <DetailRow color={COLORS.mantissa} label="Mantissa" value={`1.${components.mantissa.substring(0, 5)}...`} />
          </View>
        </View>

        {/* --- REVAMPED ARITHMETIC SIMULATOR --- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Arithmetic Simulator</Text>
          
          {/* Inputs */}
          <View style={styles.rowInput}>
             <TextInput style={[styles.input, {flex:1, textAlign:'center'}]} value={simA} onChangeText={setSimA} keyboardType="numeric"/>
             <Text style={{fontSize: 20, fontWeight:'bold', marginHorizontal:10}}>+</Text>
             <TextInput style={[styles.input, {flex:1, textAlign:'center'}]} value={simB} onChangeText={setSimB} keyboardType="numeric"/>
          </View>
          
          {!isSimulating ? (
            <TouchableOpacity style={styles.startButton} onPress={handleSimulate}>
              <Text style={styles.buttonText}>Start Simulation 🚀</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.stepperContainer}>
              {/* Progress Dots */}
              <View style={styles.progressContainer}>
                {simSteps.map((_, idx) => (
                  <View key={idx} style={[styles.dot, {backgroundColor: idx === currentStep ? COLORS.primary : '#E5E7EB', width: idx === currentStep ? 20 : 8}]} />
                ))}
              </View>

              {/* Step Card */}
              <View style={styles.stepCard}>
                <Text style={styles.stepTitle}>{simSteps[currentStep].title}</Text>
                <View style={styles.stepContent}>
                  {renderStepContent(simSteps[currentStep])}
                </View>
              </View>

              {/* Controllers */}
              <View style={styles.controlRow}>
                <TouchableOpacity onPress={prevStep} disabled={currentStep === 0} style={[styles.navBtn, currentStep === 0 && {opacity:0.3}]}>
                  <Text style={styles.navBtnText}>⬅️ Back</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => setIsSimulating(false)} style={styles.resetBtn}>
                   <Text style={{color:'#666'}}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={nextStep} disabled={currentStep === simSteps.length - 1} style={[styles.navBtn, currentStep === simSteps.length - 1 && {opacity:0.3}]}>
                  <Text style={styles.navBtnText}>Next ➡️</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const DetailRow = ({ color, label, value }) => (
  <View style={styles.detailRow}>
    <View style={[styles.colorDot, { backgroundColor: color }]} />
    <View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: Platform.OS === 'android' ? 30 : 0 },
  scrollContainer: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  toggleContainer: { alignItems: 'flex-end' },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15, color: COLORS.text },
  label: { fontSize: 14, color: '#6B7280', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 10, color: COLORS.text, backgroundColor: '#FAFAFA' },
  hexBox: { backgroundColor: '#1F2937', padding: 12, borderRadius: 8, alignItems: 'center' },
  hexText: { color: '#ffffff', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 16, fontWeight: 'bold' },
  bitContainer: { flexDirection: 'row', height: 45, borderRadius: 8, overflow: 'hidden', marginBottom: 16, borderWidth:1, borderColor:'#E5E7EB' },
  bitBox: { justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  bitText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  legendContainer: { marginTop: 5 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  colorDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5, marginRight: 8 },
  detailLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  detailValue: { fontSize: 13, color: '#4B5563' },
  
  //Simulator Styles
  rowInput: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  startButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  stepperContainer: { marginTop: 10 },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 3 },
  stepCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#E5E7EB', minHeight: 180, justifyContent: 'center' },
  stepTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 10, textAlign:'center' },
  stepContent: { alignItems: 'center' },
  controlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  navBtn: { padding: 10, backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  navBtnText: { fontWeight: '600', color: COLORS.text },
  resetBtn: { padding: 10 },
  
  //Content Styles
  paramBox: { width: '100%', padding: 10, backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  paramLabel: { fontWeight: 'bold', marginBottom: 5, color: '#374151' },
  paramValue: { fontSize: 14, color: '#4B5563', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  descText: { textAlign: 'center', marginBottom: 10, color: '#4B5563' },
  shiftBox: { padding: 8, borderWidth: 2, borderColor: '#EF4444', borderRadius: 8, width: '100%', alignItems: 'center', backgroundColor: '#FEF2F2' },
  shiftLabel: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  shiftValue: { fontSize: 16, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#B91C1C' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  bigVal: { fontSize: 22, fontWeight: 'bold', color: COLORS.text }
});