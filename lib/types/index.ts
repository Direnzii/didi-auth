export interface PasswordEntry {
  id: string;
  service: string;
  username: string;
  password: string;
}

export interface LockData {
  attempts: number;
  lockUntil: number | null;
  lockCount: number;
}

export interface AuthScreenProps {
  onAuthenticated: () => void;
}

export interface PasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (service: string, username: string, password: string) => void;
  editingPassword: PasswordEntry | null;
}

export interface PasswordItemProps {
  item: PasswordEntry;
  onDelete: (id: string) => void;
  onEdit: (item: PasswordEntry) => void;
}

export interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: () => void;
  onChangePassword: () => void;
  onLinkedIn: () => void;
  onReset: () => void;
}

export interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

