"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CurrencySelect } from "@/components/currency-select"
import { ArrowDownUp, TrendingUp } from "lucide-react"

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  AUD: 1.52,
  CAD: 1.36,
  CHF: 0.88,
  CNY: 7.24,
  INR: 83.12,
  MXN: 17.05,
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  CNY: "¥",
  INR: "₹",
  MXN: "$",
}

export function CurrencyConverter() {
  const [amount, setAmount] = useState<string>("100")
  const [fromCurrency, setFromCurrency] = useState<string>("USD")
  const [toCurrency, setToCurrency] = useState<string>("EUR")
  const [result, setResult] = useState<number | null>(null)

  useEffect(() => {
    const numAmount = Number.parseFloat(amount)
    if (isNaN(numAmount) || amount === "") {
      setResult(null)
      return
    }

    const fromRate = EXCHANGE_RATES[fromCurrency]
    const toRate = EXCHANGE_RATES[toCurrency]
    const converted = (numAmount / fromRate) * toRate
    setResult(converted)
  }, [amount, fromCurrency, toCurrency])

  const handleSwap = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
    if (result !== null) {
      setAmount(result.toFixed(2))
      setResult(Number.parseFloat(amount))
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-white">
      <div className="relative bg-gradient-to-br from-[#40916c] via-[#2d6a4f] to-[#1b4332] px-6 py-10 pb-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white text-center tracking-tight">Currency Converter</h1>
          <p className="text-sm text-white/80 text-center font-medium tracking-wide">
            Real-time exchange rates • Instant conversion
          </p>
        </div>
      </div>

      <div className="flex-1 px-6 -mt-6 flex items-center">
        <Card className="w-full p-6 space-y-6 shadow-lg border-0">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Amount</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="text-lg h-14 bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">From</label>
              <CurrencySelect
                value={fromCurrency}
                onChange={setFromCurrency}
                currencies={Object.keys(EXCHANGE_RATES)}
              />
            </div>

            <div className="flex justify-center -my-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwap}
                className="rounded-full bg-secondary hover:bg-accent border-border h-12 w-12"
              >
                <ArrowDownUp className="h-5 w-5 text-primary" />
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">To</label>
              <CurrencySelect value={toCurrency} onChange={setToCurrency} currencies={Object.keys(EXCHANGE_RATES)} />
            </div>

            {result !== null && (
              <div className="p-6 bg-secondary/30 rounded-xl space-y-1 border border-secondary">
                <p className="text-sm text-muted-foreground">Converted Amount</p>
                <p className="text-3xl font-bold text-primary">
                  {CURRENCY_SYMBOLS[toCurrency]}
                  {result.toFixed(2)} {toCurrency}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {CURRENCY_SYMBOLS[fromCurrency]}
                  {amount} {fromCurrency} = {CURRENCY_SYMBOLS[toCurrency]}
                  {result.toFixed(2)} {toCurrency}
                </p>
              </div>
            )}
          </div>
        </Card>

        <div className="absolute bottom-0 left-0 right-0 py-6 text-center">
          <p className="text-xs text-muted-foreground">Exchange rates updated daily</p>
        </div>
      </div>
    </div>
  )
}
