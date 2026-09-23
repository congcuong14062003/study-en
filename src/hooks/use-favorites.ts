"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/utils";

export type FavoriteRecord = {
  type: string;
  resourceId: string;
};

let cachedFavorites: FavoriteRecord[] | null = null;
let favoritesRequest: Promise<FavoriteRecord[]> | null = null;
const listeners = new Set<(favorites: FavoriteRecord[]) => void>();

function publish(favorites: FavoriteRecord[]) {
  for (const listener of listeners) listener(favorites);
}

function loadFavorites() {
  if (cachedFavorites) return Promise.resolve(cachedFavorites);
  if (!favoritesRequest) {
    favoritesRequest = api<FavoriteRecord[]>("/favorites")
      .then((favorites) => {
        cachedFavorites = favorites;
        publish(favorites);
        return favorites;
      })
      .finally(() => {
        favoritesRequest = null;
      });
  }
  return favoritesRequest;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteRecord[] | null>(
    cachedFavorites,
  );

  useEffect(() => {
    const listener = (next: FavoriteRecord[]) => setFavorites(next);
    listeners.add(listener);
    if (cachedFavorites) listener(cachedFavorites);
    else void loadFavorites().catch(() => {});
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const isFavorite = useCallback(
    (type: string, resourceId: string) =>
      Boolean(
        favorites?.some(
          (item) => item.type === type && item.resourceId === resourceId,
        ),
      ),
    [favorites],
  );

  const setFavorite = useCallback(
    (favorite: FavoriteRecord, saved: boolean) => {
      const current = cachedFavorites || [];
      const withoutCurrent = current.filter(
        (item) =>
          !(
            item.type === favorite.type &&
            item.resourceId === favorite.resourceId
          ),
      );
      cachedFavorites = saved ? [...withoutCurrent, favorite] : withoutCurrent;
      publish(cachedFavorites);
    },
    [],
  );

  return { loading: favorites === null, isFavorite, setFavorite };
}
