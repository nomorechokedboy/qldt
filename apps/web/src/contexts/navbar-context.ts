import { createContext } from 'react'

// Split out of __root.tsx: a route file that also exports a plain context
// breaks Vite Fast Refresh ("export is incompatible") for the route module.
export const NavbarContext = createContext(true)
