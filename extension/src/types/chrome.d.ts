// Declaration volontairement minimale : seules les API Chrome utilisees par l'extension sont exposees.
declare namespace chrome {
  namespace tabs {
    type Tab = {
      id?: number;
    };

    function query(queryInfo: { active: boolean; currentWindow: boolean }): Promise<Tab[]>;
  }

  namespace scripting {
    type InjectionResult<T> = {
      result?: T;
    };

    function executeScript<T>(injection: {
      target: { tabId: number };
      func: () => T;
    }): Promise<InjectionResult<T>[]>;
  }
}
