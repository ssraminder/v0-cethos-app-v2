"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QuoteWidget } from "@/components/quote-widget"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Get user role from profiles table
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        setUserRole(profile?.role || "customer")
      }

      setLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

        setUserRole(profile?.role || "customer")
      } else {
        setUserRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-96 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold text-foreground">Cethos Quote Platform</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get instant quotes for professional certified translation services
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get Your Quote</CardTitle>
            <CardDescription>
              Upload your documents and receive an instant quote for certified translation services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuoteWidget />
          </CardContent>
        </Card>

        {user && (
          <div className="flex justify-center space-x-4">
            {userRole === "customer" && (
              <Link href="/portal">
                <Button size="lg">Go to My Portal</Button>
              </Link>
            )}
            {userRole && ["pm", "admin", "manager", "sales", "accountant", "assistant"].includes(userRole) && (
              <Link href="/staff">
                <Button size="lg">Go to Staff Panel</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
