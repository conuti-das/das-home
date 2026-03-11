import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useEntityStore } from "@/stores/entityStore";
import type { EntityState } from "@/types";

export type SortField = "name" | "entity_id" | "domain" | "state" | "last_changed";
export type SortDirection = "asc" | "desc";

const PAGE_SIZE = 50;

/** Domain priority for sorting: lower = more important (shown first) */
const DOMAIN_PRIORITY: Record<string, number> = {
  // Tier 1: Main devices
  media_player: 1, light: 1, climate: 1, cover: 1, camera: 1, vacuum: 1, fan: 1, lock: 1,
  // Tier 2: Interactive controls
  scene: 2, script: 2, automation: 2, button: 2,
  // Tier 3: Status/info
  weather: 3, person: 3, calendar: 3, device_tracker: 3, update: 3,
  // Tier 4: Simple toggles
  switch: 4, input_boolean: 4,
  // Tier 5: Sensors
  sensor: 5, binary_sensor: 5,
  // Tier 6: Config/tuning entities
  number: 6, input_number: 6, select: 6, input_select: 6, timer: 6,
};

function getDomainPriority(domain: string): number {
  return DOMAIN_PRIORITY[domain] ?? 7;
}

interface UseEntityFilterReturn {
  search: string;
  setSearch: (s: string) => void;
  domainFilter: string;
  setDomainFilter: (d: string) => void;
  areaFilter: string;
  setAreaFilter: (a: string) => void;
  sortField: SortField;
  setSortField: (f: SortField) => void;
  sortDirection: SortDirection;
  setSortDirection: (d: SortDirection) => void;
  toggleSort: (field: SortField) => void;
  page: number;
  setPage: (p: number) => void;
  results: EntityState[];
  totalCount: number;
  totalPages: number;
  domains: string[];
  areas: string[];
}

export function useEntityFilter(): UseEntityFilterReturn {
  const [search, setSearchRaw] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const setSearch = useCallback((s: string) => {
    setSearchRaw(s);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(s);
      setPage(0);
    }, 300);
  }, []);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const entities = useEntityStore((s) => s.entities);
  const entityAreaMap = useEntityStore((s) => s.entityAreaMap);
  const areasMap = useEntityStore((s) => s.areas);

  const domains = useMemo(() => {
    const set = new Set<string>();
    for (const id of entities.keys()) {
      set.add(id.split(".")[0]);
    }
    return Array.from(set).sort();
  }, [entities]);

  const areas = useMemo(() => {
    const result: string[] = [];
    for (const area of areasMap.values()) {
      result.push(area.name);
    }
    return result.sort();
  }, [areasMap]);

  const filtered = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase();
    const arr: EntityState[] = [];

    for (const [id, state] of entities) {
      if (domainFilter && !id.startsWith(`${domainFilter}.`)) continue;
      if (areaFilter) {
        const entityArea = entityAreaMap.get(id);
        const area = entityArea ? areasMap.get(entityArea) : undefined;
        if (!area || area.name !== areaFilter) continue;
      }
      if (searchLower) {
        const name = ((state.attributes?.friendly_name as string) || "").toLowerCase();
        if (!id.toLowerCase().includes(searchLower) && !name.includes(searchLower)) continue;
      }
      arr.push(state);
    }

    // Sort
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name": {
          // Primary sort: domain priority (main devices first)
          const da = a.entity_id.split(".")[0];
          const db = b.entity_id.split(".")[0];
          const pa = getDomainPriority(da);
          const pb = getDomainPriority(db);
          cmp = pa - pb;
          if (cmp === 0) {
            // Secondary sort: alphabetical by name
            const na = ((a.attributes?.friendly_name as string) || a.entity_id).toLowerCase();
            const nb = ((b.attributes?.friendly_name as string) || b.entity_id).toLowerCase();
            cmp = na.localeCompare(nb);
          }
          break;
        }
        case "entity_id":
          cmp = a.entity_id.localeCompare(b.entity_id);
          break;
        case "domain":
          cmp = a.entity_id.split(".")[0].localeCompare(b.entity_id.split(".")[0]);
          break;
        case "state":
          cmp = a.state.localeCompare(b.state);
          break;
        case "last_changed":
          cmp = a.last_changed.localeCompare(b.last_changed);
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return arr;
  }, [entities, debouncedSearch, domainFilter, areaFilter, sortField, sortDirection, entityAreaMap, areasMap]);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const results = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDirection("asc");
      return field;
    });
    setPage(0);
  }, []);

  return {
    search,
    setSearch,
    domainFilter,
    setDomainFilter: useCallback((d: string) => { setDomainFilter(d); setPage(0); }, []),
    areaFilter,
    setAreaFilter: useCallback((a: string) => { setAreaFilter(a); setPage(0); }, []),
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    toggleSort,
    page,
    setPage,
    results,
    totalCount,
    totalPages,
    domains,
    areas,
  };
}
