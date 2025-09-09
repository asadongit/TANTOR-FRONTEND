if (typeof window !== 'undefined') {
  window._env_ = window._env_ || {};
 
  const fallbackEnv = import.meta.env;
 
  for (const key in fallbackEnv) {
    if (key.startsWith('VITE_') && window._env_[key] === undefined) {
      window._env_[key] = fallbackEnv[key];
    }
  }
}
 
 