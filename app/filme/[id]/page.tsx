"use client";

import {
  useParams,
} from "next/navigation";

import Navbar from "@/components/Navbar";
import MovieDetails from "@/components/MovieDetails";

export default function MovieDetailsPage() {
  const params =
    useParams<{
      id: string;
    }>();

  return (
    <main>
      <Navbar />

      <MovieDetails
        id={params.id}
      />
    </main>
  );
}