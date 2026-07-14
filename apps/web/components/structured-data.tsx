type JsonLd = Record<string, unknown>;

interface StructuredDataProps {
  data: JsonLd | JsonLd[];
}

export function StructuredData({ data }: StructuredDataProps) {
  const schemas = Array.isArray(data) ? data : [data];

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            // Escape closing script tags to prevent XSS when product data
            // contains "</script>" sequences from admin input.
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
