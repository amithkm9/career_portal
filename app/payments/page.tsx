"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout"
import { Banknote, Pencil, Rocket } from "lucide-react"

interface PlanFeature {
  feature: string
  included: boolean
}

interface PricingPlan {
  name: string
  price: string
  originalPrice: string
  color: string
  hoverColor: string
  textColor: string
  link: string
  badge?: string
  features: PlanFeature[]
  description: string
  icon: string
}

const plans: PricingPlan[] = [
  {
    name: "Basic",
    price: "1,499",
    originalPrice: "2,400",
    color: "bg-[#3B4BF9]",
    hoverColor: "hover:bg-[#3B4BF9]/90",
    textColor: "text-[#3B4BF9]",
    link: "https://rzp.io/rzp/fKp1PsZD",
    icon: "pencil",
    description:
      "You can access psychometric test and know about your core personality which you can refer for a lifetime.",
    features: [
      {
        feature: "Psychometric Test developed by 25 PhDs",
        included: true,
      },
      {
        feature: "5 Career Fields that fits your personality",
        included: true,
      },
      {
        feature: "34 page detailed report about your personality",
        included: true,
      },
      {
        feature: "Career Guidance Session",
        included: false,
      },
      {
        feature: "Access to Career Exploration tool",
        included: false,
      },
      {
        feature: "Actionable roadmap",
        included: false,
      },
    ],
  },
  {
    name: "Pro",
    price: "4,999",
    originalPrice: "10,500",
    color: "bg-[#9333EA]",
    hoverColor: "hover:bg-[#9333EA]/90",
    textColor: "text-[#9333EA]",
    link: "https://rzp.io/rzp/kQw7uW92",
    badge: "Most Picked",
    icon: "rocket",
    description:
      "Basic plan + Career Manager to help you understand the report, work on your CV, LinkedIn and help you with companies",
    features: [
      {
        feature: "Psychometric Test developed by 25 PhDs",
        included: true,
      },
      {
        feature: "5 Career Fields that fits your personality",
        included: true,
      },
      {
        feature: "34 page detailed report about your personality",
        included: true,
      },
      {
        feature: "2 x Career Guidance Session with a Internationally Certified Counselor",
        included: true,
      },
      {
        feature: "Access to our signature Career Exploration tool with job roles and earning potential",
        included: true,
      },
      {
        feature: "Actionable roadmap with 3 month and 12 month plan",
        included: true,
      },
    ],
  },
  {
    name: "Premium",
    price: "8,499",
    originalPrice: "15,800",
    color: "bg-[#0066FF]",
    hoverColor: "hover:bg-[#0066FF]/90",
    textColor: "text-[#0066FF]",
    link: "https://rzp.io/rzp/6359V3S2",
    badge: "Recommended",
    icon: "banknote",
    description:
      "Our best plan, get benefits worth ₹15.8k+ with actionable insights on getting 30% hike in salary and job search support.",
    features: [
      {
        feature: "All things Pro +",
        included: true,
      },
      {
        feature: "Personal Career Manager for 3 months from career exploration to job support",
        included: true,
      },
      {
        feature: "Actionable guidance and management of your career by an International Career Coach",
        included: true,
      },
      {
        feature: "CV review & 2x Mock interview with industry leader ",
        included: true,
      },
      {
        feature: "Referal from an industry leader in your field",
        included: true,
      },
      {
        feature: "Guaranteed Work Opportunities",
        included: true,
      },
    ],
  },
]

export default function PaymentsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [paymentDone, setPaymentDone] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkPaymentStatus() {
      if (user) {
        try {
          const { data, error } = await supabase.from("profiles").select("payment_done").eq("id", user.id).single()

          if (error) {
            console.error("Error fetching payment status:", error)
            return
          }

          setPaymentDone(data.payment_done)

          // If payment is done, redirect to home
          if (data.payment_done) {
            router.push("/")
            return
          }

          // Check for coupon code
          try {
            const { data: couponData, error: couponError } = await supabase
              .from("profiles")
              .select("coupon_code")
              .eq("id", user.id)
              .single()

            // If coupon_code exists and is "NAIROBI", redirect to home
            if (!couponError && couponData.coupon_code === "NAIROBI") {
              router.push("/")
            }
          } catch (couponError) {
            // If there's an error (likely column doesn't exist), just stay on the page
            console.log("Coupon code column may not exist yet:", couponError)
          }
        } catch (error) {
          console.error("Error in checkPaymentStatus:", error)
        }
      }
    }

    if (!loading) {
      if (!user) {
        router.push("/login")
      } else {
        checkPaymentStatus()
      }
    }
  }, [user, loading, router])

  if (loading || paymentDone === null) {
    return null
  }

  if (paymentDone) {
    return null
  }

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Career Journey</h1>
          <p className="text-lg text-gray-400">
            Select the plan that best fits your needs and start your journey towards a fulfilling career
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 ${
                plan.badge === "Most Picked" ? "border-[#9333EA] md:scale-105 z-10" : ""
              }`}
            >
              {plan.badge && (
                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  {plan.icon === "pencil" && (
                    <div className="w-10 h-10 rounded-full bg-[#1E293B] flex items-center justify-center">
                      <Pencil className="h-5 w-5" />
                    </div>
                  )}
                  {plan.icon === "rocket" && (
                    <div className="w-10 h-10 rounded-full bg-[#1E293B] flex items-center justify-center">
                      <Rocket className="h-5 w-5" />
                    </div>
                  )}
                  {plan.icon === "banknote" && (
                    <div className="w-10 h-10 rounded-full bg-[#1E293B] flex items-center justify-center">
                      <Banknote className="h-5 w-5" />
                    </div>
                  )}
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold">₹{plan.price}</span>
                  <span className="text-gray-500 line-through text-sm">₹{plan.originalPrice}</span>
                </div>
                <p className="text-sm text-gray-400">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3 min-h-[350px]">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 min-h-[28px]">
                      <div className="flex-shrink-0 w-5 mt-0.5">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <span className="text-sm text-gray-300">{feature.feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className={`w-full ${plan.color} ${plan.hoverColor} text-white`}>
                  <a href={plan.link} target="_blank" rel="noopener noreferrer">
                    Pay with Razorpay
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}

