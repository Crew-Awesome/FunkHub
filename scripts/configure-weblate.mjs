import fs from "node:fs/promises";

const WEBLATE_URL = (process.env.WEBLATE_URL || "https://funkhub-translations.duckdns.org").replace(/\/+$/, "");
const token = process.env.WEBLATE_API_TOKEN || process.env.PROJECT_API_TOKEN || process.env.PROJECT_API_KEY;

if (!token) {
  throw new Error("Missing API token. Set WEBLATE_API_TOKEN or PROJECT_API_TOKEN or PROJECT_API_KEY.");
}

const configRaw = await fs.readFile(new URL("../weblate.config.json", import.meta.url), "utf8");
const config = JSON.parse(configRaw);

const projectSlug = config.project.slug;
const strictSync = String(process.env.WEBLATE_STRICT_SYNC || "false").toLowerCase() === "true";
const apiRetries = Number(process.env.WEBLATE_API_RETRIES || 5);
const retryDelayMs = Number(process.env.WEBLATE_API_RETRY_DELAY_MS || 1000);

function normalizeLanguageCode(code) {
  return String(code || "").trim().replace(/_/g, "-").toLowerCase();
}

function isGithubHostKeyError(message) {
  const normalized = message.toLowerCase();
  return normalized.includes("host key verification failed")
    || normalized.includes("no ed25519 host key is known for github.com");
}

function isRetryableStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function toPathname(pathOrUrl) {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    const parsed = new URL(pathOrUrl);
    return `${parsed.pathname}${parsed.search}`;
  }
  return pathOrUrl;
}

async function api(pathOrUrl, { method = "GET", body } = {}) {
  const pathname = toPathname(pathOrUrl);
  let attempt = 0;

  while (true) {
    attempt += 1;
    let response;

    try {
      response = await fetch(`${WEBLATE_URL}${pathname}`, {
        method,
        headers: {
          Authorization: `Token ${token}`,
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      if (attempt < apiRetries) {
        const delay = retryDelayMs * attempt;
        console.warn(`[warn] Weblate API ${method} ${pathname} network error on attempt ${attempt}/${apiRetries}: ${error instanceof Error ? error.message : String(error)}. Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      throw error;
    }

    if (!response.ok) {
      const text = await response.text();
      if (attempt < apiRetries && isRetryableStatus(response.status)) {
        const delay = retryDelayMs * attempt;
        console.warn(`[warn] Weblate API ${method} ${pathname} returned ${response.status} on attempt ${attempt}/${apiRetries}. Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      throw new Error(`Weblate API ${method} ${pathname} failed: ${response.status} ${response.statusText} :: ${text}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return {};
    }

    return response.json();
  }
}

async function listAllResults(pathname) {
  let nextPath = pathname;
  const results = [];

  while (nextPath) {
    const page = await api(nextPath);
    results.push(...(page.results || []));
    nextPath = page.next ? toPathname(page.next) : null;
  }

  return results;
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

const buildComponentPayload = (repoUrl, pushUrl = repoUrl) => ({
  name: config.component.name,
  slug: config.component.slug,
  vcs: "git",
  repo: repoUrl,
  push: pushUrl,
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
  language_code_style: config.component.languageCodeStyle,
});

const primaryRepoUrl = config.repository.url;
const fallbackRepoUrl = config.repository.httpsUrl;
const primaryPayload = buildComponentPayload(primaryRepoUrl, primaryRepoUrl);
const fallbackPayload = fallbackRepoUrl
  ? buildComponentPayload(fallbackRepoUrl, primaryRepoUrl)
  : null;

if (!existingComponent) {
  const fileFormats = ["i18next", "json", "json-nested"];
  let lastError;
  for (const fileFormat of fileFormats) {
    try {
      await api(`/api/projects/${projectSlug}/components/`, {
        method: "POST",
        body: {
          ...primaryPayload,
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

      if (fallbackPayload && isGithubHostKeyError(message)) {
        console.warn("[warn] SSH host key validation failed in Weblate; retrying component creation with HTTPS clone URL.");
        try {
          await api(`/api/projects/${projectSlug}/components/`, {
            method: "POST",
            body: {
              ...fallbackPayload,
              file_format: fileFormat,
            },
          });
          console.log(`[info] Created component '${config.component.slug}' using fallback HTTPS repo and file_format='${fileFormat}'`);
          lastError = undefined;
          break;
        } catch (fallbackError) {
          lastError = fallbackError;
          const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
          console.warn(`[warn] fallback create with HTTPS clone failed: ${fallbackMessage}`);
        }
      }
    }
  }

  if (lastError) {
    throw lastError;
  }
} else {
  try {
    await api(`/api/components/${projectSlug}/${config.component.slug}/`, {
      method: "PATCH",
      body: primaryPayload,
    });
    console.log(`[info] Updated component '${config.component.slug}'`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (fallbackPayload && isGithubHostKeyError(message)) {
      console.warn("[warn] SSH host key validation failed in Weblate; retrying component update with HTTPS clone URL.");
      await api(`/api/components/${projectSlug}/${config.component.slug}/`, {
        method: "PATCH",
        body: fallbackPayload,
      });
      console.log(`[info] Updated component '${config.component.slug}' using fallback HTTPS clone URL`);
    } else {
      throw error;
    }
  }
}

await tryPatchComponent(projectSlug, config.component.slug, {
  commit_author: config.component.commitAuthor,
});

const allowedLanguageCodes = new Set((config.component.allowedLanguages || []).map((code) => normalizeLanguageCode(code)));
if (allowedLanguageCodes.size > 0) {
  const translations = await listAllResults(`/api/components/${projectSlug}/${config.component.slug}/translations/?page_size=1000`);
  for (const translation of translations) {
    const languageCode = String(translation.language_code || translation.language?.code || "");
    const normalizedLanguageCode = normalizeLanguageCode(languageCode);
    if (!languageCode || allowedLanguageCodes.has(normalizedLanguageCode)) {
      continue;
    }

    try {
      await api(translation.url, { method: "DELETE" });
      console.log(`[info] removed disallowed translation '${languageCode}' from '${config.component.slug}'`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[warn] failed removing translation '${languageCode}': ${message}`);
    }
  }
}

const repositoryOperationFailures = [];
for (const operation of ["pull", "file-scan", "commit", "push"]) {
  try {
    await api(`/api/projects/${projectSlug}/repository/`, {
      method: "POST",
      body: { operation },
    });
    console.log(`[info] repository operation: ${operation}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    repositoryOperationFailures.push({ operation, message });
    if (isGithubHostKeyError(message)) {
      console.warn(`[warn] repository operation '${operation}' failed due to GitHub SSH host key trust on Weblate.`);
    } else {
      console.warn(`[warn] repository operation '${operation}' failed: ${message}`);
    }
  }
}

const projectRepositoryStatus = await api(`/api/projects/${projectSlug}/repository/`);
const componentRepositoryStatus = await api(`/api/components/${projectSlug}/${config.component.slug}/repository/`);

console.log("[info] project repository status", projectRepositoryStatus);
console.log("[info] component repository status", componentRepositoryStatus);

if (repositoryOperationFailures.length > 0) {
  const details = repositoryOperationFailures.map((item) => `- ${item.operation}: ${item.message}`).join("\n");
  const hostKeyFailure = repositoryOperationFailures.some((item) => isGithubHostKeyError(item.message));
  if (strictSync) {
    throw new Error(`Repository synchronization failed:\n${details}`);
  }
  if (hostKeyFailure) {
    console.warn("[warn] Action required in Weblate server: trust GitHub ED25519 host key and ensure SSH key 'Webtable FunkHub' is assigned to project/repository access.");
  }
  console.warn(`[warn] Non-strict mode enabled; continuing despite repository sync failures:\n${details}`);
  console.log("[done] Weblate configuration applied with warnings.");
} else {
  console.log("[done] Weblate synchronization verified.");
}
