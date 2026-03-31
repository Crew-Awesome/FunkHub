if (!window.launcher) window.launcher = {};
if (!window.launcher.discover) window.launcher.discover = {};
if (!window.launcher.discover.utils) window.launcher.discover.utils = {};

window.launcher.discover.utils.formatters = {
  /**
   * Formats a number into a compact string representation.
   * @param {number|string} value
   * @returns {string}
   */
  formatCompactNumber: (value) => {
    const num = Number(value);

    if (Number.isNaN(num) || num <= 0) {
      return "0";
    }

    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
    }

    if (num >= 1000) {
      return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    }

    return num.toLocaleString("en-US");
  }
};