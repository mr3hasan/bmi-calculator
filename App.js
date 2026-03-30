import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Dimensions, Animated,
  StatusBar, SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';

var screenWidth = Dimensions.get('window').width;

var CATEGORIES = [
  { label: 'Underweight', range: '<18.5',     color: '#3b82f6', max: 18.5 },
  { label: 'Normal',      range: '18.5-24.9', color: '#22c55e', max: 25   },
  { label: 'Overweight',  range: '25-29.9',   color: '#f97316', max: 30   },
  { label: 'Obese',       range: '>=30',      color: '#ef4444', max: Infinity },
];

function getCategory(bmi) {
  for (var i = 0; i < CATEGORIES.length; i++) {
    if (bmi < CATEGORIES[i].max) return CATEGORIES[i];
  }
  return CATEGORIES[3];
}

function toXY(cx, cy, r, deg) {
  var rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function makeArc(cx, cy, r, a1, a2) {
  var s = toXY(cx, cy, r, a1);
  var e = toXY(cx, cy, r, a2);
  var large = a2 - a1 > 180 ? 1 : 0;
  return 'M ' + s.x + ' ' + s.y + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + e.x + ' ' + e.y;
}

function GaugeChart(props) {
  var bmi = props.bmi;
  var hasResult = props.hasResult;
  var cx = 130, cy = 120, r = 95;

  var segs = [
    { color: '#3b82f6', from: -180, to: -135 },
    { color: '#22c55e', from: -135, to: -60  },
    { color: '#f97316', from: -60,  to: -15  },
    { color: '#ef4444', from: -15,  to: 0    },
  ];

  var dots = [
    { label: '18.5', angle: -135 },
    { label: '25',   angle: -60  },
    { label: '30',   angle: -15  },
  ];

  var clamped = Math.max(10, Math.min(40, bmi));
  var needleAngle = hasResult ? (-180 + ((clamped - 10) / 30) * 180) : -180;
  var needleRad = (needleAngle * Math.PI) / 180;
  var tip = {
    x: cx + 75 * Math.cos(needleRad),
    y: cy + 75 * Math.sin(needleRad),
  };
  var cat = hasResult ? getCategory(bmi) : null;
  var needleColor = hasResult ? cat.color : '#d1d5db';

  return (
    <Svg width={screenWidth - 48} height={145} viewBox="0 0 260 145">
      <Path d={makeArc(cx, cy, r, -180, 0)} fill="none" stroke="#e5e7eb" strokeWidth="20" />
      {segs.map(function(seg, i) {
        return <Path key={i} d={makeArc(cx, cy, r, seg.from, seg.to)} fill="none" stroke={seg.color} strokeWidth="20" opacity="0.85" />;
      })}
      {dots.map(function(d, i) {
        var lp = toXY(cx, cy, r + 16, d.angle - 2);
        return <SvgText key={i} x={lp.x} y={lp.y} fontSize="9" fill="#9ca3af" textAnchor="middle">{d.label}</SvgText>;
      })}
      <Path d={'M ' + cx + ' ' + cy + ' L ' + tip.x + ' ' + tip.y} stroke={needleColor} strokeWidth="3" strokeLinecap="round" />
      <Circle cx={cx} cy={cy} r="7" fill={needleColor} />
      <Circle cx={cx} cy={cy} r="3.5" fill="white" />
    </Svg>
  );
}

export default function App() {
  var ageState = useState('');
  var age = ageState[0];
  var setAge = ageState[1];

  var genderState = useState('male');
  var gender = genderState[0];
  var setGender = genderState[1];

  var feetState = useState('');
  var feet = feetState[0];
  var setFeet = feetState[1];

  var inchState = useState('');
  var inch = inchState[0];
  var setInch = inchState[1];

  var weightState = useState('');
  var weight = weightState[0];
  var setWeight = weightState[1];

  var bmiState = useState(null);
  var bmi = bmiState[0];
  var setBmi = bmiState[1];

  var errorState = useState('');
  var error = errorState[0];
  var setError = errorState[1];

  var doneState = useState(false);
  var done = doneState[0];
  var setDone = doneState[1];

  var fadeAnim = useRef(new Animated.Value(0)).current;

  function calculate() {
    setError('');
    if (!age || !feet || !weight) {
      setError('Please fill in all fields.');
      return;
    }
    var h = (parseFloat(feet) * 12 + (parseFloat(inch) || 0)) * 0.0254;
    var w = parseFloat(weight);
    if (h <= 0 || w <= 0) {
      setError('Please enter valid height and weight.');
      return;
    }
    var val = w / (h * h);
    setBmi(val);
    setDone(true);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }

  function reset() {
    setAge('');
    setFeet('');
    setInch('');
    setWeight('');
    setBmi(null);
    setDone(false);
    setError('');
  }

  var cat = done ? getCategory(bmi) : null;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#e2e8f0" />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <View style={s.card}>
          <Text style={s.title}>BMI Calculator</Text>
          <Text style={s.subtitle}>Calculate your Body Mass Index</Text>

          <Text style={s.label}>Age</Text>
          <TextInput style={s.input} placeholder="Enter your age" placeholderTextColor="#9ca3af" keyboardType="numeric" value={age} onChangeText={setAge} />

          <Text style={s.label}>Gender</Text>
          <View style={s.row}>
            <TouchableOpacity onPress={function() { setGender('male'); }} style={[s.gBtn, gender === 'male' && s.gBtnActive]}>
              <Text style={[s.gText, gender === 'male' && s.gTextActive]}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={function() { setGender('female'); }} style={[s.gBtn, gender === 'female' && s.gBtnActive]}>
              <Text style={[s.gText, gender === 'female' && s.gTextActive]}>Female</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.label}>Height</Text>
          <View style={s.row}>
            <View style={s.inputWrap}>
              <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="Feet" placeholderTextColor="#9ca3af" keyboardType="numeric" value={feet} onChangeText={setFeet} />
              <Text style={s.unit}>ft</Text>
            </View>
            <View style={{ width: 10 }} />
            <View style={s.inputWrap}>
              <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="Inches" placeholderTextColor="#9ca3af" keyboardType="numeric" value={inch} onChangeText={setInch} />
              <Text style={s.unit}>in</Text>
            </View>
          </View>

          <Text style={[s.label, { marginTop: 14 }]}>Weight</Text>
          <View style={s.inputWrap}>
            <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="Enter your weight" placeholderTextColor="#9ca3af" keyboardType="numeric" value={weight} onChangeText={setWeight} />
            <Text style={s.unit}>kg</Text>
          </View>

          {!!error && <Text style={s.error}>{error}</Text>}
        </View>

        <View style={s.card}>
          <GaugeChart bmi={bmi || 0} hasResult={done} />
          <View style={s.bmiBox}>
            {done ? (
              <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
                <Text style={[s.bmiVal, { color: cat.color }]}>{bmi.toFixed(1)}</Text>
                <Text style={[s.bmiCat, { color: cat.color }]}>{cat.label}</Text>
              </Animated.View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={s.bmiDash}>-- --</Text>
                <Text style={s.bmiLabel}>BMI</Text>
              </View>
            )}
          </View>
          <View style={s.msgBox}>
            <Text style={s.msgText}>
              {done ? ('Your BMI of ' + bmi.toFixed(1) + ' falls in the ' + cat.label + ' range.') : 'Fill in the form above and tap Calculate to see your BMI result.'}
            </Text>
          </View>
          <View style={s.legend}>
            {CATEGORIES.map(function(c) {
              return (
                <View key={c.label} style={s.legendItem}>
                  <View style={[s.dot, { backgroundColor: c.color }]} />
                  <Text style={s.legendText}>{c.range}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <TouchableOpacity style={[s.btn, done && s.btnReset]} onPress={done ? reset : calculate} activeOpacity={0.85}>
          <Text style={[s.btnText, done && s.btnTextReset]}>{done ? 'Reset' : 'Calculate BMI'}</Text>
        </TouchableOpacity>

        <Text style={s.footer}>BMI is a screening tool, not a diagnostic measure.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

var s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#e2e8f0' },
  scroll:       { padding: 16, paddingBottom: 32 },
  card:         { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  title:        { fontSize: 24, fontWeight: '700', color: '#111827', textAlign: 'center' },
  subtitle:     { fontSize: 13, color: '#9ca3af', textAlign: 'center', marginTop: 2, marginBottom: 18 },
  label:        { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input:        { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: '#374151', marginBottom: 14 },
  inputWrap:    { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16, paddingHorizontal: 14 },
  unit:         { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  row:          { flexDirection: 'row', gap: 10, marginBottom: 0 },
  gBtn:         { flex: 1, paddingVertical: 13, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center' },
  gBtnActive:   { backgroundColor: '#111827' },
  gText:        { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  gTextActive:  { color: '#fff' },
  error:        { color: '#ef4444', fontSize: 12, textAlign: 'center', marginTop: 6 },
  bmiBox:       { alignItems: 'center', marginVertical: 8 },
  bmiVal:       { fontSize: 42, fontWeight: '700' },
  bmiCat:       { fontSize: 15, fontWeight: '600', marginTop: 2 },
  bmiDash:      { fontSize: 28, color: '#d1d5db', fontWeight: '700', letterSpacing: 4 },
  bmiLabel:     { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  msgBox:       { backgroundColor: '#f9fafb', borderRadius: 16, padding: 12, marginBottom: 14 },
  msgText:      { fontSize: 12, color: '#6b7280', textAlign: 'center', lineHeight: 18 },
  legend:       { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  legendItem:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:          { width: 10, height: 10, borderRadius: 5 },
  btn:          { backgroundColor: '#111827', borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 },
  btnReset:     { backgroundColor: '#f1f5f9' },
  btnText:      { fontSize: 16, fontWeight: '600', color: '#fff' },
  btnTextReset: { color: '#6b7280' },
  footer:       { fontSize: 11, color: '#9ca3af', textAlign: 'center' },
});
