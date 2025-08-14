"use client";

import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";

export default function SignUpPage() {
  const { signUp, authState } = useAuth();

  if (authState === "authenticated") {
    redirect("/onboarding");
  }

  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const success = await signUp({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
    });

    if (success) {
      router.push("/verify-email");
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white'>
            Create your account
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600 dark:text-gray-400'>
            Or{" "}
            <Link href='/login' className='font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300'>
              sign in to your existing account
            </Link>
          </p>
        </div>

        <div className='bg-white dark:bg-gray-800 py-8 px-6 shadow-lg rounded-lg'>
          {/* Signup Form */}
          <form className='space-y-6' onSubmit={handleSubmit}>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label htmlFor='firstName' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                  First name *
                </label>
                <input
                  id='firstName'
                  name='firstName'
                  type='text'
                  autoComplete='given-name'
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400'
                  placeholder='First name'
                />
              </div>

              <div>
                <label htmlFor='lastName' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Last name *
                </label>
                <input
                  id='lastName'
                  name='lastName'
                  type='text'
                  autoComplete='family-name'
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400'
                  placeholder='Last name'
                />
              </div>
            </div>

            <div>
              <label htmlFor='email' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Email address *
              </label>
              <input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                required
                value={formData.email}
                onChange={handleInputChange}
                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400'
                placeholder='Enter your email'
              />
            </div>

            <div>
              <label htmlFor='password' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Password *
              </label>
              <input
                id='password'
                name='password'
                type='password'
                autoComplete='new-password'
                required
                value={formData.password}
                onChange={handleInputChange}
                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400'
                placeholder='Create a password'
              />
              <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>Must be at least 6 characters</p>
            </div>

            <div>
              <label htmlFor='confirmPassword' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Confirm password *
              </label>
              <input
                id='confirmPassword'
                name='confirmPassword'
                type='password'
                autoComplete='new-password'
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400'
                placeholder='Confirm your password'
              />
            </div>

            <div>
              <button
                type='submit'
                disabled={authState === "loading"}
                className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-800'
              >
                {authState === "loading" ? <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div> : "Create account"}
              </button>
            </div>

            <div className='text-center'>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                By creating an account, you agree to our{" "}
                <Link href='/terms' className='text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300'>
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href='/privacy' className='text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300'>
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