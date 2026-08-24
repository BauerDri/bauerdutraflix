interface CatalogSkeletonProps {
  title?: boolean;
  rows?: number;
  cardsPerRow?: number;
}

export default function CatalogSkeleton({
  title = true,
  rows = 2,
  cardsPerRow = 7,
}: CatalogSkeletonProps) {
  return (
    <section className="catalog-skeleton">
      {title && (
        <div className="skeleton-title" />
      )}

      {Array.from({ length: rows }).map(
        (_, rowIndex) => (
          <div
            className="skeleton-row"
            key={rowIndex}
          >
            <div className="skeleton-row-title" />

            <div className="skeleton-cards">
              {Array.from({
                length: cardsPerRow,
              }).map((__, cardIndex) => (
                <div
                  className="skeleton-card"
                  key={cardIndex}
                >
                  <div className="skeleton-poster" />
                  <div className="skeleton-card-line" />
                  <div className="skeleton-card-line small" />
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </section>
  );
}