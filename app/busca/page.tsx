import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import SearchResults from "@/components/SearchResults";
import LoadingScreen from "@/components/LoadingScreen";

export default function SearchPage() {
  return (
    <main>
      <Navbar />

      <Suspense
        fallback={
          <LoadingScreen message="Pesquisando" />
        }
      >
        <SearchResults />
      </Suspense>
    </main>
  );
}
