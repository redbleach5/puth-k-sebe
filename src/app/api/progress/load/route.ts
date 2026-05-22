import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      )
    }

    const progress = await db.userProgress.findUnique({
      where: { userId: session.user.id },
    })

    if (!progress) {
      // Return default progress values
      return NextResponse.json({
        xp: 0,
        streakCount: 0,
        streakLastDate: "",
        completedTests: "[]",
        drawnCards: "[]",
        lastCardDate: "",
        cardsDrawnToday: 0,
        journalEntries: "[]",
        breathingSessions: "[]",
        unlockedAchievements: "[]",
        lastVisit: "",
      })
    }

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error("Progress load error:", error)
    return NextResponse.json(
      { error: "Произошла ошибка при загрузке прогресса" },
      { status: 500 }
    )
  }
}
