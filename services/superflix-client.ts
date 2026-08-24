type Category =
  | "filme"
  | "serie";

const cache =
  new Map<Category, Set<number>>();

const requests =
  new Map<
    Category,
    Promise<Set<number>>
  >();

export async function getAvailableIds(
  category: Category
): Promise<Set<number>> {
  const cached =
    cache.get(category);

  if (cached) {
    return cached;
  }

  /*
   * Se outra parte da página já estiver buscando
   * essa categoria, reaproveitamos a mesma Promise.
   */
  const currentRequest =
    requests.get(category);

  if (currentRequest) {
    return currentRequest;
  }

  const operation =
    fetch(
      `/api/superflix/ids?category=${category}`
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            "Não foi possível consultar a SuperFlix."
          );
        }

        const ids =
          (await response.json()) as number[];

        const result =
          new Set(ids);

        cache.set(
          category,
          result
        );

        return result;
      })
      .finally(() => {
        requests.delete(category);
      });

  requests.set(
    category,
    operation
  );

  return operation;
}