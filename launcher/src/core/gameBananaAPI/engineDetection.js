window.launcher = window.launcher || {};
window.launcher.gameBananaAPI = window.launcher.gameBananaAPI || {};

/**
 * Text analysis to detect FNF engines and required mods based on descriptions.
 */
window.launcher.gameBananaAPI.engineDetection = {
  /**
   * Detects the underlying engine reading title and description context.
   * @param {Object} params
   * @returns {string|undefined}
   */
  detectRequiredEngineFromMetadata: ({ name, text, rootCategoryName }) => {
    const combinedText = `${name || ""} ${text || ""} ${rootCategoryName || ""}`.toLowerCase(); // Normalized search space
    
    if (combinedText.includes("psych engine") || combinedText.includes("psych")) return "Psych Engine";
    if (combinedText.includes("kade engine") || combinedText.includes("kade")) return "Kade Engine";
    if (combinedText.includes("mic'd up")) return "Mic'd Up";
    if (combinedText.includes("leather engine")) return "Leather Engine";
    if (combinedText.includes("fps plus") || combinedText.includes("fps+")) return "FPS Plus";
    
    return undefined;
  },

  /**
   * Parses description text identifying external mod dependencies.
   * @param {string} [text]
   * @returns {Array<string>}
   */
  detectDependencies: (text) => {
    if (!text) {
      return [];
    }

    const patterns = [
      /requires?\s+([A-Za-z0-9\-+' ]{2,80})/gi,
      /dependency[:\s]+([A-Za-z0-9\-+' ]{2,80})/gi,
      /needs?\s+([A-Za-z0-9\-+' ]{2,80})/gi,
    ]; // RegExp patterns capturing dependency syntax

    const dependencies = new Set(); // Collection enforcing unique dependency names

    for (const pattern of patterns) {
      let match = null;
      match = pattern.exec(text);
      
      while (match) {
        const dep = match[1]?.trim(); // Extracted matching string group
        if (dep) {
          dependencies.add(dep.replace(/[.,;!?]+$/, ""));
        }
        match = pattern.exec(text);
      }
    }

    return [...dependencies].slice(0, 8);
  }
};