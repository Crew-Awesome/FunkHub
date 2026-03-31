if (!window.launcher) window.launcher = {};
if (!window.launcher.discover) window.launcher.discover = {};

window.launcher.discover.filterModal = {
  createDOM: function () {
    if (document.getElementById("filter-popover-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "filter-popover-overlay";
    overlay.className = "filter-modal-overlay";

    const content = document.createElement("div");
    content.id = "filter-popover-content";
    content.className = "filter-modal-content";

    content.innerHTML = `
      <div class="filter-modal-header">
        <div class="filter-modal-search-wrapper">
          <i data-lucide="search"></i>
          <input type="text" id="filter-modal-search" class="filter-modal-search-input" placeholder="Find a category...">
        </div>
      </div>
      <div class="filter-modal-body" id="filter-modal-list"></div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(content);

    overlay.addEventListener("click", () => this.close());

    const searchInput = document.getElementById("filter-modal-search");
    searchInput.addEventListener("input", (e) => {
      this.renderTree(e.target.value);
    });
  },

  /**
   * Opens the popover anchored to the specified element.
   * @param {Function} onSelectCallback
   * @param {HTMLElement} anchorElement
   */
  open: function (onSelectCallback, anchorElement) {
    this.createDOM();
    this.onSelectCallback = onSelectCallback;

    const overlay = document.getElementById("filter-popover-overlay");
    const content = document.getElementById("filter-popover-content");
    const searchInput = document.getElementById("filter-modal-search");

    if (anchorElement) {
      const rect = anchorElement.getBoundingClientRect();
      content.style.top = `${rect.bottom + 8}px`;
      content.style.left = `${rect.left}px`;
    } else {
      content.style.top = "80px";
      content.style.left = "24px";
    }

    searchInput.value = "";
    this.renderTree("");

    overlay.classList.add("active");
    content.classList.add("active");

    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => searchInput.focus(), 100);
  },

  close: function () {
    const overlay = document.getElementById("filter-popover-overlay");
    const content = document.getElementById("filter-popover-content");

    if (overlay) overlay.classList.remove("active");
    if (content) content.classList.remove("active");
  },

  /**
   * Evaluates input string and filters category nodes.
   * @param {string} filterText
   */
  renderTree: function (filterText) {
    const list = document.getElementById("filter-modal-list");
    const state = window.launcher.discover.state;
    const lowerFilter = filterText.toLowerCase();

    list.innerHTML = "";

    const allRow = this.createTreeRow(undefined, "All Mods", null, true);
    list.appendChild(allRow);

    const filterNodes = (nodes) => {
      return nodes
        .map((node) => {
          const matches = node.name.toLowerCase().includes(lowerFilter);
          const filteredChildren = filterNodes(node.children);

          if (matches || filteredChildren.length > 0) {
            return { ...node, children: filteredChildren, forceExpand: !!lowerFilter };
          }

          return null;
        })
        .filter(Boolean);
    };

    const treeData = lowerFilter ? filterNodes(state.categories) : state.categories;

    treeData.forEach((node) => {
      list.appendChild(this.buildNodeDOM(node));
    });

    if (window.lucide) window.lucide.createIcons();
  },

  /**
   * Generates interactive tree elements for category navigation.
   * @param {Object} node
   * @returns {HTMLElement}
   */
  buildNodeDOM: function (node) {
    const state = window.launcher.discover.state;
    const container = document.createElement("div");
    container.className = "filter-tree-node";

    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = node.forceExpand || state.expandedCategoryIds.includes(node.id);

    const row = document.createElement("div");
    row.className = `filter-tree-row ${state.selectedCategoryId === node.id ? "active" : ""}`;

    if (hasChildren) {
      const toggle = document.createElement("button");
      toggle.className = "filter-tree-toggle";
      toggle.innerHTML = `<i data-lucide="${isExpanded ? "chevron-down" : "chevron-right"}" style="width:14px;height:14px;"></i>`;

      toggle.addEventListener("click", (e) => {
        e.stopPropagation();

        if (isExpanded) {
          state.expandedCategoryIds = state.expandedCategoryIds.filter((id) => id !== node.id);
        } else {
          state.expandedCategoryIds.push(node.id);
        }

        this.renderTree(document.getElementById("filter-modal-search").value);
      });
      row.appendChild(toggle);
    } else {
      const spacer = document.createElement("div");
      spacer.style.width = "24px";
      row.appendChild(spacer);
    }

    const iconHtml = node.iconUrl
      ? `<img src="${node.iconUrl}" style="width:16px;height:16px;object-fit:contain;border-radius:2px;">`
      : `<i data-lucide="folder-tree" style="width:16px;height:16px;"></i>`;

    const label = document.createElement("div");
    label.style.flex = "1";
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.style.gap = "8px";
    label.innerHTML = `${iconHtml} <span>${node.name}</span>`;

    row.appendChild(label);

    row.addEventListener("click", () => {
      this.close();
      if (this.onSelectCallback) this.onSelectCallback(node.id, null);
    });

    container.appendChild(row);

    if (hasChildren && isExpanded) {
      const childrenContainer = document.createElement("div");
      childrenContainer.className = "filter-tree-children";

      node.children.forEach((child) => {
        childrenContainer.appendChild(this.buildNodeDOM(child));
      });

      container.appendChild(childrenContainer);
    }

    return container;
  },

  /**
   * Instantiates a top level routing option row.
   * @param {number|undefined} id
   * @param {string} name
   * @param {string|null} iconUrl
   * @param {boolean} isAll
   * @returns {HTMLElement}
   */
  createTreeRow: function (id, name, iconUrl, isAll) {
    const state = window.launcher.discover.state;
    const row = document.createElement("div");
    row.className = `filter-tree-row ${state.selectedCategoryId === id && state.subfeedSort === "default" ? "active" : ""}`;

    const iconHTML = `<i data-lucide="${isAll ? "layers" : "folder-tree"}" style="width:16px;height:16px;"></i>`;
    row.innerHTML = `<div style="width:24px;"></div> <div style="display:flex;align-items:center;gap:8px;">${iconHTML} <span>${name}</span></div>`;

    row.addEventListener("click", () => {
      this.close();
      if (this.onSelectCallback) this.onSelectCallback(id, "default");
    });

    return row;
  }
};