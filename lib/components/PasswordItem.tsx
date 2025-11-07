import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import type { PasswordItemProps } from '../types';

const PasswordItem = React.memo<PasswordItemProps>(({ item, onDelete, onEdit }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const copyToClipboard = useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copiado!', 'A senha foi copiada para a área de transferência.');
  }, []);

  const handleEdit = useCallback(() => onEdit(item), [onEdit, item]);
  const handleDelete = useCallback(() => onDelete(item.id), [onDelete, item.id]);
  const handleCopy = useCallback(() => copyToClipboard(item.password), [item.password]);

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.service}>{item.service}</Text>
        <Text style={styles.username}>{item.username}</Text>
        <View style={styles.passwordRow}>
          <Text style={styles.password}>
            {isPasswordVisible ? item.password : '••••••••'}
          </Text>
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeIcon}
          >
            <Feather
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={18}
              color="#4A90E2"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
          <Feather name="edit-2" size={20} color="#4A90E2" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCopy} style={styles.actionButton}>
          <Feather name="copy" size={20} color="#4A90E2" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
          <Feather name="trash-2" size={20} color="#D0021B" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

PasswordItem.displayName = 'PasswordItem';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  info: {
    flex: 1,
  },
  service: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  password: {
    fontSize: 14,
    color: '#999',
    marginRight: 8,
  },
  eyeIcon: {
    padding: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
});

export default PasswordItem;

