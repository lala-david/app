import { create } from 'zustand';

export type ActionTone = 'primary' | 'danger' | 'ghost';

export interface DialogAction {
  label: string;
  value: string;
  tone?: ActionTone;
}

export interface DialogRequest {
  title: string;
  body?: string;
  image?: string;
  actions: DialogAction[];
  /** 입력값이 keyword와 같아야 danger 버튼이 켜진다 (탈퇴 확인) */
  typeToConfirm?: string;
}

interface OpenDialog extends DialogRequest {
  id: number;
  resolve: (value: string | null) => void;
}

interface Toast {
  id: number;
  message: string;
}

interface FeedbackState {
  dialog: OpenDialog | null;
  toast: Toast | null;
  openDialog: (request: DialogRequest) => Promise<string | null>;
  closeDialog: (value: string | null) => void;
  showToast: (message: string) => void;
  hideToast: (id: number) => void;
}

let sequence = 0;

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  dialog: null,
  toast: null,

  openDialog: (request) =>
    new Promise((resolve) => {
      get().dialog?.resolve(null);
      set({ dialog: { ...request, id: ++sequence, resolve } });
    }),

  closeDialog: (value) => {
    const dialog = get().dialog;
    if (!dialog) return;
    set({ dialog: null });
    dialog.resolve(value);
  },

  showToast: (message) => set({ toast: { id: ++sequence, message } }),

  hideToast: (id) => {
    if (get().toast?.id === id) set({ toast: null });
  },
}));

const CONFIRM = 'confirm';

/** 확인/취소 두 버튼 팝업. 확인이면 true */
export async function confirmDialog(options: {
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: ActionTone;
  image?: string;
  typeToConfirm?: string;
}): Promise<boolean> {
  const value = await useFeedbackStore.getState().openDialog({
    title: options.title,
    body: options.body,
    image: options.image,
    typeToConfirm: options.typeToConfirm,
    actions: [
      { label: options.confirmLabel, value: CONFIRM, tone: options.tone ?? 'primary' },
      { label: options.cancelLabel, value: 'cancel', tone: 'ghost' },
    ],
  });
  return value === CONFIRM;
}

export const toast = (message: string) => useFeedbackStore.getState().showToast(message);
