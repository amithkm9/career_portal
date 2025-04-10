import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/utils/supabaseAdmin"

export async function POST(request: NextRequest) {
  try {
    // Get the coupon code and user ID from the request body
    const { couponCode, userId } = await request.json()

    // Validate that the request has the required fields
    if (!couponCode || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if the coupon code exists in the coupons table
    const { data: couponData, error: couponError } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("code", couponCode)
      .single()

    // If there's an error, the coupon doesn't exist
    if (couponError) {
      // Check if it's the special hardcoded coupon (for backward compatibility)
      // This should eventually be migrated to the database
      const validHardcodedCoupons = process.env.VALID_COUPON_CODES?.split(',') || ["NAIROBI"]
      const isValidHardcodedCoupon = validHardcodedCoupons.includes(couponCode)

      if (isValidHardcodedCoupon) {
        // Update the user's profile to mark payment as done
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ 
            payment_done: true,
            coupon_code: couponCode
          })
          .eq("id", userId)

        if (error) {
          console.error("Error updating profile:", error)
          return NextResponse.json(
            { valid: false, error: "Error updating profile" },
            { status: 500 }
          )
        }

        return NextResponse.json({ 
          valid: true,
          message: "Coupon applied successfully!"
        })
      }

      return NextResponse.json({ 
        valid: false, 
        message: "Invalid coupon code"
      })
    }

    // Check if coupon has reached usage limit (if any)
    if (couponData.max_uses && couponData.uses >= couponData.max_uses) {
      return NextResponse.json({ 
        valid: false, 
        message: "Coupon has reached its usage limit"
      })
    }

    // Check if coupon is expired
    if (couponData.expires_at && new Date(couponData.expires_at) < new Date()) {
      return NextResponse.json({ 
        valid: false, 
        message: "Coupon has expired"
      })
    }

    // Update the user's profile to mark payment as done
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ 
        payment_done: true,
        coupon_code: couponCode 
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating profile:", updateError)
      return NextResponse.json(
        { valid: false, error: "Error updating profile" },
        { status: 500 }
      )
    }

    // Increment the usage count for the coupon
    const { error: incrementError } = await supabaseAdmin
      .from("coupons")
      .update({ uses: (couponData.uses || 0) + 1 })
      .eq("code", couponCode)

    if (incrementError) {
      console.error("Error incrementing coupon usage:", incrementError)
      // We don't need to return an error here as the profile update was successful
    }

    return NextResponse.json({ 
      valid: true,
      message: "Coupon applied successfully!"
    })
  } catch (error) {
    console.error("Error validating coupon:", error)
    return NextResponse.json(
      { valid: false, error: "Error processing request" },
      { status: 500 }
    )
  }
}