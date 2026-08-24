export default function SeriesDetailsSkeleton() {
  return (
    <>
      <section className="series-details-skeleton">
        <div className="series-details-skeleton-overlay" />

        <div className="series-copy-skeleton">
          <div className="skeleton-heading large" />
          <div className="skeleton-text-line" />
          <div className="skeleton-text-line" />
          <div className="skeleton-text-line short" />
        </div>
      </section>

      <section className="episodes-skeleton">
        <div className="skeleton-tabs">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <div key={index} />
            )
          )}
        </div>

        <div className="skeleton-heading medium" />

        {Array.from({ length: 5 }).map(
          (_, index) => (
            <div
              className="episode-skeleton-card"
              key={index}
            >
              <div className="episode-image-skeleton" />

              <div className="episode-copy-skeleton">
                <div className="skeleton-text-line" />
                <div className="skeleton-text-line" />
                <div className="skeleton-text-line short" />
              </div>
            </div>
          )
        )}
      </section>
    </>
  );
}