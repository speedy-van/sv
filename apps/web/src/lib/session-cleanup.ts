// Session cleanup utility
export function clearCorruptedSessions() {
  // Clear NextAuth cookies
  document.cookie = 'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = '__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = '__Secure-next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  // Clear localStorage
  localStorage.removeItem('next-auth.session-token');
  localStorage.removeItem('next-auth.csrf-token');
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  console.log('🧹 Session cleanup completed');
}

export function handleJWTError(error: unknown) {
  console.error('JWT Error detected:', error);
  
  if ((error as Error)?.message?.includes('JWE') || (error as Error)?.message?.includes('decrypt')) {
    console.log('🔧 Clearing corrupted JWT session...');
    clearCorruptedSessions();
    
    // Redirect to sign in
    window.location.href = '/auth/signin';
    return true;
  }
  
  return false;
}