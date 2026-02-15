import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, Switch, TouchableOpacity, SafeAreaView, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { decimalToBinary, getComponents, simulateAddition } from './ieeeLogic';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#2563EB',   // สีหลัก (ปุ่ม, Active)
  success: '#10B981',   // สีเขียว (Exponent)
  warning: '#F59E0B',   // สีส้ม (Mantissa)
  bg: '#F1F5F9',        // พื้นหลังแอป
  card: '#FFFFFF',      // พื้นหลังการ์ด
  text: '#1E293B',      // สีตัวหนังสือหลัก
  textLight: '#64748B', // สีตัวหนังสือรอง
  terminal: '#1E293B',  // พื้นหลังส่วนแสดงผลบิต (Dark Mode)
  terminalText: '#4ADE80' // สีตัวหนังสือใน Terminal (Hacker Green)
};

export default function App() {
  const [isDouble, setIsDouble] = useState(false);
  const [decimalInput, setDecimalInput] = useState('0');
  const [binaryStr, setBinaryStr] = useState('');
  const [components, setComponents] = useState({ sign: '0', exponent: '', mantissa: '', bias: 127 });
  
  // Simulator State
  const [simA, setSimA] = useState('12.5');
  const [simB, setSimB] = useState('2.5');
  const [operation, setOperation] = useState('ADD'); 
  const [simSteps, setSimSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  // --- Logic เดิม ---
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

  //Simulator Handler
  const handleSimulate = () => {
    const valA = parseFloat(simA);
    const valB = parseFloat(simB);
    if (isNaN(valA) || isNaN(valB)) return;

    let result;
    if (operation === 'ADD') {
      result = simulateAddition(valA, valB);
    } else {
      //Placeholder สำหรับอนาคต (SUB, MUL, DIV)
      result = simulateAddition(valA, valB);
      result.steps.unshift({title: "Coming Soon", desc: "Logic for this operation is currently being implemented."});
    }
    setSimSteps(result.steps);
    setCurrentStep(0);
  };

  //Helper สำหรับปุ่ม Next/Prev
  const nextStep = () => {
    if (currentStep < simSteps.length - 1) setCurrentStep(currentStep + 1);
  };
  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>IEEE 754 <Text style={{color: COLORS.primary}}>Visualizer</Text></Text>
          <View style={styles.toggleContainer}>
            <Text style={styles.label}>{isDouble ? "64-bit" : "32-bit"}</Text>
            <Switch
              value={isDouble}
              onValueChange={setIsDouble}
              trackColor={{ false: "#CBD5E1", true: COLORS.success }}
              thumbColor={"#fff"}
            />
          </View>
        </View>

        {/* --- Card 1: Converter --- */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="swap-horizontal" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Converter</Text>
          </View>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={decimalInput}
            onChangeText={handleDecimalChange}
            placeholder="Enter decimal number..."
            placeholderTextColor="#94A3B8"
          />
          <View style={styles.hexBox}>
            <Text style={styles.hexLabel}>HEX:</Text>
            <Text style={styles.hexText}>
              {binaryStr && /^[01]+$/.test(binaryStr) 
                ? '0x' + BigInt('0b' + binaryStr).toString(16).toUpperCase() 
                : '-'}
            </Text>
          </View>
        </View>

        {/* --- Card 2: Visualizer (Bit Structure) --- */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="apps" size={20} color={COLORS.success} />
            <Text style={styles.cardTitle}>Bit Structure</Text>
          </View>
          
          <View style={styles.bitContainer}>
            <View style={[styles.bitBox, { backgroundColor: COLORS.primary, flex: 1 }]}>
              <Text style={styles.bitText}>{components.sign}</Text>
            </View>
            <View style={[styles.bitBox, { backgroundColor: COLORS.success, flex: isDouble ? 3 : 2.5 }]}>
              <Text style={styles.bitText} numberOfLines={1}>{components.exponent}</Text>
            </View>
            <View style={[styles.bitBox, { backgroundColor: COLORS.warning, flex: isDouble ? 6 : 5 }]}>
              <Text style={styles.bitText} numberOfLines={1} ellipsizeMode='tail'>{components.mantissa}</Text>
            </View>
          </View>
          
          <View style={styles.legendContainer}>
            <DetailRow color={COLORS.primary} label="Sign" value={components.sign === '0' ? '+' : '-'} />
            <DetailRow color={COLORS.success} label="Exponent" value={`Raw: ${rawExponent} | Real: ${realExponent}`} />
            <DetailRow color={COLORS.warning} label="Mantissa" value={`1.${components.mantissa.substring(0, 5)}...`} />
          </View>
        </View>

        {/* --- Card 3: Simulator (NEW UI: Stepper) --- */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calculator" size={20} color={COLORS.warning} />
            <Text style={styles.cardTitle}>Arithmetic Simulator</Text>
          </View>
          
          {/* Operation Tab */}
          <View style={styles.opContainer}>
            {['ADD', 'SUB', 'MUL', 'DIV'].map((op) => (
              <TouchableOpacity 
                key={op} 
                style={[styles.opBtn, operation === op && styles.opBtnActive]}
                onPress={() => setOperation(op)}
              >
                <Text style={[styles.opText, operation === op && styles.opTextActive]}>{op}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input Row */}
          <View style={styles.rowInput}>
             <TextInput style={styles.inputCenter} value={simA} onChangeText={setSimA} keyboardType="numeric"/>
             <Text style={styles.opSymbol}>
                {operation === 'ADD' ? '+' : operation === 'SUB' ? '-' : operation === 'MUL' ? '×' : '÷'}
             </Text>
             <TextInput style={styles.inputCenter} value={simB} onChangeText={setSimB} keyboardType="numeric"/>
          </View>

          <TouchableOpacity style={styles.runButton} onPress={handleSimulate}>
            <Text style={styles.runButtonText}>RUN SIMULATION</Text>
            <Ionicons name="play" size={16} color="white" style={{marginLeft: 5}}/>
          </TouchableOpacity>

          {/* --- Interactive Stepper Area --- */}
          {simSteps.length > 0 && (
            <View style={styles.stepperContainer}>
              
              {/* 1. Progress Bar (เส้นด้านบน) */}
              <View style={styles.progressRow}>
                {simSteps.map((_, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.progressSegment, 
                      index <= currentStep ? styles.progressActive : styles.progressInactive
                    ]} 
                  />
                ))}
              </View>

              {/* 2. Step Title & Counter */}
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitleMain}>{simSteps[currentStep].title}</Text>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{currentStep + 1} / {simSteps.length}</Text>
                </View>
              </View>

              {/* 3. Terminal View (Visual Area) */}
              <View style={styles.terminalBox}>
                <ScrollView nestedScrollEnabled>
                   <Text style={styles.terminalContent}>
                      {simSteps[currentStep].desc}
                   </Text>
                </ScrollView>
              </View>

              {/* 4. Controls (ปุ่มกดด้านล่าง) */}
              <View style={styles.controlsRow}>
                <TouchableOpacity 
                  onPress={prevStep} 
                  disabled={currentStep === 0}
                  style={[styles.controlBtn, styles.btnOutline, currentStep === 0 && styles.btnDisabled]}
                >
                  <Ionicons name="arrow-back" size={20} color={currentStep === 0 ? '#CBD5E1' : COLORS.text} />
                  <Text style={[styles.controlText, currentStep === 0 && {color: '#CBD5E1'}]}>Prev</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={nextStep} 
                  disabled={currentStep === simSteps.length - 1}
                  style={[styles.controlBtn, styles.btnFilled, currentStep === simSteps.length - 1 && styles.btnDisabled]}
                >
                  <Text style={[styles.controlText, {color: 'white'}]}>Next</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
              </View>

            </View>
          )}

        </View>

        <View style={{height: 50}} /> 
      </ScrollView>
    </SafeAreaView>
  );
}

//Component
const DetailRow = ({ color, label, value }) => (
  <View style={styles.detailRow}>
    <View style={[styles.colorDot, { backgroundColor: color }]} />
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: Platform.OS === 'android' ? 35 : 0 },
  scrollContainer: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  toggleContainer: { alignItems: 'flex-end' },
  label: { fontSize: 12, color: COLORS.textLight, marginBottom: 4 },
  
  //Card Styles
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity:0.05, shadowRadius:4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginLeft: 8, color: COLORS.text },
  
  //Input & Hex
  input: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 14, fontSize: 18, color: COLORS.text, borderWidth: 1, borderColor: '#E2E8F0', fontWeight: '600' },
  hexBox: { marginTop: 12, padding: 12, backgroundColor: '#334155', borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hexLabel: { color: '#94A3B8', fontWeight: '700', fontSize: 12 },
  hexText: { color: '#4ADE80', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold', fontSize: 14 },

  //Visualizer
  bitContainer: { flexDirection: 'row', height: 45, borderRadius: 8, overflow: 'hidden', marginBottom: 15 },
  bitBox: { justifyContent: 'center', alignItems: 'center' },
  bitText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  colorDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  detailLabel: { fontSize: 13, color: COLORS.textLight, marginRight: 5 },
  detailValue: { fontSize: 13, fontWeight: '600', color: COLORS.text },

  //Simulator
  opContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, backgroundColor: '#F1F5F9', borderRadius: 10, padding: 4 },
  opBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  opBtnActive: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 },
  opText: { fontWeight: '600', color: COLORS.textLight },
  opTextActive: { color: COLORS.primary, fontWeight: '800' },
  
  rowInput: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  inputCenter: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  opSymbol: { marginHorizontal: 12, fontSize: 24, fontWeight: '800', color: COLORS.textLight },
  
  runButton: { flexDirection: 'row', backgroundColor: COLORS.primary, padding: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  runButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },

  //STEPPER UI
  stepperContainer: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  
  //Progress Bar
  progressRow: { flexDirection: 'row', height: 4, width: '100%' },
  progressSegment: { flex: 1, marginRight: 2 },
  progressActive: { backgroundColor: COLORS.primary },
  progressInactive: { backgroundColor: '#E2E8F0' },

  //Header
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  stepTitleMain: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  stepBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  stepBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  //Terminal Box
  terminalBox: { backgroundColor: COLORS.terminal, padding: 20, minHeight: 120, justifyContent: 'center' },
  terminalContent: { color: COLORS.terminalText, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 15, lineHeight: 24 },

  //Controls
  controlsRow: { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#F8FAFC' },
  controlBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8 },
  btnOutline: { borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: 'white' },
  btnFilled: { backgroundColor: COLORS.primary },
  btnDisabled: { opacity: 0.5 },
  controlText: { fontWeight: '700', fontSize: 14, marginHorizontal: 6, color: COLORS.text }
});