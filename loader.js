"use client"

export default function myImageLoader({ src, width, quality }) {
  if (process.env.NODE_ENV === "development") {
    return src;
  }

  const operations = [
    {
      operation: "input",
      type: "url",
      url: src,
    },
    { operation: "resize", width: width },
    { operation: "output", format: "webp", quality: quality || 75 },
  ];

  const encodedOperations = encodeURIComponent(JSON.stringify(operations));

  return `/_fah/image/process?operations=${encodedOperations}`;
}
