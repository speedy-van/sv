"use client";

import Link from "next/link";
import { chakra } from "@chakra-ui/react";
import { AuthShell } from "@/components/auth/AuthShell";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      subtitle="Save addresses, view history, and book in seconds next time."
      fields={[
        {
          name: "name",
          label: "Full name",
          type: "text",
          autoComplete: "name",
          placeholder: "Sarah Thompson",
        },
        {
          name: "email",
          label: "Email",
          type: "email",
          autoComplete: "email",
          placeholder: "you@example.com",
        },
        {
          name: "phone",
          label: "Phone",
          type: "tel",
          autoComplete: "tel",
          placeholder: "07000 000 000",
        },
        {
          name: "password",
          label: "Password",
          type: "password",
          autoComplete: "new-password",
          placeholder: "Min 8 characters",
        },
      ]}
      submitLabel="Create Account"
      apiUrl={`${API}/api/auth/register`}
      footer={
        <>
          Already a customer?{" "}
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