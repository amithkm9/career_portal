import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import crypto from "crypto"

export async function POST(request: Request) {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    console.error("Razorpay secret key is not configured")
    return NextResponse.json({ error: "Payment verification configuration error" }, { status: 500 })
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json()

    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        payment_done: true,
        payment_id: razorpay_payment_id,
      })
      .eq("id", session.user.id)

    if (error) throw error

    return NextResponse.json({ status: "success", payment_id: razorpay_payment_id })
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 })
  }
}

