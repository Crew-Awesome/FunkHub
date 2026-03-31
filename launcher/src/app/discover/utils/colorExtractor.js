if (!window.launcher) window.launcher = {};
if (!window.launcher.discover) window.launcher.discover = {};
if (!window.launcher.discover.utils) window.launcher.discover.utils = {};

window.launcher.discover.utils.colorExtractor = {
  /**
   * Extracts the dominant RGB color from an image URL using a canvas.
   * @param {string} src
   * @param {Function} callback
   */
  getDominantColor: (src, callback) => {
    const defaultColor = "232, 116, 59"; // Fallback rgb color string

    if (!src) {
      callback(defaultColor);
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = 10;
      canvas.height = 10;

      try {
        ctx.drawImage(img, 0, 0, 10, 10);
        const data = ctx.getImageData(0, 0, 10, 10).data;

        let r = 0;
        let g = 0;
        let b = 0;
        const count = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }

        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        callback(`${r}, ${g}, ${b}`);
      } catch (error) {
        callback(defaultColor);
      }
    };

    img.onerror = () => {
      callback(defaultColor);
    };

    img.src = src;
  }
};