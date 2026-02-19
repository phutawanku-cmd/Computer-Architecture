import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, Switch, TouchableOpacity, SafeAreaView, Platform, Dimensions, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { decimalToBinary, getComponents, simulateArithmetic } from './ieeeLogic';

const { width } = Dimensions.get('window');
const COLORS = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  subText: '#64748B',
  sign: '#3B82F6',
  exp: '#10B981',
  man: '#F97316',
  primary: '#4F46E5',
  danger: '#EF4444',
  border: '#E2E8F0',
  terminal: '#1E293B',
  terminalText: '#4ADE80'
};

export default function App() {
  const [isDouble, setIsDouble] = useState(false);
  const [decimalInput, setDecimalInput] = useState('0');
  const [binaryStr, setBinaryStr] = useState('');
  const [components, setComponents] = useState({ sign: '0', exponent: '', mantissa: '', bias: 127 });
  
  //SimulatorState
  const [simA, setSimA] = useState('12.5');
  const [simB, setSimB] = useState('2.5');
  const [operation, setOperation] = useState('ADD'); 
  const [simSteps, setSimSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  //LogicConverter
  const handleDecimalChange = (text) => {
    setDecimalInput(text);
    if (text === '' || text === '-' || text === '.' || text === '-.') {
      setBinaryStr(''); return;
    }
    const val = parseFloat(text);
    if (!isNaN(val)) setBinaryStr(decimalToBinary(val, isDouble));
  };

  useEffect(() => { handleDecimalChange(decimalInput); }, [isDouble]);
  useEffect(() => { setComponents(getComponents(binaryStr, isDouble)); }, [binaryStr, isDouble]);

  const rawExponent = parseInt(components.exponent, 2);
  const realExponent = isNaN(rawExponent) ? 0 : rawExponent - components.bias;

  //SimulatorHandler
  const handleSimulate = () => {
    const valA = parseFloat(simA);
    const valB = parseFloat(simB);
    
    if (isNaN(valA) || isNaN(valB)) return;
    let result = simulateArithmetic(valA, valB, operation);    
    setSimSteps(result.steps);
    setCurrentStep(0);
    setIsSimulating(true);
  };

  //HelperNavigation
  const nextStep = () => { if (currentStep < simSteps.length - 1) setCurrentStep(currentStep + 1); };
  const prevStep = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };
  const resetSim = () => { setIsSimulating(false); setSimSteps([]); setCurrentStep(0); };

  //RenderStepContent
  const renderStepContent = (step) => {
    const d = step.data;
    switch (step.type) {
      case 'EXTRACT':
        return (
          <View style={styles.stepContentBox}>
            <View style={styles.paramRow}>
              <View style={styles.paramBox}>
                 <Text style={styles.paramTitle}>Operand A</Text>
                 <Text style={styles.paramBigVal}>{d.valA}</Text>
                 <Text style={styles.paramDetail}>Exp: {d.expA}</Text>
                 <Text style={styles.paramDetail}>Man: {d.manAStr.substring(0,6)}..</Text>
              </View>
              <Text style={{fontSize: 24, fontWeight: 'bold', color: COLORS.subText}}>+</Text>
              <View style={styles.paramBox}>
                 <Text style={styles.paramTitle}>Operand B</Text>
                 <Text style={styles.paramBigVal}>{d.valB}</Text>
                 <Text style={styles.paramDetail}>Exp: {d.expB}</Text>
                 <Text style={styles.paramDetail}>Man: {d.manBStr.substring(0,6)}..</Text>
              </View>
            </View>
          </View>
        );
      case 'ALIGN':
        return (
          <View style={styles.stepContentBox}>
             <Text style={styles.instructionText}>
               Exponent ของ {d.target} น้อยกว่าอยู่ <Text style={{color: COLORS.danger, fontWeight:'bold'}}>{d.diff}</Text>
             </Text>
             <View style={styles.visualShiftContainer}>
                <View style={styles.shiftBlock}>
                   <Text style={styles.shiftLabel}>Before</Text>
                   <Text style={styles.shiftValue}>{d.valBefore}</Text>
                </View>
                <Ionicons name="arrow-down-circle" size={32} color={COLORS.primary} style={{marginVertical: 8}} />
                <View style={[styles.shiftBlock, {borderColor: COLORS.success, backgroundColor: '#ECFDF5'}]}>
                   <Text style={[styles.shiftLabel, {color: COLORS.success}]}>After Shift</Text>
                   <Text style={[styles.shiftValue, {color: COLORS.success}]}>{d.valAfter}</Text>
                </View>
             </View>
          </View>
        );
      case 'ADD':
        return (
          <View style={styles.stepContentBox}>
             <View style={styles.mathOperation}>
                <Text style={styles.mathText}>{d.opA}</Text>
                <View style={{flexDirection:'row', alignItems:'center', width:'100%'}}>
                   <Text style={{fontSize:24, marginRight: 10}}>+</Text>
                   <Text style={[styles.mathText, {borderBottomWidth: 2, borderColor: COLORS.text, flex:1}]}>{d.opB}</Text>
                </View>
                <Text style={[styles.mathText, {color: COLORS.primary, fontSize: 32, marginTop: 10}]}>{d.result}</Text>
             </View>
          </View>
        );
      case 'NORMALIZE':
         return (
            <View style={styles.stepContentBox}>
               <View style={[styles.statusBadge, {backgroundColor: d.mode==='Overflow' ? '#FEF3C7' : '#DBEAFE'}]}>
                  <Text style={{color: d.mode==='Overflow' ? '#D97706' : '#2563EB', fontWeight:'bold'}}>{d.mode} Detected</Text>
               </View>
               <View style={styles.visualShiftContainer}>
                  <Text style={styles.shiftValue}>{d.before}</Text>
                  <Ionicons name="arrow-forward" size={24} color={COLORS.subText} style={{marginVertical: 5}}/>
                  <Text style={[styles.shiftValue, {color: COLORS.primary, fontSize: 28}]}>{d.after}</Text>
               </View>
               <Text style={{marginTop: 10, color: COLORS.subText}}>New Exponent: {d.newExp}</Text>
            </View>
         );
      case 'NORMALIZE_NONE':
         return (
            <View style={styles.stepContentBox}>
               <Ionicons name="checkmark-circle" size={50} color={COLORS.success} style={{marginBottom: 10}} />
               <Text style={{fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 5}}>
                  Perfect!
               </Text>
               <Text style={{textAlign: 'center', color: COLORS.subText, marginBottom: 15}}>
                  Mantissa อยู่ในเกณฑ์มาตรฐานแล้วไม่ต้องขยับจุดทศนิยม
               </Text>
               <View style={styles.terminalBox}>
                  <Text style={[styles.terminalText, {fontSize: 20}]}>
                     {d.val}
                  </Text>
               </View>
            </View>
         );
      case 'FINAL':
         return (
            <View style={styles.stepContentBox}>
               <Text style={{fontSize: 48, fontWeight: '800', color: COLORS.primary}}>{d.finalVal}</Text>
               <View style={styles.terminalBox}>
                  <Text style={styles.terminalText}>{d.binary}</Text>
               </View>
            </View>
         );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* --- Header Section --- */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>IEEE 754</Text>
            <Text style={styles.appSubtitle}>Visualizer & Simulator</Text>
          </View>
          
          {/* Toggle Switch (Pill Style) */}
          <TouchableOpacity 
            style={styles.togglePill} 
            activeOpacity={0.8}
            onPress={() => setIsDouble(!isDouble)}
          >
             <View style={[styles.pillSegment, !isDouble && styles.pillActive]}>
                <Text style={[styles.pillText, !isDouble && styles.pillTextActive]}>32</Text>
             </View>
             <View style={[styles.pillSegment, isDouble && styles.pillActive]}>
                <Text style={[styles.pillText, isDouble && styles.pillTextActive]}>64</Text>
             </View>
          </TouchableOpacity>
        </View>

        {/* --- Card 1: Converter --- */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="swap-vertical" size={22} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Converter</Text>
          </View>
          
          <TextInput
            style={styles.mainInput}
            keyboardType="numeric"
            value={decimalInput}
            onChangeText={handleDecimalChange}
            placeholder="Type a number..."
            placeholderTextColor="#94A3B8"
          />

          <View style={styles.hexContainer}>
             <Text style={styles.hexLabel}>HEX</Text>
             <Text style={styles.hexValue}>
                {binaryStr && /^[01]+$/.test(binaryStr) 
                  ? '0x' + BigInt('0b' + binaryStr).toString(16).toUpperCase() 
                  : '-'}
             </Text>
          </View>
        </View>

        {/* --- Card 2: Bit Visualizer --- */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="hardware-chip-outline" size={22} color={COLORS.exp} />
            <Text style={styles.cardTitle}>Bit Structure</Text>
          </View>

          {/* Visualization Bars */}
          <View style={styles.bitVisContainer}>
             {/* Sign */}
             <View style={{flex: 1, marginRight: 4}}>
                <Text style={[styles.bitLabel, {color: COLORS.sign}]}>S</Text>
                <View style={[styles.bitBar, {backgroundColor: COLORS.sign}]}>
                   <Text style={styles.bitBarText}>{components.sign}</Text>
                </View>
             </View>
             {/* Exponent */}
             <View style={{flex: isDouble?3:2.5, marginRight: 4}}>
                <Text style={[styles.bitLabel, {color: COLORS.exp}]}>Exponent</Text>
                <View style={[styles.bitBar, {backgroundColor: COLORS.exp}]}>
                   <Text style={styles.bitBarText} numberOfLines={1}>{components.exponent}</Text>
                </View>
             </View>
             {/* Mantissa */}
             <View style={{flex: isDouble?6:5}}>
                <Text style={[styles.bitLabel, {color: COLORS.man}]}>Mantissa</Text>
                <View style={[styles.bitBar, {backgroundColor: COLORS.man}]}>
                   <Text style={styles.bitBarText} numberOfLines={1} ellipsizeMode="tail">{components.mantissa}</Text>
                </View>
             </View>
          </View>

          {/* Details */}
          <View style={styles.detailContainer}>
             <DetailItem label="Sign" value={components.sign === '0' ? '+' : '-'} color={COLORS.sign} />
             <DetailItem label="Raw Exp" value={rawExponent} color={COLORS.exp} />
             <DetailItem label="Real Exp" value={realExponent} color={COLORS.exp} />
          </View>
        </View>

        {/* --- Card 3: Simulator (The "Interactive Stepper") --- */}
        <View style={[styles.card, {padding: 0, overflow: 'hidden'}]}>
           <View style={[styles.cardTitleRow, {padding: 20, paddingBottom: 10}]}>
              <Ionicons name="calculator-outline" size={22} color={COLORS.man} />
              <Text style={styles.cardTitle}>Arithmetic Simulator</Text>
           </View>
           
           {/* Operation Tabs */}
           <View style={styles.tabContainer}>
              {['ADD', 'SUB', 'MUL', 'DIV'].map(op => (
                 <TouchableOpacity key={op} style={[styles.tabItem, operation === op && styles.tabItemActive]} onPress={() => setOperation(op)}>
                    <Text style={[styles.tabText, operation === op && styles.tabTextActive]}>{op}</Text>
                 </TouchableOpacity>
              ))}
           </View>

           {/* Content Area */}
           <View style={{padding: 20}}>
              {!isSimulating ? (
                 /* Start Screen */
                 <View style={styles.startScreen}>
                    <View style={styles.inputRow}>
                       <TextInput style={styles.simInput} value={simA} onChangeText={setSimA} keyboardType="numeric" />
                       <Text style={styles.opSymbol}>+</Text>
                       <TextInput style={styles.simInput} value={simB} onChangeText={setSimB} keyboardType="numeric" />
                    </View>
                    <TouchableOpacity style={styles.btnPrimary} onPress={handleSimulate}>
                       <Text style={styles.btnText}>Start Simulation</Text>
                       <Ionicons name="arrow-forward" size={20} color="white" style={{marginLeft: 8}}/>
                    </TouchableOpacity>
                 </View>
              ) : (
                 /* Stepper Screen */
                 <View style={styles.stepperScreen}>
                    {/* Progress Bar */}
                    <View style={styles.progressBarRow}>
                       {simSteps.map((_, i) => (
                          <View key={i} style={[styles.progressSegment, i <= currentStep ? {backgroundColor: COLORS.primary} : {backgroundColor: COLORS.border}]} />
                       ))}
                    </View>

                    {/* Step Header */}
                    <View style={styles.stepHeader}>
                       <Text style={styles.stepTitle}>{simSteps[currentStep].title}</Text>
                       <Text style={styles.stepCounter}>{currentStep + 1}/{simSteps.length}</Text>
                    </View>

                    {/* Step Content Visual */}
                    <View style={styles.stepVisualBox}>
                       <ScrollView nestedScrollEnabled>{renderStepContent(simSteps[currentStep])}</ScrollView>
                    </View>

                    {/* Controls */}
                    <View style={styles.controlsRow}>
                       <TouchableOpacity onPress={prevStep} disabled={currentStep===0} style={[styles.navBtn, currentStep===0 && styles.navBtnDisabled]}>
                          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
                       </TouchableOpacity>
                       
                       <TouchableOpacity onPress={resetSim} style={styles.btnSecondary}>
                          <Text style={{color: COLORS.text, fontWeight:'600'}}>Reset</Text>
                       </TouchableOpacity>

                       <TouchableOpacity onPress={nextStep} disabled={currentStep===simSteps.length-1} style={[styles.navBtn, styles.navBtnPrimary, currentStep===simSteps.length-1 && styles.navBtnDisabled]}>
                          <Ionicons name="chevron-forward" size={24} color="white" />
                       </TouchableOpacity>
                    </View>
                 </View>
              )}
           </View>
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}
//SubComponents
const DetailItem = ({ label, value, color }) => (
   <View style={{flexDirection: 'row', alignItems: 'center', marginRight: 15, marginBottom: 5}}>
      <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 6}} />
      <Text style={{fontSize: 12, color: COLORS.subText}}>{label}: <Text style={{fontWeight: 'bold', color: COLORS.text}}>{value}</Text></Text>
   </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: Platform.OS === 'android' ? 35 : 0 },
  scrollContainer: { padding: 16 },
  
  //Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  appTitle: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  appSubtitle: { fontSize: 14, color: COLORS.subText, fontWeight: '500' },
  
  //Toggle Pill
  togglePill: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 20, padding: 4 },
  pillSegment: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  pillActive: { backgroundColor: COLORS.primary, shadowColor: "#000", shadowOffset: {width:0,height:1}, shadowOpacity:0.2, elevation:2 },
  pillText: { fontSize: 12, fontWeight: '700', color: COLORS.subText },
  pillTextActive: { color: 'white' },

  //Cards
  card: { backgroundColor: COLORS.card, borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: "#64748B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginLeft: 8 },

  //Inputs
  mainInput: { fontSize: 32, fontWeight: '700', color: COLORS.text, borderBottomWidth: 2, borderColor: COLORS.border, paddingBottom: 8, marginBottom: 16, textAlign: 'center' },
  hexContainer: { backgroundColor: COLORS.terminal, borderRadius: 12, padding: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  hexLabel: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  hexValue: { color: COLORS.terminalText, fontFamily: Platform.OS==='ios'?'Courier':'monospace', fontSize: 16, fontWeight: 'bold' },

  //BitVisualizer
  bitVisContainer: { flexDirection: 'row', marginBottom: 16 },
  bitLabel: { fontSize: 10, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  bitBar: { height: 48, borderRadius: 8, justifyContent: 'center', paddingHorizontal: 8 },
  bitBarText: { color: 'white', fontWeight: 'bold', fontFamily: Platform.OS==='ios'?'Courier':'monospace' },
  detailContainer: { flexDirection: 'row', flexWrap: 'wrap' },

  //Simulator
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderColor: COLORS.border },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabItemActive: { borderBottomWidth: 3, borderColor: COLORS.primary },
  tabText: { fontWeight: '600', color: COLORS.subText },
  tabTextActive: { color: COLORS.primary, fontWeight: '800' },
  
  //StartScreen
  startScreen: { alignItems: 'center', paddingVertical: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, width: '100%' },
  simInput: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 12, padding: 16, fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: COLORS.text },
  opSymbol: { fontSize: 32, fontWeight: 'bold', color: COLORS.subText, marginHorizontal: 16 },
  btnPrimary: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, alignItems: 'center', width: '100%', justifyContent: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  //StepperUI
  stepperScreen: { },
  progressBarRow: { flexDirection: 'row', marginBottom: 16, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressSegment: { flex: 1, marginRight: 2 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  stepTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  stepCounter: { fontSize: 12, fontWeight: '700', color: COLORS.subText, backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  
  stepVisualBox: { minHeight: 180, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 16, justifyContent: 'center' },
  stepContentBox: { alignItems: 'center', width: '100%' },
  
  //ContentStyles
  paramRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%' },
  paramBox: { alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2, width: '40%' },
  paramTitle: { fontSize: 12, color: COLORS.subText, marginBottom: 4 },
  paramBigVal: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  paramDetail: { fontSize: 10, color: COLORS.subText },
  
  instructionText: { fontSize: 16, textAlign: 'center', color: COLORS.text, marginBottom: 16 },
  visualShiftContainer: { width: '100%', alignItems: 'center' },
  shiftBlock: { width: '100%', backgroundColor: 'white', borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, alignItems: 'center' },
  shiftLabel: { fontSize: 10, fontWeight: '700', color: COLORS.subText, textTransform: 'uppercase', marginBottom: 4 },
  shiftValue: { fontSize: 20, fontWeight: 'bold', fontFamily: Platform.OS==='ios'?'Courier':'monospace', color: COLORS.text },
  
  mathOperation: { alignItems: 'center' },
  mathText: { fontSize: 24, fontWeight: 'bold', fontFamily: Platform.OS==='ios'?'Courier':'monospace', color: COLORS.text },
  
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  terminalBox: { backgroundColor: COLORS.terminal, padding: 16, borderRadius: 12, marginTop: 16, width: '100%' },
  terminalText: { color: COLORS.terminalText, fontFamily: Platform.OS==='ios'?'Courier':'monospace', textAlign: 'center' },

  //Controls
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  navBtnPrimary: { backgroundColor: COLORS.primary },
  navBtnDisabled: { opacity: 0.3 },
  btnSecondary: { paddingVertical: 12, paddingHorizontal: 24 }
});