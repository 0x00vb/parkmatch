import { withAuth } from "next-auth/middleware"

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    // Add any additional middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow public access to garages API with public=true parameter
        if (req.nextUrl.pathname === '/api/garages' && req.nextUrl.searchParams.get('public') === 'true') {
          return true;
        }
        // Require authentication for all other protected routes
        return !!token;
      }
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/setup/:path*",
    "/api/user/:path*",
    "/api/vehicles/:path*",
    "/api/garages/:path*",
    "/api/parking-spots/:path*",
    "/api/upload/:path*"
  ]
}
