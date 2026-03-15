import fs from "node:fs/promises";

const WEBLATE_URL = (process.env.WEBLATE_URL || "https://funkhub-translations.duckdns.org").replace(/\/+$/, "");
const token = process.env.WEBLATE_API_TOKEN || process.env.PROJECT_API_TOKEN || process.env.PROJECT_API_KEY;

if (!token) {
  throw new Error("Missing API token. Set WEBLATE_API_TOKEN or PROJECT_API_TOKEN or PROJECT_API_KEY.");
}

const configRaw = await fs.readFile(new URL("../weblate.config.json", import.meta.url), "utf8");
const config = JSON.parse(configRaw);

const projectSlug = config.project.slug;

async function api(pathname, { method = "GET", body } = {}) {
  const response = await fetch(`${WEBLATE_URL}${pathname}`, {
    method,
    headers: {
      Authorization: `Token ${token}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Weblate API ${method} ${pathname} failed: ${response.status} ${response.statusText} :: ${text}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return {};
  }

  return response.json();
}

async function tryPatchComponent(project, component, body) {
  try {
    return await api(`/api/components/${project}/${component}/`, { method: "PATCH", body });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[warn] component patch failed for keys [${Object.keys(body).join(", ")}]: ${message}`);
    return null;
  }
}

console.log(`[info] Configuring project '${projectSlug}' at ${WEBLATE_URL}`);

await api(`/api/projects/${projectSlug}/`, {
  method: "PATCH",
  body: {
    web: config.project.web,
    translation_review: Boolean(config.project.translationReview),
    source_review: Boolean(config.project.sourceReview),
    enable_hooks: Boolean(config.project.enableHooks),
  },
});

const componentsResponse = await api(`/api/projects/${projectSlug}/components/?page_size=1000`);
const existingComponent = (componentsResponse.results || []).find((item) => item.slug === config.component.slug);

const componentPayload = {
  name: config.component.name,
  slug: config.component.slug,
  vcs: "git",
  repo: config.repository.url,
  push: config.repository.url,
  branch: config.repository.branch,
  push_branch: config.repository.branch,
  filemask: config.component.fileMask,
  template: config.component.template,
  new_base: config.component.newBase,
  new_lang: config.component.newLanguageMode,
  commit_message: config.component.commitMessage,
  enable_suggestions: config.component.enableSuggestions,
  suggestion_voting: config.component.suggestionVoting,
  suggestion_autoaccept: config.component.suggestionAutoAccept,
  push_on_commit: config.component.pushOnCommit,
  language_regex: config.component.languageRegex,
};

if (!existingComponent) {
  const fileFormats = ["i18next_json", "i18next", "json", "json-nested"];
  let lastError;
  for (const fileFormat of fileFormats) {
    try {
      await api(`/api/projects/${projectSlug}/components/`, {
        method: "POST",
        body: {
          ...componentPayload,
          file_format: fileFormat,
        },
      });
      console.log(`[info] Created component '${config.component.slug}' using file_format='${fileFormat}'`);
      lastError = undefined;
      break;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[warn] create with file_format='${fileFormat}' failed: ${message}`);
    }
  }

  if (lastError) {
    throw lastError;
  }
} else {
  await api(`/api/components/${projectSlug}/${config.component.slug}/`, {
    method: "PATCH",
    body: componentPayload,
  });
  console.log(`[info] Updated component '${config.component.slug}'`);
}

await tryPatchComponent(projectSlug, config.component.slug, {
  commit_author: config.component.commitAuthor,
});

for (const operation of ["pull", "file-scan", "commit", "push"]) {
  await api(`/api/projects/${projectSlug}/repository/`, {
    method: "POST",
    body: { operation },
  });
  console.log(`[info] repository operation: ${operation}`);
}

const projectRepositoryStatus = await api(`/api/projects/${projectSlug}/repository/`);
const componentRepositoryStatus = await api(`/api/components/${projectSlug}/${config.component.slug}/repository/`);

console.log("[info] project repository status", projectRepositoryStatus);
console.log("[info] component repository status", componentRepositoryStatus);
console.log("[done] Weblate synchronization verified.");
