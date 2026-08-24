interface Props {
  message?: string;
}

export default function LoadingScreen({
  message = "Carregando seu catálogo",
}: Props) {
  return (
    <section className="loading-screen">
      <div className="loading-logo">
        BauerDutraFlix
      </div>
      <p>{message}</p>
      <div className="loading-track">
        <span />
      </div>
    </section>
  );
}
