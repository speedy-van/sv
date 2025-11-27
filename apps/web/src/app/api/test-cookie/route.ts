import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.json({ message: 'Cookie test' });
  
  response.headers.set('Set-Cookie', 'test-cookie=hello; Path=/; Max-Age=3600');
  
  return response;
}
