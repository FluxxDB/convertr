import { InitialSetup } from '@/components/covert/InitialSetup';
import { StyleSheet, View } from 'react-native';

export default function InitialSetupPage() {
  return (
    <View style={styles.container}>
      <InitialSetup />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
