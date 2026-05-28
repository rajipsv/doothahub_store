import Image from "next/image";
import { normalizeProductImageUrl } from "@/modules/catalog/lib/product-image-url";

type GalleryImage = {
  id: string;
  url: string;
  alt: string | null;
};

type Props = {
  images: GalleryImage[];
  title: string;
};

export function ProductImageGallery({ images, title }: Props) {
  const cover = images[0];

  if (!cover) {
    return (
      <div className="flex aspect-square w-full max-w-xl items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
        No image
      </div>
    );
  }

  const coverSrc = normalizeProductImageUrl(cover.url);

  return (
    <div className="w-full min-w-0 space-y-3 md:max-w-xl">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
        <Image
          src={coverSrc}
          alt={cover.alt ?? title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>
      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-2">
          {images.slice(1).map((img) => (
            <div
              key={img.id}
              className="relative aspect-square w-full overflow-hidden rounded-md bg-muted"
            >
              <Image
                src={normalizeProductImageUrl(img.url)}
                alt={img.alt ?? title}
                fill
                sizes="25vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
