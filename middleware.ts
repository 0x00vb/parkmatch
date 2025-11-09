import { withAuth } from "next-auth/middleware"

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    // Add any additional middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
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
