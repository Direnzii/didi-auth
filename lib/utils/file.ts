import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import type { PasswordEntry } from '../types';
import { passwordsToCSV, csvToPasswords } from './csv';
import { generateHash } from './password';
import { getCurrentDateFormatted } from './time';

/**
 * Exports passwords to CSV file
 */
export const exportPasswordsToCSV = async (passwords: PasswordEntry[]): Promise<void> => {
  if (passwords.length === 0) {
    throw new Error('Nenhuma senha para exportar. Adicione senhas primeiro.');
  }

  const csvContent = passwordsToCSV(passwords);
  const hash = await generateHash();
  const fileName = `minhas_senhas_${getCurrentDateFormatted()}_${hash}.csv`;
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, csvContent);

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Compartilhamento não disponível neste dispositivo.');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Salvar senhas',
    UTI: 'public.comma-separated-values-text',
  });
};

/**
 * Imports passwords from CSV file
 */
export const importPasswordsFromCSV = async (
  existingPasswords: PasswordEntry[]
): Promise<{ passwords: PasswordEntry[]; errorCount: number }> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/comma-separated-values', 'application/csv', '**'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    throw new Error('Nenhum arquivo selecionado');
  }

  const fileUri = result.assets[0].uri;
  const content = await FileSystem.readAsStringAsync(fileUri);

  if (!content.trim()) {
    throw new Error('Arquivo vazio. Selecione um arquivo CSV válido.');
  }

  return await csvToPasswords(content, existingPasswords);
};

