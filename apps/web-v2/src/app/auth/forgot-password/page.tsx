"use client";

import Link from "next/link";
import { chakra } from "@chakra-ui/react";
import { AuthShell } from "@/components/auth/AuthShell";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle="Enter the email on your account and we'll send you a reset link."
      fields={[
        {
          name: "email",
          label: "Email",
          type: "email",
          autoComplete: "email",
          placeholder: "you@example.com",
        },
      ]}
      submitLabel="Send Reset Link"
      apiUrl={`${API}/api/auth/forgot-password`}
      footer={
        <>
          Remember it?{" "}
          <Link href="/auth/login">
            <chakra.span color="gold" fontWeight="500" _hover={{ textDecoration: "underline" }}>
              Sign in
            </chakra.span>
          </Link>
        </>
      }
    />
  );
}
