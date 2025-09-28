"use server";

import { redirect } from "next/navigation";
import { createClient } from "./lib/supabase/server";
import {
  type ForgotPasswordFormData,
  forgotPasswordFormSchema,
  type ResetPasswordFormData,
  resetPasswordFormSchema,
  type SignInFormData,
  signInFormSchema,
  type SignUpFormData,
  signUpFormSchema,
} from "./types/validations";

export const signUpAction = async (values: SignUpFormData) => {
  if (!signUpFormSchema.safeParse(values)) {
    return {
      success: false,
      message: "Invalid payload",
    };
  }

  const { email, password } = values;

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.message);
    return { success: false, message: error.message };
  } else {
    return {
      success: true,
      message: "Check your email for a confirmation link.",
    };
  }
};

export const signInAction = async (values: SignInFormData) => {
  if (!signInFormSchema.safeParse(values)) {
    return {
      success: false,
      message: "Invalid payload",
    };
  }

  const { email, password } = values;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error(error.message);
    return { success: false, message: "Wrong email or password" };
  }

  return { success: true, message: "Logged in successfully" };
};

export const forgotPasswordAction = async (values: ForgotPasswordFormData) => {
  if (!forgotPasswordFormSchema.safeParse(values)) {
    return {
      success: false,
      message: "Invalid payload",
    };
  }

  const { email } = values;

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?redirect_to=/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return {
      success: false,
      message: "Could not reset password",
    };
  }

  return {
    success: true,
    message: "Check your email for a password reset link.",
  };
};

export const resetPasswordAction = async (values: ResetPasswordFormData) => {
  if (!resetPasswordFormSchema.safeParse(values)) {
    return {
      success: false,
      message: "Invalid payload",
    };
  }

  const { password, confirmPassword } = values;

  const supabase = await createClient();

  if (!password || !confirmPassword) {
    return {
      success: false,
      message: "Password and confirm password are required",
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      message: "Passwords do not match",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    console.error(error.message);
    return {
      success: false,
      message: "Password update failed",
    };
  }

  return {
    success: true,
    message: "Password updated successfully",
  };
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
