"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout"
import { ProtectedRoute } from "@/components/protected-route"

type Question = {
  id: string
  question: string
  options: string[]
  followUp?: {
    [key: string]: string
  }
}

const questions: Question[] = [
  {
    id: "situation",
    question: "Which best describes your current situation?",
    options: [
      "Student figuring out my career path",
      "Employed but considering a change",
      "Between jobs or re-entering the workforce",
      "Currently unemployed and don't know what to do",
    ],
    followUp: {
      "Student figuring out my career path": "education",
      "Employed but considering a change": "industry",
      "Between jobs or re-entering the workforce": "previous_industry",
      "Currently unemployed and don't know what to do": "unemployed",
    },
  },
  {
    id: "education",
    question: "What is your current level of education?",
    options: ["High School", "Pre-university", "Bachelor's Degree", "Master's Degree", "Other"],
    followUp: {
      "High School": "student",
      "Pre-university": "student",
      "Bachelor's Degree": "student",
      "Master's Degree": "student",
      Other: "student",
    },
  },
  {
    id: "industry",
    question: "How many years of work experience do you have?",
    options: ["0-1", "2-4", "4-10", "More than 10"],
    followUp: {
      "0-1": "working",
      "2-4": "working",
      "4-10": "working",
      "More than 10": "working",
    },
  },
  {
    id: "previous_industry",
    question: "How many years of work experience do you have?",
    options: ["0-1", "2-4", "4-10", "More than 10"],
    followUp: {
      "0-1": "prev_working",
      "2-4": "prev_working",
      "4-10": "prev_working",
      "More than 10": "prev_working",
    },
  },
  {
    id: "student",
    question: "What's your top priority right now?",
    options: [
      "Find a career that matches my passion",
      "Land a high-paying job quickly",
      "Figure out if I need further studies",
      "Other",
    ],
    followUp: {
      "Find a career that matches my passion": "ai_replaceable",
      "Land a high-paying job quickly": "ai_replaceable",
      "Figure out if I need further studies": "ai_replaceable",
      Other: "ai_replaceable",
    },
  },
  {
    id: "working",
    question: "What's missing in your current role?",
    options: ["Growth & new challenges", "Better work-life balance", "Alignment with my real interests", "Other"],
    followUp: {
      "Growth & new challenges": "ai_replaceable",
      "Better work-life balance": "ai_replaceable",
      "Alignment with my real interests": "ai_replaceable",
      Other: "ai_replaceable",
    },
  },
  {
    id: "prev_working",
    question: "What's your biggest challenge?",
    options: [
      "Unclear about the right next step",
      "Need to build confidence",
      "Upskill quickly for new opportunities",
      "Other",
    ],
    followUp: {
      "Unclear about the right next step": "ai_replaceable",
      "Need to build confidence": "ai_replaceable",
      "Upskill quickly for new opportunities": "ai_replaceable",
      Other: "ai_replaceable",
    },
  },
  {
    id: "unemployed",
    question: "What's the toughest part of deciding on a career?",
    options: ["Not knowing where to start", "Too many options, can't pick", "Fear of choosing the wrong path", "Other"],
    followUp: {
      "Not knowing where to start": "ai_replaceable",
      "Too many options, can't pick": "ai_replaceable",
      "Fear of choosing the wrong path": "ai_replaceable",
      Other: "ai_replaceable",
    },
  },
  {
    id: "ai_replaceable",
    question:
      "65% of jobs that will exist in 2030 don't yet exist today. How worried are you that you won't be able to figure out what to do?",
    options: ["Not worried", "I'll eventually figure it out", "Worried, but not sure how to proceed", "I need help!"],
    followUp: {
      "Not worried": "testing_waters",
      "I'll eventually figure it out": "testing_waters",
      "Worried, but not sure how to proceed": "testing_waters",
      "I need help!": "testing_waters",
    },
  },
  {
    id: "testing_waters",
    question: "If there was a quick way to match your strengths to the right career path, would that help?",
    options: ["Absolutely", "Maybe, not sure yet", "Not really"],
    followUp: {
      Absolutely: "career_priorities",
      "Maybe, not sure yet": "career_priorities",
      "Not really": "career_priorities",
    },
  },
  {
    id: "career_priorities",
    question: "What matters to you the most in your career?",
    options: ["A job I love", "High salary", "Utilizing my skills", "Making an impact on the world"],
    followUp: {
      "A job I love": "ikigai_intro",
      "High salary": "ikigai_intro",
      "Utilizing my skills": "ikigai_intro",
      "Making an impact on the world": "ikigai_intro",
    },
  },
  {
    id: "ikigai_intro",
    question:
      "Imagine having all four: passion, skills, impact, and great pay. That's what finding your 'Ikigai' can do. It's the Japanese concept for your 'reason for being' – where your talents meet the world's needs.",
    options: ["Tell me more"],
    followUp: {
      "Tell me more": "final_question",
    },
  },
  {
    id: "final_question",
    question:
      "Studies show over 80% of people who find their 'Ikigai' feel more fulfilled at work. Ready to uncover yours with our career test?",
    options: ["Let's do it!"],
  },
]

export default function AppToTapContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [name, setName] = useState("") 
  const [contactNumber, setContactNumber] = useState("") 
  const [questionPath, setQuestionPath] = useState<number[]>([])
  const [showPopup, setShowPopup] = useState(false)
  const [popupText, setPopupText] = useState("")
  const [hasCheckedPhoneNumber, setHasCheckedPhoneNumber] = useState(false)

  useEffect(() => {
    if (user && !hasCheckedPhoneNumber) {
      checkExistingProfile()
      setHasCheckedPhoneNumber(true)
    }
  }, [user, hasCheckedPhoneNumber])

  const checkExistingProfile = async () => {
    if (!user) return

    try {
      // Check if user profile already exists and has a phone number
      const { data, error } = await supabase
        .from("profiles")
        .select("name, phone_number")
        .eq("id", user.id)
        .single()

      if (!error && data) {
        // If the profile exists, set the name and phone number
        if (data.name) setName(data.name)
        if (data.phone_number) setContactNumber(data.phone_number)
      }
    } catch (error) {
      console.error("Error checking existing profile:", error)
    }
  }

  const handleAnswer = (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex]
    setAnswers({ ...answers, [currentQuestion.id]: answer })
    const text = getPopupText(currentQuestion.id, answer)
    if (text) {
      setPopupText(text)
      setShowPopup(true)
    } else {
      setShowPopup(false)
    }
  }

  const nextQuestion = () => {
    setShowPopup(false)
    const currentQuestion = questions[currentQuestionIndex]
    const currentAnswer = answers[currentQuestion.id]

    if (currentQuestion.followUp && currentQuestion.followUp[currentAnswer]) {
      const nextQuestionId = currentQuestion.followUp[currentAnswer]
      const nextQuestionIndex = questions.findIndex((q) => q.id === nextQuestionId)
      setCurrentQuestionIndex(nextQuestionIndex)
      setQuestionPath([...questionPath, currentQuestionIndex])
    } else if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setQuestionPath([...questionPath, currentQuestionIndex])
    }
  }

  const prevQuestion = () => {
    setShowPopup(false)
    if (questionPath.length > 0) {
      const prevQuestionIndex = questionPath[questionPath.length - 1]
      setCurrentQuestionIndex(prevQuestionIndex)
      setQuestionPath(questionPath.slice(0, -1))
    } else if (currentQuestionIndex === 0) {
      setCurrentQuestionIndex(-1)
    }
  }

  const isLastQuestion =
    currentQuestionIndex === questions.length - 1 ||
    (currentQuestionIndex >= 0 && !questions[currentQuestionIndex].followUp)
  const isAnswered = currentQuestionIndex === -1 || answers[questions[currentQuestionIndex].id] !== undefined

  // Update the handleInitialSubmit function to create a profile if it doesn't exist
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name && contactNumber) {
      if (user) {
        try {
          // Check if profile exists
          const { data, error: fetchError } = await supabase.from("profiles").select("id").eq("id", user.id).single()

          if (fetchError && fetchError.code === "PGRST116") {
            // Profile doesn't exist, create it
            const { error } = await supabase.from("profiles").insert({
              id: user.id,
              name: name,
              phone_number: contactNumber,
              role: "student",
              atp_done: false,
              payment_done: false,
            })

            if (error) throw error
          } else {
            // Profile exists, update it
            const { error } = await supabase
              .from("profiles")
              .update({
                name: name,
                phone_number: contactNumber,
              })
              .eq("id", user.id)

            if (error) throw error
          }
        } catch (error) {
          console.error("Error updating profile:", error)
        }
      }
      setCurrentQuestionIndex(0)
    }
  }

  // Update the handleComplete function to handle missing columns
  const handleComplete = async () => {
    if (user) {
      try {
        const { error } = await supabase.from("profiles").upsert({
          id: user.id,
          atp_done: true,
          atp_data: JSON.stringify(answers),
        })
        if (error) throw error
        console.log("Answers saved successfully")
        router.push("/coupon") // Redirect to the coupon page
      } catch (error) {
        console.error("Error saving answers:", error)
      }
    } else {
      console.error("User not found")
    }
  }

  const getPopupText = (questionId: string, answer: string) => {
    if (questionId === "ai_replaceable" && answer === "Worried, but not sure how to proceed") {
      return "Don't worry, 80% of people reported feeling anxious about AI replacing their roles."
    }
    // Add more conditions for other questions and answers as needed
    return ""
  }

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center gradient-text font-space">
                Welcome to Career Accelerator
              </CardTitle>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Answer a few questions to help us get to know you better
              </p>
            </CardHeader>
            <CardContent>
              {currentQuestionIndex === -1 ? (
                <form onSubmit={handleInitialSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="bg-background/50 border-[#0066FF]/30 focus:border-[#0066FF]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactNumber">Contact Number</Label>
                    <Input
                      id="contactNumber"
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      required
                      className="bg-background/50 border-[#0066FF]/30 focus:border-[#0066FF]"
                    />
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-4">{questions[currentQuestionIndex].question}</h2>
                  <RadioGroup
                    value={answers[questions[currentQuestionIndex].id]}
                    onValueChange={handleAnswer}
                    className="space-y-2"
                  >
                    {questions[currentQuestionIndex].options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </>
              )}
              {showPopup && (
                <Alert className="mt-4 bg-blue-500/20 border border-blue-500 text-blue-400">
                  <AlertDescription>{popupText}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {currentQuestionIndex > -1 && (
                <Button onClick={prevQuestion} variant="outline">
                  Previous
                </Button>
              )}
              {currentQuestionIndex === -1 ? (
                <Button
                  onClick={handleInitialSubmit}
                  disabled={!name || !contactNumber}
                  className="bg-[#0066FF] hover:bg-[#0066FF]/80 text-white ml-auto"
                >
                  Next
                </Button>
              ) : isLastQuestion ? (
                <Button
                  onClick={handleComplete} // Updated onClick handler
                  disabled={!isAnswered}
                  className="bg-[#0066FF] hover:bg-[#0066FF]/80 text-white"
                >
                  Complete
                </Button>
              ) : (
                <Button
                  onClick={nextQuestion}
                  disabled={!isAnswered}
                  className="bg-[#0066FF] hover:bg-[#0066FF]/80 text-white"
                >
                  Next
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  )
}