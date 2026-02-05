import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, Switch, SafeAreaView, Platform, StatusBar } from 'react-native';
import { decimalToBinary, getComponents } from './ieeeLogic';

const COLORS = {
  sign: '#3B82F6',    
  exp: '#10B981',     
  mantissa: '#b64215',
  bg: '#F3F4F6',
  card: '#FFFFFF',
  text: '#1F2937'
};

export default function App() {
  const [isDouble, setIsDouble] = useState(false); 
  const [decimalInput, setDecimalInput] = useState('0');
  const [binaryStr, setBinaryStr] = useState('');
  const [components, setComponents] = useState({ sign: '0', exponent: '', mantissa: '', bias: 127 });
  const handleDecimalChange = (text) => {
    setDecimalInput(text);
    const val = parseFloat(text);
    if (!isNaN(val) || text === '') {
      const bin = decimalToBinary(val, isDouble);
      setBinaryStr(bin);
    }
  };

  //คำนวณใหม่เมื่อสลับโหมด
  useEffect(() => {
    handleDecimalChange(decimalInput);
  }, [isDouble]);

  //แยกชิ้นส่วน Sign/Exp/Mantissa
  useEffect(() => {
    const comps = getComponents(binaryStr, isDouble);
    setComponents(comps);
  }, [binaryStr, isDouble]);

  const rawExponent = parseInt(components.exponent, 2);
  const realExponent = isNaN(rawExponent) ? 0 : rawExponent - components.bias;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>IEEE 754 Visualizer</Text>
          <View style={styles.toggleContainer}>
            <Text style={styles.label}>{isDouble ? "64-bit (Double)" : "32-bit (Single)"}</Text>
            <Switch
              value={isDouble}
              onValueChange={setIsDouble}
              trackColor={{ false: "#767577", true: COLORS.exp }}
            />
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
              0x{binaryStr ? BigInt('0b' + binaryStr).toString(16).toUpperCase() : '0'}
            </Text>
          </View>
        </View>

        {/* Visualizer Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Structure Visualizer</Text>
          
          {/* แถบสีแสดงบิต */}
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

          {/* คำอธิบาย */}
          <View style={styles.legendContainer}>
            <DetailRow color={COLORS.sign} label="Sign" value={components.sign === '0' ? '+ (Positive)' : '- (Negative)'} />
            <DetailRow color={COLORS.exp} label={`Exponent (${components.exponent.length} bits)`} value={`Raw: ${rawExponent} | Actual: ${realExponent}`} />
            <DetailRow color={COLORS.mantissa} label={`Mantissa (${components.mantissa.length} bits)`} value={`1.${components.mantissa.substring(0, 5)}...`} />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

//Component สำหรับแสดงแถวข้อมูล
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
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: COLORS.text },
  label: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },
  hexBox: { backgroundColor: '#374151', padding: 12, borderRadius: 8, alignItems: 'center' },
  hexText: { color: '#ffffff', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 16, fontWeight: 'bold' },
  bitContainer: { flexDirection: 'row', height: 50, borderRadius: 8, overflow: 'hidden', marginBottom: 16 },
  bitBox: { justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  bitText: { color: 'white', fontWeight: 'bold', fontSize: 12, paddingHorizontal: 2 },
  legendContainer: { marginTop: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, marginRight: 8 },
  detailLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  detailValue: { fontSize: 13, color: '#4B5563' },
});