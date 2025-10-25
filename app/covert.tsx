import { CovertMain } from '@/covert-app/components/CovertMain';
import { StyleSheet, View } from 'react-native';

export default function CovertApp() {
  return (
    <View style={styles.container}>
      <CovertMain />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

