import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { mobileApi } from '../../shared/api';

type Props = {
  mobile: string;
  area: string;
  onScreenViewed: (screen: string) => void;
  onActionTracked: (feature: string, metadata?: Record<string, unknown>) => void;
};

export function FeedScreen({ mobile, area, onScreenViewed, onActionTracked }: Props) {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');

  const load = async () => {
    const response = await mobileApi.getFeed(area);
    setItems(response.items);
  };

  useEffect(() => {
    onScreenViewed('feed');
    void load();
  }, [area, onScreenViewed]);

  const onPost = async () => {
    try {
      await mobileApi.createPost({
        userId: mobile,
        content,
        category: 'thought',
        locationTag: area,
      });
      setContent('');
      setStatus('Posted');
      onActionTracked('create_post', { area });
      await load();
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  const onReact = async (postId: string, action: 'like' | 'comment' | 'report') => {
    try {
      await mobileApi.reactPost(postId, { userId: mobile, action });
      onActionTracked(`post_${action}`, { postId });
      await load();
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  const onUrgent = async (postId: string) => {
    try {
      const result = await mobileApi.urgentPost(postId, mobile);
      setStatus(`Urgent -> suggested ${String(result.suggestedTo ?? 0)}`);
      onActionTracked('mark_urgent', { postId });
      await load();
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Community Feed</Text>
      <TextInput style={styles.input} value={content} onChangeText={setContent} placeholder="Share something..." />
      <Pressable style={styles.button} onPress={onPost}>
        <Text style={styles.buttonText}>Post</Text>
      </Pressable>
      {status ? <Text style={styles.status}>{status}</Text> : null}

      <ScrollView style={styles.list}>
        {items.map((item) => {
          const postId = String(item._id ?? '');
          return (
            <View key={postId} style={styles.item}>
              <Text style={styles.itemText}>{String(item.content ?? '')}</Text>
              <Text style={styles.meta}>
                Score {String(item.score ?? 0)} | U {String(item.urgentVotes ?? 0)} | I {String(item.importantVotes ?? 0)}
              </Text>
              <View style={styles.row}>
                <Pressable style={styles.smallBtn} onPress={() => void onReact(postId, 'like')}>
                  <Text style={styles.smallText}>Like</Text>
                </Pressable>
                <Pressable style={styles.smallBtn} onPress={() => void onReact(postId, 'comment')}>
                  <Text style={styles.smallText}>Comment+</Text>
                </Pressable>
                <Pressable style={styles.smallBtn} onPress={() => void onUrgent(postId)}>
                  <Text style={styles.smallText}>Urgent</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, gap: 8, flex: 1 },
  heading: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10 },
  button: { backgroundColor: '#0f766e', borderRadius: 9, paddingVertical: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  status: { color: '#0369a1', fontSize: 12 },
  list: { maxHeight: 480 },
  item: { borderWidth: 1, borderColor: '#dbeafe', borderRadius: 10, padding: 8, marginBottom: 8 },
  itemText: { color: '#0f172a' },
  meta: { color: '#475569', fontSize: 12, marginTop: 4 },
  row: { flexDirection: 'row', gap: 6, marginTop: 6 },
  smallBtn: { backgroundColor: '#334155', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  smallText: { color: '#fff', fontSize: 12 },
});

