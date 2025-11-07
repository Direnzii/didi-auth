import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Pressable,
  Platform,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import type { DrawerMenuProps } from '../types';
import { PIX_KEY } from '../constants/storage';

const SCREEN_WIDTH = Dimensions.get('window').width;

const DrawerMenu: React.FC<DrawerMenuProps> = ({
  visible,
  onClose,
  onExport,
  onImport,
  onChangePassword,
  onLinkedIn,
  onReset,
}) => {
  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.7)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SCREEN_WIDTH * 0.7,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const handleCopyPix = async () => {
    await Clipboard.setStringAsync(PIX_KEY);
    Alert.alert('Copiado!', 'Chave PIX copiada para a área de transferência.');
  };

  const menuItems = [
    {
      icon: 'download' as const,
      label: 'Exportar senhas',
      hint: 'Faça backup periodicamente para não perder seus dados',
      onPress: () => {
        onExport();
        onClose();
      },
    },
    {
      icon: 'upload' as const,
      label: 'Importar senhas',
      hint: 'Arquivo CSV com colunas: url, username, password',
      onPress: () => {
        onImport();
        onClose();
      },
    },
    {
      icon: 'key' as const,
      label: 'Alterar Senha Mestra',
      onPress: () => {
        onChangePassword();
        onClose();
      },
    },
    {
      icon: 'trash-2' as const,
      label: 'Resetar App',
      hint: 'Apaga TODAS as senhas e dados do app',
      danger: true,
      onPress: () => {
        onReset();
        onClose();
      },
    },
    {
      icon: 'external-link' as const,
      label: 'LinkedIn',
      onPress: () => {
        onLinkedIn();
        onClose();
      },
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[styles.container, { transform: [{ translateX: slideAnim }] }]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Menu</Text>
          </View>

          <View style={styles.content}>
            {menuItems.map((item, index) => (
              <View key={index}>
                <TouchableOpacity
                  style={styles.item}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <Feather 
                    name={item.icon} 
                    size={22} 
                    color={item.danger ? '#D0021B' : '#333'} 
                  />
                  <View style={styles.itemTextContainer}>
                    <Text style={[
                      styles.itemText,
                      item.danger && styles.itemTextDanger
                    ]}>
                      {item.label}
                    </Text>
                    {item.hint && (
                      <Text style={[
                        styles.itemHint,
                        item.danger && styles.itemHintDanger
                      ]}>
                        {item.hint}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.supportSection}>
            <View style={styles.supportHeader}>
              <Feather name="heart" size={20} color="#E74C3C" />
              <Text style={styles.supportTitle}>Apoie o projeto!</Text>
            </View>

            <Text style={styles.pixLabel}>Chave PIX:</Text>
            <TouchableOpacity style={styles.pixKeyContainer} onPress={handleCopyPix}>
              <Text style={styles.pixKey} numberOfLines={1}>
                {PIX_KEY}
              </Text>
              <Feather name="copy" size={18} color="#4A90E2" />
            </TouchableOpacity>

            <View style={styles.qrcodeContainer}>
              <QRCode value={PIX_KEY} size={120} backgroundColor="#f5f5f5" />
            </View>
            <Text style={styles.qrcodeHint}>Escaneie o QR Code para doar</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: SCREEN_WIDTH * 0.7,
    height: '100%',
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    paddingTop: 6,
    paddingBottom: 320,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 14.5,
    color: '#333',
    fontWeight: '500',
  },
  itemTextDanger: {
    color: '#D0021B',
  },
  itemHint: {
    fontSize: 10.5,
    color: '#666',
    marginTop: 2,
    lineHeight: 13,
  },
  itemHintDanger: {
    color: '#D0021B',
    opacity: 0.8,
  },
  supportSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
    padding: 20,
    paddingBottom: Platform.OS === 'android' ? 20 : 30,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pixLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  pixKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  pixKey: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  qrcodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  qrcodeHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default DrawerMenu;

