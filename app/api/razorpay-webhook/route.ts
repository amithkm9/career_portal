import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"
import nodemailer from "nodemailer"
import { supabaseAdmin } from "@/utils/supabaseAdmin"

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// Email template
const createEmailTemplate = (name: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ClassMent</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 5px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #0066FF;
    }
    .cta-button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #0066FF;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to ClassMent ${name}!</h1>
    <p>Thank you for joining ClassMent, your gateway to a successful career journey.</p>
    <p>At ClassMent, we're dedicated to helping you navigate your career path with confidence. Our comprehensive approach includes:</p>
    <ul>
      <li>Personalized career assessments</li>
      <li>Expert guidance from industry professionals</li>
      <li>Access to our innovative Explorer Graph tool</li>
      <li>Opportunities for real-world experience through externships</li>
    </ul>
    <p>We're excited to help you discover your potential and achieve your career goals.</p>
    <p>Watch out for an email with your test details coming soon!</p>
    <a href="https://theclassment.vercel.app/" class="cta-button" style="color: #ffffff !important;">Access Your Dashboard</a>
  </div>
</body>
</html>
`

// Function to send welcome email
async function sendWelcomeEmail(email: string, name: string) {
  try {
    await transporter.sendMail({
      from: '"ClassMent Team" <teamclassment@gmail.com>',
      to: email,
      cc: "ceo@theclassment.com",
      bcc: "teamclassment@gmail.com", // Added CC email
      subject: "Welcome to ClassMent!",
      html: createEmailTemplate(name),
    })
    console.log("Welcome email sent successfully")
    return true
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return false
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("Razorpay webhook secret is not configured")
    return NextResponse.json({ error: "Webhook configuration error" }, { status: 500 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get("x-razorpay-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature found" }, { status: 400 })
  }

  const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex")

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const event = JSON.parse(rawBody)

  if (event.event === "payment.captured") {
    const { payload } = event
    const paymentEntity = payload.payment.entity
    const notes = paymentEntity.notes || {}

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    try {
      const userEmail = paymentEntity.email
      const userName = notes.name || paymentEntity.contact
      const userPhone = notes.phone || paymentEntity.contact
      const userAge = notes.age || null

      if (!userEmail) {
        console.error("Email not found in payment data:", paymentEntity)
        return NextResponse.json({ error: "Email not found in payment data" }, { status: 400 })
      }

      console.log("Attempting to update profile for email:", userEmail)

      // First, try to find the user
      let { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id, email, name")
        .eq("email", userEmail)
        .single()

      // If user doesn't exist, create a new user
      if (userError || !userData) {
        console.log("User not found, creating new user with email:", userEmail)

        try {
          // Create a new user with the given email
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: userEmail, // Auto-confirm the email
            user_metadata: {
              name: userName || "",
              phone: userPhone || "",
            },
          })

          if (createError) {
            console.error("Error creating new user:", createError)
            throw createError
          }

          console.log("New user created successfully:", newUser.user.id)

          // Wait a moment for the trigger to create the profile
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // Fetch the newly created profile
          const { data: newUserData, error: newUserError } = await supabase
            .from("profiles")
            .select("id, email, name")
            .eq("id", newUser.user.id)
            .single()

          if (newUserError) {
            console.error("Error fetching new user profile:", newUserError)
            throw newUserError
          }

          userData = newUserData
        } catch (createUserError) {
          console.error("Failed to create new user:", createUserError)
          return NextResponse.json(
            {
              error: "Failed to create new user",
              details: createUserError instanceof Error ? createUserError.message : "Unknown error",
            },
            { status: 500 },
          )
        }
      }

      console.log("User found or created:", userData)

      // Send welcome email
      const emailSent = await sendWelcomeEmail(userEmail, userData.name || "")

      // Now update the user's profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          name: userName,
          phone_number: userPhone,
          age: userAge,
          payment_done: true,
          payment_id: paymentEntity.id,
          amount_paid: paymentEntity.amount / 100, // Razorpay amount is in paise, convert to rupees
          welcome_email_sent: emailSent,
        })
        .eq("id", userData.id)

      if (updateError) {
        console.error("Error updating profile:", updateError)
        throw updateError
      }

      console.log("Profile updated successfully for user:", userData.id)

      return NextResponse.json({ status: "success" })
    } catch (error) {
      console.error("Error processing webhook:", error)
      if (error instanceof Error) {
        console.error("Error details:", error.message)
      }
      return NextResponse.json(
        { error: "Failed to process webhook", details: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 },
      )
    }
  }

  return NextResponse.json({ status: "ignored" })
}

