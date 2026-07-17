"use client";

export function PlayerAvatar({ url, name, size = "md", className = "", initialsClass }: {
  url?: string | null; name?: string | null; size?: "sm" | "md" | "lg" | "xl"; className?: string; initialsClass?: string;
}) {
  const sizeMap = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg", xl: "h-16 w-16 text-2xl" };
  const shapeMap = { sm: "rounded-full", md: "rounded-full", lg: "rounded-xl", xl: "rounded-2xl" };
  const dim = sizeMap[size] || sizeMap.md;
  const shape = shapeMap[size] || shapeMap.md;
  const initial = name?.charAt(0)?.toUpperCase() || "?";

  if (url) {
    return (
      <div className={`${dim} ${shape} overflow-hidden shrink-0 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={name || ""} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${dim} ${shape} flex items-center justify-center font-semibold shrink-0 ${initialsClass || "bg-veil-gold/10 text-veil-gold"} ${className}`}>
      {initial}
    </div>
  );
}
