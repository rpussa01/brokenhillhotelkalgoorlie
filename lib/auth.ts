import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "development-only-secret-change-before-production"
);

export async function createAdminSession() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);

  const store = await cookies();
  store.set("brokie_admin", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/"
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete("brokie_admin");
}

export async function isAdmin() {
  try {
    const store = await cookies();
    const token = store.get("brokie_admin")?.value;
    if (!token) return false;
    const verified = await jwtVerify(token, secret);
    return verified.payload.role === "admin";
  } catch {
    return false;
  }
}
