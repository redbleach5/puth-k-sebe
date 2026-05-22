import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { z } from "zod"
import { db } from "@/lib/db"

const registerSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  name: z.string().min(1, "Введите ваше имя").max(50, "Имя слишком длинное"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hash(validatedData.password, 12)

    // Create user with free subscription
    const user = await db.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        passwordHash,
        subscription: {
          create: {
            plan: "free",
            status: "free",
          },
        },
      },
      include: {
        subscription: true,
      },
    })

    return NextResponse.json(
      {
        message: "Регистрация прошла успешно",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.subscription?.plan ?? "free",
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Произошла ошибка при регистрации. Попробуйте позже." },
      { status: 500 }
    )
  }
}
