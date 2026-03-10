import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFinance } from '@/context/FinanceContext';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PRESET_ICONS = [
  'star', 'heart', 'coffee', 'music', 'camera', 'book', 'bike', 'basketball',
  'soccer', 'flower', 'tree', 'pizza', 'beer', 'cocktail', 'gamepad-variant',
  'dog', 'cat', 'baby', 'dumbbell', 'meditation', 'brush', 'hammer', 'wrench',
  'leaf', 'fire', 'water', 'weather-sunny', 'cloud', 'bank', 'cash',
];

const PRESET_COLORS = [
  '#FF6B6B', '#FF8E53', '#FFC300', '#A8E063', '#4CAF50',
  '#26C6DA', '#42A5F5', '#5C6BC0', '#AB47BC', '#EC407A',
  '#8D6E63', '#78909C', '#26A69A', '#66BB6A', '#EF5350',
];

export function AddCategoryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { addCustomCategory } = useFinance();
  const categoryType = route.params?.type ?? 'both';

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('star');
  const [color, setColor] = useState('#FF6B6B');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) { Alert.alert('Enter a category name'); return; }
    setLoading(true);
    await addCustomCategory({ name: name.trim(), icon, color, type: categoryType });
    setLoading(false);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
        <Text style={styles.title}>New Category</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Preview */}
        <View style={styles.preview}>
          <View style={[styles.previewIcon, { backgroundColor: color + '33' }]}>
            <MaterialCommunityIcons name={icon as any} size={28} color={color} />
          </View>
          <Text style={styles.previewName}>{name || 'Category Name'}</Text>
        </View>

        <AppInput label="Category Name" value={name} onChangeText={setName} placeholder="e.g. Gym, Pets, Hobbies" />

        <Text style={styles.sectionLabel}>Pick a Color</Text>
        <View style={styles.colorGrid}>
          {PRESET_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Pick an Icon</Text>
        <View style={styles.iconGrid}>
          {PRESET_ICONS.map((ic) => (
            <TouchableOpacity
              key={ic}
              style={[styles.iconBtn, icon === ic && styles.iconBtnActive]}
              onPress={() => setIcon(ic)}
            >
              <MaterialCommunityIcons name={ic as any} size={22} color={icon === ic ? Colors.primary : Colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <AppButton title="Create Category" onPress={handleAdd} loading={loading} style={{ marginTop: Theme.spacing.lg }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Theme.spacing.md, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cancel: { fontSize: Theme.fontSize.md, color: Colors.primary },
  title: { fontSize: Theme.fontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  content: { padding: Theme.spacing.lg, paddingBottom: 40 },
  preview: { alignItems: 'center', marginBottom: Theme.spacing.lg, padding: Theme.spacing.lg, backgroundColor: Colors.card, borderRadius: Theme.radius.xl },
  previewIcon: { width: 64, height: 64, borderRadius: Theme.radius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: Theme.spacing.sm },
  previewName: { fontSize: Theme.fontSize.lg, fontWeight: '600', color: Colors.textPrimary },
  sectionLabel: { fontSize: Theme.fontSize.sm, fontWeight: '500', color: Colors.textSecondary, marginBottom: Theme.spacing.sm, marginTop: Theme.spacing.sm },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Theme.spacing.md },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  colorDotActive: { borderWidth: 3, borderColor: Colors.primary, transform: [{ scale: 1.15 }] },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconBtn: { width: 48, height: 48, borderRadius: Theme.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card, borderWidth: 2, borderColor: 'transparent' },
  iconBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.cardMint },
});
