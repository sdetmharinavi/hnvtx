"use client";

import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { SignupFormData, signupSchema } from "@/schemas/userSchema";
import { zodResolver } from "@hookform/resolvers/zod";

export default function SignUpPage() {
  const { signUp, authState } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (authState === "authenticated") {
      redirect("/onboarding");
    }
  }, [authState]);

  // Setup React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Form submit handler
  const onSubmit = async (data: SignupFormData) => {
    const success = await signUp({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    if (success) {
      router.push("/verify-email");
    } else {
      toast.error("Sign up failed. Please try again.");
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white'>Create your account</h2>
          <p className='mt-2 text-center text-sm text-gray-600 dark:text-gray-400'>
            Or{" "}
            <Link href='/login' className='font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300'>
              sign in to your existing account
            </Link>
          </p>
        </div>

        <div className='bg-white dark:bg-gray-800 py-8 px-6 shadow-lg rounded-lg'>
          <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label htmlFor='firstName' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                  First name *
                </label>
                <input
                  id='firstName'
                  type='text'
                  autoComplete='given-name'
                  {...register("firstName")}
                  className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white'
                  placeholder='First name'
                />
                {errors.firstName && <p className='text-red-500 text-sm'>{errors.firstName.message}</p>}
              </div>

              <div>
                <label htmlFor='lastName' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Last name *
                </label>
                <input
                  id='lastName'
                  type='text'
                  autoComplete='family-name'
                  {...register("lastName")}
                  className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white'
                  placeholder='Last name'
                />
                {errors.lastName && <p className='text-red-500 text-sm'>{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor='email' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Email address *
              </label>
              <input
                id='email'
                type='email'
                autoComplete='email'
                {...register("email")}
                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white'
                placeholder='Enter your email'
              />
              {errors.email && <p className='text-red-500 text-sm'>{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor='password' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Password *
              </label>
              <input
                id='password'
                type='password'
                autoComplete='new-password'
                {...register("password")}
                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white'
                placeholder='Create a password'
              />
              {errors.password && <p className='text-red-500 text-sm'>{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor='confirmPassword' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Confirm password *
              </label>
              <input
                id='confirmPassword'
                type='password'
                autoComplete='new-password'
                {...register("confirmPassword")}
                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white'
                placeholder='Confirm your password'
              />
              {errors.confirmPassword && <p className='text-red-500 text-sm'>{errors.confirmPassword.message}</p>}
            </div>

            <div>
              <button
                type='submit'
                disabled={isSubmitting || authState === "loading"}
                className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50'>
                {isSubmitting || authState === "loading" ? <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div> : "Create account"}
              </button>
            </div>

            <div className='text-center'>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                By creating an account, you agree to our{" "}
                <Link href='/terms' className='text-blue-600 hover:text-blue-500 dark:text-blue-400'>
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href='/privacy' className='text-blue-600 hover:text-blue-500 dark:text-blue-400'>
                  Privacy Policy
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
