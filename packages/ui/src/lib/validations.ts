import * as z from "zod";

export const createProfileSchema = z
  .object({
    name: z
      .string()
      .min(3, {
        message: "Name is required and must be at least 3 characters long.",
      })
      .max(128, {
        message: "Name must be less than 32 characters.",
      }),
    username: z
      .string()
      .min(3, {
        message: "Username is required and must be at least 3 characters long.",
      })
      .max(32, {
        message: "Username must be less than 32 characters.",
      })
      .regex(/^[a-zA-Z0-9_]+$/, {
        message: "Username can only contain letters, numbers, and underscores.",
      }),
    isPublic: z.boolean(),
  })
  .strict();

export type CreateProfileData = z.infer<typeof createProfileSchema>;

export const forgotPasswordFormSchema = z.object({
  email: z
    .email({
      message: "Please enter a valid email address",
    })
    .min(3, {
      message: "Email is required",
    })
    .max(64, {
      message: "Email must be at most 64 characters long",
    }),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordFormSchema>;

export const resetPasswordFormSchema = z
  .object({
    password: z
      .string()
      .min(8, {
        message: "Password must be at least 8 characters long",
      })
      .max(64, {
        message: "Password must be at most 64 characters long",
      }),
    confirmPassword: z
      .string()
      .min(8, {
        message: "Confirm password must be at least 8 characters long",
      })
      .max(64, {
        message: "Confirm password must be at most 64 characters long",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;

export const signInFormSchema = z.object({
  email: z
    .email({
      message: "Please enter a valid email address",
    })
    .min(3, {
      message: "Email is required",
    })
    .max(64, {
      message: "Email must be at most 64 characters long",
    }),
  password: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters long",
    })
    .max(64, {
      message: "Password must be at most 64 characters long",
    }),
});

export type SignInFormData = z.infer<typeof signInFormSchema>;

export const signUpFormSchema = z.object({
  email: z
    .email({
      message: "Please enter a valid email address",
    })
    .min(3, {
      message: "Email is required",
    })
    .max(64, {
      message: "Email must be at most 64 characters long",
    }),
  password: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters long",
    })
    .max(64, {
      message: "Password must be at most 64 characters long",
    }),
  name: z
    .string()
    .min(3, {
      message: "Name is required and must be at least 3 characters long.",
    })
    .max(128, {
      message: "Name must be less than 32 characters.",
    }),
  username: z
    .string()
    .min(3, {
      message: "Username is required and must be at least 3 characters long.",
    })
    .max(32, {
      message: "Username must be less than 32 characters.",
    })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores.",
    }),
  isPublic: z.boolean(),
});

export type SignUpFormData = z.infer<typeof signUpFormSchema>;

export const feedbackSchema = z.object({
  subject: z
    .string()
    .min(3, {
      message: "Subject is required and must be at least 3 characters long",
    })
    .max(64, {
      message: "Subject must be at most 64 characters long",
    }),
  content: z
    .string()
    .min(20, {
      message: "Content is required and must be at least 20 characters long",
    })
    .max(512, {
      message: "Content must be at most 512 characters long",
    }),
});

export type FeedbackFormData = z.infer<typeof feedbackSchema>;

export const renameSchema = z
  .string()
  .min(3, {
    message: "Filename is required and must be at least 3 characters long.",
  })
  .max(64, {
    message: "Filename must be less than 64 characters.",
  })
  .regex(/^[a-zA-Z0-9_-\s.:]+$/, {
    message:
      "Filename can only contain letters, numbers, underscores, hyphens, whitespaces, periods and colons.",
  });

export type Title = z.infer<typeof renameSchema>;
