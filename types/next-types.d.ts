import { NextPage } from "next"
import { AppProps } from "next/app"

// Define proper types for dynamic route parameters in App Router for Next.js 15
declare module "next" {
  export interface PageProps {
    params?: Record<string, string | string[]>
    searchParams?: Record<string, string | string[] | undefined>
  }
}

// This empty export is necessary to make TypeScript treat this as a module
export {}
