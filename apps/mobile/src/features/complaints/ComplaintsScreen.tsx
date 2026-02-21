import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { mobileApi } from '../../shared/api';

type Props = {
  mobile: string;
  area: string;
  onScreenViewed: (screen: string) => void;
  onActionTracked: (feature: string, metadata?: Record<string, unknown>) => void;
};

export function ComplaintsScreen({ mobile, area, onScreenViewed, onActionTracked }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [status, setStatus] = useState('');

  const load = async () => {
    const response = await mobileApi.myComplaints(mobile);
    setItems(response.items);
  };

  useEffect(() => {
    onScreenViewed('complaints');
    void load();
  }, [mobile, onScreenViewed]);

  const onSubmit = async () => {
    if (title.trim().length < 3 || description.trim().length < 3) {
      setStatus('Title and description must be at least 3 chars');
      return;
    }
    try {
      await mobileApi.createComplaint({
        userId: mobile,
        title,
        description,
        category: 'water',
        area,
      });
      setTitle('');
      setDescription('');
      setStatus('Complaint submitted');
      onActionTracked('create_complaint', { area });
      await load();
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Complaints</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Issue title" />
      <TextInput
        style={[styles.input, styles.multi]}
        multiline
        value={description}
        onChangeText={setDescription}
        placeholder="Describe issue"
      />
      <Pressable style={styles.button} onPress={onSubmit}>
        <Text style={styles.buttonText}>Submit Complaint</Text>
      </Pressable>
      {status ? <Text style={styles.status}>{status}</Text> : null}

      <ScrollView style={styles.list}>
        {items.map((item) => (
          <View key={String(item._id ?? Math.random())} style={styles.item}>
            <Text style={styles.itemTitle}>{String(item.title ?? '')}</Text>
            <Text style={styles.itemDesc}>{String(item.description ?? '')}</Text>
            <Text style={styles.meta}>
              {String(item.category ?? '')} | {String(item.status ?? '')}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, gap: 8, flex: 1 },
  heading: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10 },
  multi: { minHeight: 80, textAlignVertical: 'top' },
  button: { backgroundColor: '#0f766e', borderRadius: 9, paddingVertical: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  status: { color: '#0369a1', fontSize: 12 },
  list: { maxHeight: 480 },
  item: { borderWidth: 1, borderColor: '#dbeafe', borderRadius: 10, padding: 8, marginBottom: 8 },
  itemTitle: { fontWeight: '700', color: '#0f172a' },
  itemDesc: { color: '#334155', marginTop: 3 },
  meta: { color: '#64748b', marginTop: 4, fontSize: 12 },
});

