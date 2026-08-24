export default function MovieDetailsSkeleton() {
  return (
    <section className="movie-details-skeleton">
      <div className="movie-details-skeleton-overlay" />

      <div className="movie-details-skeleton-content">
        <div className="movie-poster-skeleton" />

        <div className="movie-copy-skeleton">
          <div className="skeleton-badge" />
          <div className="skeleton-heading large" />
          <div className="skeleton-heading medium" />
          <div className="skeleton-text-line" />
          <div className="skeleton-text-line" />
          <div className="skeleton-text-line short" />

          <div className="skeleton-actions">
            <div />
            <div />
          </div>
        </div>
      </div>
    </section>
  );
}