import { useEffect, useRef, useState } from "react";
import { Apple, ChevronLeft, ChevronRight, Gamepad2, Globe, Laptop, Monitor, SlidersHorizontal, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useFunkHub, useI18n } from "../../providers";
import { gameJoltApiService, type GameJoltGameSummary } from "../../services/funkhub/gamejoltApi";

function PlatformIcons({ platforms }: { platforms?: string[] }) {
  if (!platforms || platforms.length === 0) {
    return null;
  }

  const unique = Array.from(new Set(platforms)).slice(0, 5);
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      {unique.map((platform) => {
        if (platform === "windows") {
          return <Monitor key={platform} className="h-3.5 w-3.5" />;
        }
        if (platform === "mac") {
          return <Apple key={platform} className="h-3.5 w-3.5" />;
        }
        if (platform === "linux") {
          return <Laptop key={platform} className="h-3.5 w-3.5" />;
        }
        if (platform === "html") {
          return <Globe key={platform} className="h-3.5 w-3.5" />;
        }
        if (platform === "flash") {
          return <Zap key={platform} className="h-3.5 w-3.5" />;
        }
        return <Gamepad2 key={platform} className="h-3.5 w-3.5" />;
      })}
    </div>
  );
}

export function GameJolt() {
  const { t } = useI18n();
  const { openExternalUrl } = useFunkHub();

  const sectionOptions = [
    { value: "featured", label: t("gamejolt.sectionFeatured", "Featured") },
    { value: "hot", label: t("gamejolt.sectionHot", "Hot") },
    { value: "best", label: t("gamejolt.sectionBest", "Best") },
    { value: "new", label: t("gamejolt.sectionNew", "New") },
  ];

  const osOptions = [
    { value: "", label: t("gamejolt.anyOs", "Any OS") },
    { value: "windows", label: t("gamejolt.osWindows", "Windows") },
    { value: "linux", label: t("gamejolt.osLinux", "Linux") },
    { value: "mac", label: t("gamejolt.osMac", "macOS") },
  ];

  const browserOptions = [
    { value: "", label: t("gamejolt.anyRuntime", "Any Runtime") },
    { value: "html", label: t("gamejolt.runtimeHtml", "HTML/Web") },
  ];

  const priceOptions = [
    { value: "", label: t("gamejolt.anyPrice", "Any Price") },
    { value: "free", label: t("gamejolt.priceFree", "Free") },
    { value: "sale", label: t("gamejolt.priceSale", "Sale") },
    { value: "5-less", label: t("gamejolt.price5Less", "$5 or less") },
  ];

  const statusOptions = [
    { value: "", label: t("gamejolt.anyStatus", "Any Status") },
    { value: "complete", label: t("gamejolt.statusComplete", "Complete") },
    { value: "wip", label: t("gamejolt.statusWip", "WIP") },
    { value: "devlog", label: t("gamejolt.statusDevlog", "Devlog") },
  ];

  const maturityOptions = [
    { value: "", label: t("gamejolt.anyMaturity", "Any Maturity") },
    { value: "everyone", label: t("gamejolt.maturityEveryone", "Everyone") },
    { value: "teen", label: t("gamejolt.maturityTeen", "Teen") },
    { value: "adult", label: t("gamejolt.maturityAdult", "Adult") },
  ];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [games, setGames] = useState<GameJoltGameSummary[]>([]);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);

  const [section, setSection] = useState("featured");
  const tag = "fnf";
  const [page, setPage] = useState(1);
  const [osFilter, setOsFilter] = useState("");
  const [browserFilter, setBrowserFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [maturityFilter, setMaturityFilter] = useState("");
  const [partnersOnly, setPartnersOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    const load = async () => {
      setLoading(true);
      setError(undefined);
      try {
        const result = await gameJoltApiService.listGames({
          section,
          tag,
          page,
          os: osFilter || undefined,
          browser: browserFilter || undefined,
          priceBucket: priceFilter || undefined,
          status: statusFilter || undefined,
          maturity: maturityFilter || undefined,
          partnersOnly,
        }, controller.signal);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setGames(result.records);
        setTotalCount(result.totalCount);
        setHasMore(result.hasMore);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }

        if (requestId !== requestIdRef.current) {
          return;
        }

        const message = requestError instanceof Error
          ? requestError.message
          : t("gamejolt.errorGeneric", "Failed to load GameJolt games.");
        setError(message);
        setGames([]);
        setTotalCount(undefined);
        setHasMore(false);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      controller.abort();
    };
  }, [section, page, osFilter, browserFilter, priceFilter, statusFilter, maturityFilter, partnersOnly, t]);

  const browserFallbackUrl = (() => {
    const basePath = section === "best" ? "https://gamejolt.com/games/best/tag-fnf" : "https://gamejolt.com/games/tag-fnf";
    const url = new URL(basePath);
    if (osFilter) {
      url.searchParams.set("os", osFilter);
    }
    if (browserFilter) {
      url.searchParams.set("browser", browserFilter);
    }
    if (priceFilter) {
      url.searchParams.set("price", priceFilter);
    }
    if (statusFilter) {
      url.searchParams.set("status", statusFilter);
    }
    if (section && section !== "featured" && section !== "best") {
      url.searchParams.set("section", section);
    }
    if (maturityFilter) {
      url.searchParams.set("maturity", maturityFilter);
    }
    if (partnersOnly) {
      url.searchParams.set("partners", "1");
    }
    return url.toString();
  })();

  const resetPage = () => setPage(1);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">{t("gamejolt.title", "GameJolt")}</h1>

        <div className="flex gap-2 overflow-x-auto pb-1 items-center mb-3">
          {sectionOptions.map((option) => {
            const isSelected = section === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setSection(option.value);
                  resetPage();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 border ${
                  isSelected
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-card hover:bg-secondary text-muted-foreground border-border"
                }`}
              >
                {option.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className={`ml-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showFilters || osFilter || browserFilter || priceFilter || statusFilter || maturityFilter || partnersOnly
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-card text-muted-foreground border-border hover:bg-secondary"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t("discover.filters", "Filters")}
          </button>
        </div>

        {showFilters && (
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
              <select
                value={osFilter}
                onChange={(event) => {
                  setOsFilter(event.target.value);
                  resetPage();
                }}
                className="w-full bg-input-background border border-border rounded-lg px-2.5 py-1.5 text-xs"
              >
                {osOptions.map((option) => (
                  <option key={option.value || "any"} value={option.value}>{option.label}</option>
                ))}
              </select>

              <select
                value={browserFilter}
                onChange={(event) => {
                  setBrowserFilter(event.target.value);
                  resetPage();
                }}
                className="w-full bg-input-background border border-border rounded-lg px-2.5 py-1.5 text-xs"
              >
                {browserOptions.map((option) => (
                  <option key={option.value || "any"} value={option.value}>{option.label}</option>
                ))}
              </select>

              <select
                value={priceFilter}
                onChange={(event) => {
                  setPriceFilter(event.target.value);
                  resetPage();
                }}
                className="w-full bg-input-background border border-border rounded-lg px-2.5 py-1.5 text-xs"
              >
                {priceOptions.map((option) => (
                  <option key={option.value || "any"} value={option.value}>{option.label}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  resetPage();
                }}
                className="w-full bg-input-background border border-border rounded-lg px-2.5 py-1.5 text-xs"
              >
                {statusOptions.map((option) => (
                  <option key={option.value || "any"} value={option.value}>{option.label}</option>
                ))}
              </select>

              <select
                value={maturityFilter}
                onChange={(event) => {
                  setMaturityFilter(event.target.value);
                  resetPage();
                }}
                className="w-full bg-input-background border border-border rounded-lg px-2.5 py-1.5 text-xs"
              >
                {maturityOptions.map((option) => (
                  <option key={option.value || "any"} value={option.value}>{option.label}</option>
                ))}
              </select>

              <select
                value={partnersOnly ? "partners" : ""}
                onChange={(event) => {
                  setPartnersOnly(event.target.value === "partners");
                  resetPage();
                }}
                className="w-full bg-input-background border border-border rounded-lg px-2.5 py-1.5 text-xs"
              >
                <option value="">{t("gamejolt.partnersAny", "All creators")}</option>
                <option value="partners">{t("gamejolt.partnersOnly", "Partners only")}</option>
              </select>
            </div>
          </div>
        )}

      </div>
      <div className="mb-4 text-sm text-muted-foreground">
        {loading
          ? t("gamejolt.loading", "Loading games...")
          : t(
              "gamejolt.showing",
              "Showing {{count}} games",
              { count: typeof totalCount === "number" ? `${games.length} / ${totalCount}` : games.length },
            )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive space-y-3">
          <p>{error}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void openExternalUrl(browserFallbackUrl);
              }}
              className="rounded-md border border-destructive/50 px-2.5 py-1.5 text-xs hover:bg-destructive/10"
            >
              {t("gamejolt.openBrowserFallback", "Open GameJolt tag page in browser")}
            </button>
          </div>
        </div>
      )}

      {!loading && games.length === 0 && !error && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {t("gamejolt.noResults", "No GameJolt games found for this filter.")}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.24) }}
          >
            <button
              type="button"
              onClick={() => {
                void openExternalUrl(game.profileUrl);
              }}
              className="w-full text-left overflow-hidden rounded-xl border border-border bg-card hover:shadow-lg hover:border-primary/30 transition-all"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
                <img
                  loading="lazy"
                  src={game.imageUrl ?? game.thumbnailUrl ?? `${import.meta.env.BASE_URL}mod-placeholder.svg`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="-mt-2.5 relative bg-card px-3 pb-3 pt-3">
                <div className="flex items-start gap-2.5">
                  <img
                    loading="lazy"
                    src={game.authorAvatarUrl ?? `${import.meta.env.BASE_URL}mod-placeholder.svg`}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover border border-border"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-muted-foreground">{game.authorName ?? "GameJolt"}</p>
                    <h3 className="truncate text-sm font-semibold text-foreground">{game.name}</h3>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-end text-xs">
                  <PlatformIcons platforms={game.platforms} />
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={loading || page <= 1}
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("gamejolt.previous", "Previous")}
        </button>
        <p className="text-xs text-muted-foreground">{t("gamejolt.page", "Page")} {page}</p>
        <button
          type="button"
          onClick={() => setPage((current) => current + 1)}
          disabled={loading || !hasMore}
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {t("gamejolt.next", "Next")}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
