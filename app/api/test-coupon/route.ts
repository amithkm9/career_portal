import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  try {
    // Create direct Supabase client without supabaseAdmin import
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: "Supabase environment variables are not set" 
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const url = new URL(request.url)
    const couponCode = url.searchParams.get("code")

    if (!couponCode) {
      return NextResponse.json({ error: "Missing coupon code" }, { status: 400 })
    }

    // Check for hardcoded coupons first (for backward compatibility)
    const validHardcodedCoupons = process.env.VALID_COUPON_CODES?.split(',') || ["NAIROBI"]
    if (validHardcodedCoupons.includes(couponCode)) {
      return NextResponse.json({
        valid: true,
        discount_type: "fixed",
        discount_value: 100
      })
    }

    // Check if coupon exists and is valid
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Check if coupon is used up (if it has a usage limit)
    if (data.max_uses && data.uses >= data.max_uses) {
      return NextResponse.json({ error: "Coupon has reached its usage limit" }, { status: 400 })
    }

    // Check if coupon is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: "Coupon is expired" }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      discount_type: data.discount_type,
      discount_value: data.discount_value
    })
  } catch (error) {
    console.error("Error testing coupon:", error)
    return NextResponse.json(
      {
        error: "An error occurred while testing the coupon",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}