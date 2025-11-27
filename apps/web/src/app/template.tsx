// Removed template to prevent SSG prerender errors
// Template was causing issues with static generation
export default function Template({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
