import type { MediaItem } from "@/types/catalog";
import MediaCard from "./MediaCard";

interface Props {
  title: string;
  items: MediaItem[];
  type: "filme" | "serie";
}

export default function MediaRow({
  title,
  items,
  type,
}: Props) {
  if (!items.length) return null;

  return (
    <section className="row">
      <h2>{title}</h2>
      <div className="row-track">
        {items.map((item) => (
          <MediaCard
            key={`${type}-${item.id}`}
            item={item}
            type={type}
          />
        ))}
      </div>
    </section>
  );
}
