// app/docs/page.jsx
'use client' // <<<--- MUST BE A CLIENT COMPONENT

import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css' // Import CSS

// Dynamically import SwaggerUI to ensure it's client-side only
// No changes needed here compared to the pages router version
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

function ApiDocsPage() {
  // The component itself remains largely the same
  return (
    <section>
      {/* Point the url prop to the App Router API route serving the spec */}
      <SwaggerUI url="/api/openapi.json" />
    </section>
  )
}

export default ApiDocsPage

// Optional: Add metadata in layout.js or page.js if needed
// export const metadata = {
//   title: 'API Documentation',
//   description: 'API Docs for My Next.js App Router App',
// };
