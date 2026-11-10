/** Menampilkan HTML wiki yang sudah disanitasi oleh parser (lihat lib/wiki/html.ts) */
export function RichText({
  html,
  as: Tag = 'span',
  className = '',
}: {
  html: string;
  as?: 'span' | 'div' | 'p';
  className?: string;
}) {
  return (
    <Tag className={`richtext ${className}`.trim()} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
