// Polyfill for Bun's missing node:v8 isBuildingSnapshot
if (typeof globalThis !== 'undefined' && globalThis.process && (globalThis.process as any).versions?.bun) {
  console.log('[Polyfill] Patching process.getBuiltinModule for node:v8...');
  const originalGetBuiltinModule = (globalThis.process as any).getBuiltinModule;
  (globalThis.process as any).getBuiltinModule = (moduleName: string) => {
    if (moduleName === 'v8') {
      console.log('[Polyfill] Intercepted getBuiltinModule("v8")');
      return {
        startupSnapshot: {
          isBuildingSnapshot: () => false
        }
      };
    }
    return typeof originalGetBuiltinModule === 'function' ? originalGetBuiltinModule(moduleName) : undefined;
  };
}

export const polyfillLoaded = true;


