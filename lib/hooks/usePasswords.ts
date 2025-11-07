import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import type { PasswordEntry } from '../types';
import { PasswordStorage } from '../services/storage';
import { generateId } from '../utils/password';

export const usePasswords = () => {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPasswords();
  }, []);

  const loadPasswords = useCallback(async () => {
    try {
      const stored = await PasswordStorage.getAll();
      setPasswords(stored);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as senhas salvas.');
    } finally {
      setLoading(false);
    }
  }, []);

  const addPassword = useCallback(
    async (service: string, username: string, password: string) => {
      try {
        const newEntry: PasswordEntry = {
          id: await generateId(),
          service,
          username,
          password,
        };
        const updated = await PasswordStorage.add(newEntry);
        setPasswords(updated);
        Alert.alert('Sucesso!', 'Senha salva!');
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível salvar a senha.');
        throw error;
      }
    },
    []
  );

  const updatePassword = useCallback(
    async (id: string, service: string, username: string, password: string) => {
      try {
        const updated = await PasswordStorage.update(id, { service, username, password });
        setPasswords(updated);
        Alert.alert('Sucesso!', 'Senha atualizada!');
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível atualizar a senha.');
        throw error;
      }
    },
    []
  );

  const deletePassword = useCallback(async (id: string) => {
    try {
      const updated = await PasswordStorage.delete(id);
      setPasswords(updated);
      Alert.alert('Sucesso!', 'Senha excluída!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível excluir a senha.');
    }
  }, []);

  const importPasswords = useCallback(async (newPasswords: PasswordEntry[]) => {
    try {
      const updated = [...passwords, ...newPasswords];
      await PasswordStorage.save(updated);
      setPasswords(updated);
    } catch (error) {
      throw error;
    }
  }, [passwords]);

  return {
    passwords,
    loading,
    addPassword,
    updatePassword,
    deletePassword,
    importPasswords,
    refreshPasswords: loadPasswords,
  };
};

