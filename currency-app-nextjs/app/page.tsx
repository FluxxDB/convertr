"use client"
import { CurrencyConverter } from "@/components/currency-converter"

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-background flex items-center">
      <CurrencyConverter />
    </main>
  )
}
