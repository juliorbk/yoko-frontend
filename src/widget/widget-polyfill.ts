// Polyfill para process en el navegador
(window as any).process = (window as any).process || {
  env: {},
  nextTick: (fn: Function) => setTimeout(fn, 0),
  platform: 'browser',
  versions: {},
  version: '',
  argv: [],
  execPath: '',
  cwd: () => '/',
  chdir: () => {},
  exit: () => {},
};
