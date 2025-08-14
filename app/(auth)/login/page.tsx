"use client";
import Link from "next/link";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import OAuthProviders from "@/components/auth/OAuthProviders";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const { authState, signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  if (authState === "authenticated") {
    redirect("/dashboard");
  }

  const router = useRouter();
  const searchParams = useSearchParams();

  const errorParam = searchParams.get("error");
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (errorParam === "oauth_failed") {
      toast.error("OAuth authentication failed. Please try again.");
    }
  }, [errorParam]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    const success = await signIn(formData.email, formData.password);

    if (success) {
      router.push(redirectTo);
    } else {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white font-family-heading'>
            Sign in to your account
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600 dark:text-gray-400'>
            Or{" "}
            <Link
              href='/signup'
              className='font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300'
            >
              create a new account
            </Link>
          </p>
        </div>

        <div className='bg-white dark:bg-gray-800 py-8 px-6 shadow-lg rounded-lg'>
          <OAuthProviders variant='login' providers={["google"]} className='mb-6' />

          <form className='space-y-6' onSubmit={handleSubmit}>
            <div>
              <label htmlFor='email' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Email address
              </label>
              <input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                value={formData.email}
                onChange={handleInputChange}
                required
                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-gray-700 dark:text-white'
                placeholder='Enter your email'
              />
            </div>

            <div>
              <label htmlFor='password' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Password
              </label>
              <input
                id='password'
                name='password'
                type='password'
                autoComplete='current-password'
                value={formData.password}
                onChange={handleInputChange}
                required
                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 dark:bg-gray-700 dark:text-white'
                placeholder='Enter your password'
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='text-sm'>
                <Link
                  href='/forgot-password'
                  className='font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300'
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type='submit'
                disabled={isSubmitting}
                className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400'
              >
                {isSubmitting ? <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div> : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}