// app/(auth)/login/page.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import OAuthProviders from "@/components/auth/OAuthProviders";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { passwordSchema } from "@/schemas/custom-schemas";
import { PageSpinner } from "@/components/common/ui";

const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: passwordSchema,
});

type LoginFormType = z.infer<typeof loginSchema>;

function LoginForm() {
  const { authState, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (authState === "authenticated") {
      router.push("/dashboard");
    }
  }, [authState, router]);

  useEffect(() => {
    if (errorParam) {
      toast.error("Authentication Error", {
        description:
          errorDescription || "An unexpected error occurred. Please try again.",
        duration: 8000,
      });
    }
  }, [errorParam, errorDescription]);

  const onSubmit = async (data: LoginFormType) => {
    const { success } = await signIn(data.email ?? "", data.password ?? "");
    if (success) {
      router.push(redirectTo);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-lg rounded-lg">
      <OAuthProviders
        variant="login"
        providers={["google"]}
        className="mb-6"
        showDivider={true}
        dividerText="Or continue with email"
      />
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter your password"
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              "Sign in"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Viewer Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Sign in with your authorized company account
          </p>
        </div>
        <Suspense fallback={<PageSpinner text="Loading Form..." />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
