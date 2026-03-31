if (!window.launcher) window.launcher = {};
if (!window.launcher.utils) window.launcher.utils = {};

window.launcher.utils.debounce = (func, wait) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};