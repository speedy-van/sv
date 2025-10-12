/**
 * No-op endpoint to handle Chrome DevTools requests
 * Returns 204 No Content to avoid 404 warnings in logs
 */

export function GET() {
  return new Response(null, { status: 204 });
}