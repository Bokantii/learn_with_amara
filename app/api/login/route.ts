import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../server/auth";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const user = authenticate(email, password);

  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ user });
  response.cookies.set("iclp_session", user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
