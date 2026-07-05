export type ActionState = {
  success: boolean;
  error: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialActionState: ActionState = {
  success: false,
  error: false,
};
