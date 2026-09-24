"use client";

import Image from "next/image";
import { useState } from "react";

import { normalizeCatalogImageUrl } from "../lib/catalog-image.mjs";

export default function CatalogImage({
  alt = "",
  className,
  fallbackClassName,
  fallbackLabel,
  priority = false,
  sizes,
  src,
}) {
  const [hasError, setHasError] = useState(false);
  const normalizedSrc = normalizeCatalogImageUrl(src);

  if (!normalizedSrc || hasError) {
    return fallbackLabel ? (
      <span className={fallbackClassName}>{fallbackLabel}</span>
    ) : null;
  }

  return (
    <Image
      alt={alt}
      className={className}
      fill
      onError={() => setHasError(true)}
      priority={priority}
      sizes={sizes}
      src={normalizedSrc}
    />
  );
}
