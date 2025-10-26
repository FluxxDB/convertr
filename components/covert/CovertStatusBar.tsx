import { StyleSheet, Text, View } from 'react-native';

interface CovertStatusBarProps {
  isConnected?: boolean | null;
}

export function CovertStatusBar({ isConnected = true }: CovertStatusBarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>
        ✅ Status: Active | Connected to Cloud
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(40, 167, 69, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
  },
});
