import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get the current user session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get counselor ID - using 'id' column instead of 'user_id'
    const { data: counselorData, error: counselorError } = await supabase
      .from("career_counselors")
      .select("id")
      .eq("id", session.user.id) // Changed from user_id to id
      .single()

    if (counselorError) {
      console.error("Counselor error:", counselorError)
      return NextResponse.json({ error: "Counselor not found", details: counselorError.message }, { status: 404 })
    }

    const counselorId = counselorData.id

    // Parse the form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const studentEmail = formData.get("email") as string
    const reportSummary = formData.get("summary") as string

    // Validate inputs
    if (!file || !studentEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate file type
    if (!file.type || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    // Find student by email
    const { data: studentData, error: studentError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", studentEmail)
      .single()

    if (studentError) {
      return NextResponse.json({ error: "Student not found", details: studentError.message }, { status: 404 })
    }

    const studentId = studentData.id

    // Generate a unique file name
    const timestamp = Date.now()
    const fileExt = "pdf"
    const fileName = `${timestamp}_${studentId}.${fileExt}`
    const filePath = `${fileName}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("mnidler-test-reports")
      .upload(filePath, file)

    if (uploadError) {
      return NextResponse.json({ error: "File upload failed", details: uploadError.message }, { status: 500 })
    }

    // Get the public URL of the uploaded file
    const { data: urlData } = supabase.storage.from("mnidler-test-reports").getPublicUrl(filePath)

    if (!urlData.publicUrl) {
      return NextResponse.json({ error: "Failed to get public URL" }, { status: 500 })
    }

    // Parse the report summary JSON
    let parsedSummary
    try {
      parsedSummary = JSON.parse(reportSummary)
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON format for report summary" }, { status: 400 })
    }

    // Check if a report already exists for this student
    const { data: existingReport, error: checkError } = await supabase
      .from("reports")
      .select("id")
      .eq("student_id", studentId)
      .eq("counselor_id", counselorId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Error checking existing report", details: checkError.message },
        { status: 500 },
      )
    }

    // Update or insert the report in the database
    if (existingReport) {
      // Update existing report
      const { error: updateError } = await supabase
        .from("reports")
        .update({
          report_url: urlData.publicUrl,
          report_summary: parsedSummary,
          email: studentEmail,
        })
        .eq("id", existingReport.id)

      if (updateError) {
        return NextResponse.json({ error: "Database update failed", details: updateError.message }, { status: 500 })
      }
    } else {
      // Insert new report
      const { error: insertError } = await supabase.from("reports").insert({
        counselor_id: counselorId,
        student_id: studentId,
        email: studentEmail,
        report_url: urlData.publicUrl,
        report_summary: parsedSummary,
      })

      if (insertError) {
        return NextResponse.json({ error: "Database insert failed", details: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      fileUrl: urlData.publicUrl,
      message: "Report uploaded successfully",
    })
  } catch (error) {
    console.error("Error in upload-report:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

