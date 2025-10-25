import { CurrencyConverter } from '@/components/CurrencyConverter';
import { StyleSheet, View } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
      <CurrencyConverter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

