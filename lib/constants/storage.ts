export const STORAGE_KEYS = {
  PASSWORDS: '@offline_password_manager:passwords',
  MASTER_PASSWORD: '@offline_password_manager:master_password',
  LOCK_DATA: '@offline_password_manager:lock_data',
} as const;

export const PASSWORD_CONFIG = {
  LENGTH: 15,
  CHARSET: {
    UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
    NUMBERS: '0123456789',
    SPECIAL: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  },
} as const;

export const LOCK_CONFIG = {
  MAX_ATTEMPTS: 5,
  LOCK_DURATIONS: [
    5 * 60 * 1000,
    5 * 60 * 1000,
    20 * 60 * 1000,
    5 * 60 * 60 * 1000,
  ],
} as const;

export const APP_NAME = 'Didi Auth';

export const LINKEDIN_URL = 'https://www.linkedin.com/in/thiagodirenzi';

export const PIX_KEY = '00020126580014BR.GOV.BCB.PIX0136a2a321c7-8fac-4cb6-b231-7ff72af3d4505204000053039865802BR5922Thiago Direnzi Biazato6009SAO PAULO6214051093wwp64MGi63047382';

