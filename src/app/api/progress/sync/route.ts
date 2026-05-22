import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const progressSchema = z.object({
  xp: z.number().int().min(0).optional(),
  streakCount: z.number().int().min(0).optional(),
  streakLastDate: z.string().optional(),
  completedTests: z.string().optional(), // JSON array string
  drawnCards: z.string().optional(), // JSON array string
  lastCardDate: z.string().optional(),
  cardsDrawnToday: z.number().int().min(0).optional(),
  journalEntries: z.string().optional(), // JSON array string
  breathingSessions: z.string().optional(), // JSON array string
  unlockedAchievements: z.string().optional(), // JSON array string
  lastVisit: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = progressSchema.parse(body)

    // Build update data, only including fields that were provided
    const updateData: Record<string, unknown> = {}
    const fields = [
      "xp", "streakCount", "streakLastDate", "completedTests",
      "drawnCards", "lastCardDate", "cardsDrawnToday", "journalEntries",
      "breathingSessions", "unlockedAchievements", "lastVisit",
    ] as const

    for (const field of fields) {
      if (field in validatedData) {
        updateData[field] = validatedData[field as keyof typeof validatedData]
      }
    }

    // Upsert user progress
    const progress = await db.userProgress.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        ...updateData,
      },
    })

    return NextResponse.json({
      message: "Прогресс успешно сохранён",
      progress: {
        xp: progress.xp,
        streakCount: progress.streakCount,
        streakLastDate: progress.streakLastDate,
        completedTests: progress.completedTests,
        drawnCards: progress.drawnCards,
        lastCardDate: progress.lastCardDate,
        cardsDrawnToday: progress.cardsDrawnToday,
        journalEntries: progress.journalEntries,
        breathingSessions: progress.breathingSessions,
        unlockedAchievements: progress.unlockedAchievements,
        lastVisit: progress.lastVisit,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    console.error("Progress sync error:", error)
    return NextResponse.json(
      { error: "Произошла ошибка при сохранении прогресса" },
      { status: 500 }
    )
  }
}
