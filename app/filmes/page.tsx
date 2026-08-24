import Navbar from "@/components/Navbar";
import CatalogPage from "@/components/CatalogPage";

export default function MoviesPage() {
  return (
    <main>
      <Navbar />
      <CatalogPage type="filme" />
    </main>
  );
}
