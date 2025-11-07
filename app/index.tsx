import { Feather } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  FlatList,
  Keyboard,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChangePasswordModal, DrawerMenu, PasswordItem, PasswordModal } from '@/lib/components';
import { APP_NAME, LINKEDIN_URL } from '@/lib/constants/storage';
import { usePasswords } from '@/lib/hooks/usePasswords';
import { clearAllData } from '@/lib/services/storage';
import type { PasswordEntry } from '@/lib/types';
import { exportPasswordsToCSV, importPasswordsFromCSV } from '@/lib/utils/file';
import AuthScreen from './auth';

export default function App() {
  const {
    passwords,
    addPassword,
    updatePassword,
    deletePassword,
    importPasswords,
    refreshPasswords,
  } = usePasswords();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const appState = useRef(AppState.currentState);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        setIsAuthenticated(false);
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  const handleSavePassword = async (
    service: string,
    username: string,
    password: string
  ) => {
    try {
      if (editingPassword) {
        await updatePassword(editingPassword.id, service, username, password);
      } else {
        await addPassword(service, username, password);
      }
      setModalVisible(false);
      setEditingPassword(null);
      Keyboard.dismiss();
    } catch {
    }
  };

  const handleDeletePassword = useCallback((id: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Você tem certeza que deseja excluir esta senha? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deletePassword(id),
        },
      ]
    );
  }, [deletePassword]);

  const handleEditPassword = useCallback((item: PasswordEntry) => {
    setEditingPassword(item);
    setModalVisible(true);
  }, []);

  const handleExportPasswords = async () => {
    try {
      await exportPasswordsToCSV(passwords);
      Alert.alert('Sucesso!', 'Senhas exportadas com sucesso!');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível exportar as senhas.');
    }
  };

  const handleImportPasswords = async () => {
    try {
      const { passwords: newPasswords, errorCount } = await importPasswordsFromCSV(passwords);

      if (newPasswords.length === 0 && errorCount === 0) {
        Alert.alert('Nenhuma senha nova', 'Todas as senhas do arquivo já existem.');
        return;
      }

      if (newPasswords.length > 0) {
        await importPasswords(newPasswords);

        if (errorCount > 0) {
          Alert.alert(
            'Importação parcial',
            `${newPasswords.length} senha(s) importada(s).\n${errorCount} linha(s) com erro.`
          );
        } else {
          Alert.alert('Sucesso!', `${newPasswords.length} senha(s) importada(s)!`);
        }
      } else if (errorCount > 0) {
        Alert.alert(
          'Erro na importação',
          'Não foi possível importar as senhas. Verifique o formato do arquivo.'
        );
      }
    } catch (error: any) {
      if (error.message === 'Nenhum arquivo selecionado') return;
      Alert.alert('Formato Inválido', error.message || 'Não foi possível importar as senhas.');
    }
  };

  const handleOpenLinkedIn = async () => {
    try {
      const canOpen = await Linking.canOpenURL(LINKEDIN_URL);
      if (canOpen) {
        await Linking.openURL(LINKEDIN_URL);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o link.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir o link.');
    }
  };

  const handleResetApp = () => {
    Alert.alert(
      'ATENÇÃO: Resetar App',
      'Isso vai apagar TODAS as suas senhas, senha mestra e dados do app.\n\nEsta ação NÃO pode ser desfeita!\n\nTem certeza?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Tenho Certeza',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmação Final',
              'Última chance! Todos os dados serão perdidos permanentemente.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'APAGAR TUDO',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await clearAllData();
                      await refreshPasswords();
                      setIsAuthenticated(false);
                      Alert.alert('App Resetado', 'Todos os dados foram removidos com sucesso.');
                    } catch (error) {
                      Alert.alert('Erro', 'Não foi possível resetar o app.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const filteredPasswords = passwords.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.service.toLowerCase().includes(query) ||
      item.username.toLowerCase().includes(query)
    );
  });

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.menuButton}>
            <Feather name="menu" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.appName}>{APP_NAME}</Text>
        </View>
        <View style={styles.headerActions}>
          {passwords.length > 0 && (
            <TouchableOpacity onPress={() => setSearchVisible(true)} style={styles.searchButton}>
              <Feather name="search" size={22} color="#4A90E2" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              setEditingPassword(null);
              setModalVisible(true);
            }}
            style={styles.addButton}
          >
            <Feather name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {searchVisible && passwords.length > 0 && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Feather name="search" size={18} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por serviço ou usuário..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity
              onPress={() => {
                setSearchVisible(false);
                setSearchQuery('');
              }}
              style={styles.searchCloseButton}
            >
              <Feather name="x" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          {searchQuery.trim() !== '' && (
            <Text style={styles.searchResults}>
              {filteredPasswords.length} resultado{filteredPasswords.length !== 1 ? 's' : ''}{' '}
              encontrado{filteredPasswords.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      )}

      {passwords.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nenhuma senha salva ainda</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPasswords}
          renderItem={({ item }) => (
            <PasswordItem item={item} onDelete={handleDeletePassword} onEdit={handleEditPassword} />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={10}
          ListEmptyComponent={
            searchQuery.trim() !== '' ? (
              <View style={styles.noResults}>
                <Feather name="search" size={48} color="#ccc" />
                <Text style={styles.noResultsText}>
                  Nenhum resultado encontrado para &quot;{searchQuery}&quot;
                </Text>
              </View>
            ) : null
          }
        />
      )}

      <PasswordModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingPassword(null);
        }}
        onSave={handleSavePassword}
        editingPassword={editingPassword}
      />

      <DrawerMenu
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onExport={handleExportPasswords}
        onImport={handleImportPasswords}
        onChangePassword={() => setShowChangePassword(true)}
        onLinkedIn={handleOpenLinkedIn}
        onReset={handleResetApp}
      />

      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={() => setShowChangePassword(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'android' ? 40 : 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    padding: 4,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchButton: {
    padding: 8,
  },
  addButton: {
    backgroundColor: '#4A90E2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  searchCloseButton: {
    padding: 4,
  },
  searchResults: {
    marginTop: 8,
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
  },
  listContent: {
    padding: 20,
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
