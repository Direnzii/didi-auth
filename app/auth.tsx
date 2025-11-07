import { Feather } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_NAME, LOCK_CONFIG } from '@/lib/constants/storage';
import { LockStorage, MasterPasswordStorage } from '@/lib/services/storage';
import type { AuthScreenProps, LockData } from '@/lib/types';
import { hashPassword, verifyPassword, validateMasterPassword } from '@/lib/utils/crypto';
import { getLockDuration, getRemainingLockTime, isCurrentlyLocked } from '@/lib/utils/lock';
import { formatLockTime, formatRemainingTime } from '@/lib/utils/time';

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [lockData, setLockData] = useState<LockData>({
    attempts: 0,
    lockUntil: null,
    lockCount: 0,
  });
  const [remainingTime, setRemainingTime] = useState(0);
  const [useBiometric, setUseBiometric] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [showWelcome, showCreatePassword, showLogin]);

  useEffect(() => {
    if (lockData.lockUntil) {
      const interval = setInterval(() => {
        const remaining = getRemainingLockTime(lockData.lockUntil);
        if (remaining > 0) {
          setRemainingTime(remaining);
        } else {
          const resetData = { attempts: 0, lockUntil: null, lockCount: lockData.lockCount };
          setLockData(resetData);
          LockStorage.save(resetData);
          setRemainingTime(0);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lockData.lockUntil]);

  const checkAuthStatus = async () => {
    try {
      const savedLockData = await LockStorage.get();
      setLockData(savedLockData);

      const hasPassword = await MasterPasswordStorage.exists();
      if (!hasPassword) {
        setShowWelcome(true);
      } else {
        setShowLogin(true);
        await checkBiometrics();
      }
    } catch (error) {
      setShowWelcome(true);
    }
  };

  const checkBiometrics = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const available = compatible && enrolled;
      setHasBiometrics(available);
      
      if (available) {
        setTimeout(() => handleBiometricAuth(), 500);
      }
    } catch (error) {
      setHasBiometrics(false);
    }
  };

  const handleFailedAttempt = async () => {
    const newAttempts = lockData.attempts + 1;

    if (newAttempts >= LOCK_CONFIG.MAX_ATTEMPTS) {
      const lockDuration = getLockDuration(lockData.lockCount);
      const lockUntil = Date.now() + lockDuration;
      const newLockData: LockData = {
        attempts: 0,
        lockUntil,
        lockCount: lockData.lockCount + 1,
      };
      setLockData(newLockData);
      await LockStorage.save(newLockData);
      setUseBiometric(false);
      Alert.alert(
        'App Bloqueado',
        `Muitas tentativas incorretas. Tente novamente em ${formatLockTime(lockDuration)}.`
      );
    } else {
      const newLockData = { ...lockData, attempts: newAttempts };
      setLockData(newLockData);
      await LockStorage.save(newLockData);
      Alert.alert(
        'Senha Incorreta',
        `Tentativa ${newAttempts}/${LOCK_CONFIG.MAX_ATTEMPTS}. Restam ${
          LOCK_CONFIG.MAX_ATTEMPTS - newAttempts
        } tentativas.`
      );
    }
  };

  const handleBiometricAuth = async () => {
    if (!hasBiometrics || !useBiometric) return;

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentique-se para acessar suas senhas',
        fallbackLabel: 'Usar senha mestra',
        cancelLabel: 'Cancelar',
      });

      if (result.success) {
        await LockStorage.reset();
        onAuthenticated();
      }
    } catch (error) {
      setUseBiometric(false);
    }
  };

  const handleCreatePassword = async () => {
    if (!password.trim()) {
      Alert.alert('Atenção', 'Por favor, digite uma senha mestra.');
      return;
    }

    const validation = validateMasterPassword(password);
    if (!validation.valid) {
      Alert.alert('Senha Fraca', validation.message);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas não coincidem. Tente novamente.');
      return;
    }

    try {
      const { hash, salt } = await hashPassword(password);
      await MasterPasswordStorage.set(hash, salt);
      
      setPassword('');
      setConfirmPassword('');
      setShowCreatePassword(false);
      setShowLogin(true);
      Keyboard.dismiss();

      await checkBiometrics();
      
      if (!hasBiometrics) {
        Alert.alert('Senha Criada!', 'Digite sua senha para continuar.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a senha. Tente novamente.');
    }
  };

  const handleLogin = async () => {
    if (isCurrentlyLocked(lockData)) {
      Alert.alert('App Bloqueado', `Aguarde ${formatRemainingTime(remainingTime)}`);
      return;
    }

    if (!password.trim()) {
      Alert.alert('Atenção', 'Por favor, digite sua senha.');
      return;
    }

    try {
      const savedData = await MasterPasswordStorage.get();
      if (!savedData) {
        Alert.alert('Erro', 'Senha mestra não encontrada.');
        return;
      }

      const isValid = await verifyPassword(password, savedData.hash, savedData.salt);

      if (isValid) {
        await LockStorage.reset();
        setPassword('');
        Keyboard.dismiss();
        onAuthenticated();
      } else {
        setPassword('');
        await handleFailedAttempt();
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível autenticar. Tente novamente.');
    }
  };

  if (isCurrentlyLocked(lockData)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.lockedContainer}>
          <Feather name="lock" size={80} color="#D0021B" />
          <Text style={styles.lockedTitle}>App Bloqueado</Text>
          <Text style={styles.lockedText}>Muitas tentativas incorretas.</Text>
          <Text style={styles.lockedTimer}>
            Aguarde: {formatRemainingTime(remainingTime)}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showWelcome) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.welcomeContainer}>
          <Feather name="shield" size={100} color="#4A90E2" />
          <Text style={styles.welcomeTitle}>Bem-vindo!</Text>
          <Text style={styles.welcomeText}>
            Para proteger suas senhas, você precisa criar uma senha mestra.
          </Text>
          <Text style={styles.welcomeSubtext}>
            Esta senha será necessária sempre que você abrir o aplicativo.
          </Text>
          <TouchableOpacity
            style={styles.welcomeButton}
            onPress={() => {
              setShowWelcome(false);
              setShowCreatePassword(true);
            }}
          >
            <Text style={styles.welcomeButtonText}>Criar Senha Mestra</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (showCreatePassword) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.formContainer}>
            <Feather name="key" size={60} color="#4A90E2" />
            <Text style={styles.formTitle}>Criar Senha Mestra</Text>
            <Text style={styles.formSubtitle}>Crie uma senha que você consiga lembrar</Text>

            <View style={styles.requirementsBox}>
              <Text style={styles.requirementsTitle}>Requisitos da senha:</Text>
              <Text style={styles.requirementItem}>• Mínimo 8 caracteres</Text>
              <Text style={styles.requirementItem}>• 1 letra maiúscula</Text>
              <Text style={styles.requirementItem}>• 1 número</Text>
              <Text style={styles.requirementItem}>• 1 caractere especial (!@#$%...)</Text>
            </View>

            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordField}
                placeholder="Digite sua senha mestra"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordField}
                placeholder="Confirme sua senha mestra"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                onSubmitEditing={handleCreatePassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Feather
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleCreatePassword}>
              <Text style={styles.submitButtonText}>Criar Senha</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (showLogin) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.formContainer}>
            <Feather name="lock" size={60} color="#4A90E2" />
            <Text style={styles.formTitle}>{APP_NAME}</Text>
            <Text style={styles.formSubtitle}>Digite sua senha para continuar</Text>

            {hasBiometrics && useBiometric && (
              <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricAuth}>
                <Feather name="shield" size={40} color="#4A90E2" />
                <Text style={styles.biometricText}>Tocar para usar biometria</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.orText}>ou</Text>

            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordField}
                placeholder="Senha mestra"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleLogin}>
              <Text style={styles.submitButtonText}>Entrar</Text>
            </TouchableOpacity>

            <Text style={styles.attemptsText}>
              Tentativas restantes: {LOCK_CONFIG.MAX_ATTEMPTS - lockData.attempts}/
              {LOCK_CONFIG.MAX_ATTEMPTS}
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  keyboardView: {
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 30,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 26,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  welcomeButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  welcomeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  requirementsBox: {
    width: '100%',
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#4A90E2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
    lineHeight: 18,
  },
  passwordInputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 16,
  },
  passwordField: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000',
  },
  eyeButton: {
    padding: 12,
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  biometricButton: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  biometricText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  orText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  attemptsText: {
    marginTop: 20,
    fontSize: 14,
    color: '#666',
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  lockedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D0021B',
    marginTop: 20,
    marginBottom: 10,
  },
  lockedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  lockedTimer: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});
