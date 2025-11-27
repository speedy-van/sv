// Legacy Pages Router error page to prevent Next.js from generating default _error
// This fixes the prerender bug in Next.js 15
export default function Error() {
  return null;
}

// Prevent static generation
export async function getServerSideProps() {
  return { props: {} };
}
