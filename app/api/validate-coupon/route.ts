import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/utils/supabaseAdmin"

export async function POST(request: NextRequest) {
  try {
    const { couponCode, userId } = await request.json()

    // Validate that the request has the required fields
    if (!couponCode || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get the valid coupon code from environment variable
    const validCouponCode = process.env.VALID_COUPON_CODE

    // Check if the coupon code is valid
    const isValid = couponCode.toUpperCase() === validCouponCode

    if (isValid) {
      // Update the user's profile to mark payment as done
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ payment_done: true })
        .eq("id", userId)

      if (error) {
        console.error("Error updating profile:", error)
        return NextResponse.json(
          { valid: false, error: "Error updating profile" },
          { status: 500 }
        )
      }

      return NextResponse.json({ valid: true })
    }

    return NextResponse.json({ valid: false })
  } catch (error) {
    console.error("Error validating coupon:", error)
    return NextResponse.json(
      { valid: false, error: "Error processing request" },
      { status: 500 }
    )
  }
}