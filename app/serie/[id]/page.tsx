"use client";

import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import SeriesDetails from "@/components/SeriesDetails";

export default function SeriesDetailsPage() {
  const params = useParams<{id: string}>();

  return (
    <main>
      <Navbar />
      <SeriesDetails id={params.id} />
    </main>
  );
}
