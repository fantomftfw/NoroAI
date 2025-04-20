// app/api/openapi.json/route.js
import { NextResponse } from 'next/server';
import { openapiSpecification } from '@/lib/swagger'; // Adjust path as needed
import { NextRequest } from 'next/server';
// Define CORS headers - Important for allowing the /docs page to fetch this
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Or restrict to your domain in production
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Handler for GET requests
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  // Serve the OpenAPI specification as JSON with CORS headers
  return NextResponse.json(openapiSpecification, {
    headers: corsHeaders
  });
}

// Handler for OPTIONS preflight requests
// Necessary for browsers to allow the actual GET request from a different origin (your /docs page)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204, // No Content
    headers: corsHeaders,
  });
}