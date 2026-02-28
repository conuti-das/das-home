import { useMemo } from "react";
import { useEntityStore } from "@/stores/entityStore";
import type { EntityState } from "@/types";

export function useEntity(entityId: string): EntityState | undefined {
  return useEntityStore((s) => s.entities.get(entityId));
}

export function useEntitiesByDomain(domain: string): EntityState[] {
  const entities = useEntityStore((s) => s.entities);
  return useMemo(() => {
    const result: EntityState[] = [];
    for (const [id, state] of entities) {
      if (id.startsWith(`${domain}.`)) {
        result.push(state);
      }
    }
    return result;
  }, [entities, domain]);
}

export function useEntitiesByArea(areaId: string): EntityState[] {
  const entities = useEntityStore((s) => s.entities);
  const entityAreaMap = useEntityStore((s) => s.entityAreaMap);
  return useMemo(() => {
    const result: EntityState[] = [];
    for (const [id, state] of entities) {
      if (entityAreaMap.get(id) === areaId) {
        result.push(state);
      }
    }
    return result;
  }, [entities, entityAreaMap, areaId]);
}
