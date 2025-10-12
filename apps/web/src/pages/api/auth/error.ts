import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { error } = req.query;
  
  console.error('NextAuth Error:', error);
  
  // Handle specific JWT errors
  if (error === 'JWEDecryptionFailed' || error === 'JWT_SESSION_ERROR') {
    // Clear corrupted session cookies
    res.setHeader('Set-Cookie', [
      'next-auth.session-token=; Max-Age=0; Path=/',
      '__Secure-next-auth.session-token=; Max-Age=0; Path=/; Secure; HttpOnly',
      'next-auth.csrf-token=; Max-Age=0; Path=/',
      '__Secure-next-auth.csrf-token=; Max-Age=0; Path=/; Secure; HttpOnly'
    ]);
    
    return res.redirect('/auth/signin?error=SessionExpired');
  }
  
  // Default error page
  res.status(200).json({ 
    error: 'Authentication Error',
    message: 'Please try signing in again.',
    action: 'redirect_to_signin'
  });
}