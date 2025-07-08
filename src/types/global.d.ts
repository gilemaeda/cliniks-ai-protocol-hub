interface TabStateManagerClass {
  init(): void;
  handleVisibilityChange(): void;
  handleFocus(): void;
  handleBlur(): void;
  preserveState(): void;
}

declare global {
  interface Window {
    TabStateManager: TabStateManagerClass;
  }
}

export {};
