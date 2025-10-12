export function GET() {
  return new Response(
    `User-agent: *
Allow: /
Sitemap: https://speedy-van.co.uk/sitemap.xml
`,
    { headers: { 'Content-Type': 'text/plain' } }
  );
}
