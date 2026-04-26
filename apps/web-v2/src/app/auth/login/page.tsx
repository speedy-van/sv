"use client";

import Link from "next/link";
import { chakra } from "@chakra-ui/react";
import { AuthShell } from "@/components/auth/AuthShell";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Speedy Van"
      subtitle="Manage bookings, track moves, and access your account."
      fields={[
        {
          name: "email",
          label: "Email",
          type: "email",
          autoComplete: "email",
          placeholder: "you@example.com",
        },
        {
          name: "password",
          label: "Password",
          type: "password",
          autoComplete: "current-password",
          placeholder: "••••••••",
        },
      ]}
      submitLabel="Sign In"
      apiUrl={`${API}/api/auth/callback/credentials`}
      footer={
        <>
          New to Speedy Van?{" "}
          <Link href="/auth/register">
            <chakra.span color="gold" fontWeight="500" _hover={{ textDecoration: "underline" }}>
              Create an account
            </chakra.span>
          </Link>
        </>
      }
    />
  );
}