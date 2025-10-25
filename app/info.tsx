import { CovertInfo } from '@/covert-app/components/CovertInfo';
import { StyleSheet, View } from 'react-native';

export default function InfoPage() {
  return (
    <View style={styles.container}>
      <CovertInfo />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
