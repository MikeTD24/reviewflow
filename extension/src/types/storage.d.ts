// Ce contrat suffit a ReviewStorage et evite de coupler le domaine aux types complets du navigateur.
declare namespace chrome.storage {
  const local: {
    get(key: string): Promise<Record<string, unknown>>;
    set(items: Record<string, unknown>): Promise<void>;
  };
}
