import { SafeAreaView, StyleSheet } from 'react-native';
import { CovertApp } from './CovertApp';

export function CovertMain() {
  return (
    <SafeAreaView style={styles.container}>
      <CovertApp />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

