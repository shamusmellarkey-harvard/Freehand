import { imageUrl } from "@/lib/images";

export function ImageGallery({ fileIds, altPrefix }: { fileIds: string[]; altPrefix: string }) {
  if (fileIds.length === 0) {
    return <div className="card flex aspect-[4/3] items-center justify-center text-sm text-muted">No photos</div>;
  }
  return (
    <div className={`grid gap-3 ${fileIds.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {fileIds.map((id, i) => (
        <img
          key={id}
          src={imageUrl(id)}
          alt={`${altPrefix} photo ${i + 1}`}
          className={`w-full rounded-2xl border border-line bg-line/40 object-cover ${
            fileIds.length === 1 ? "aspect-[4/3]" : "aspect-square"
          }`}
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}
    </div>
  );
}
