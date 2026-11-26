import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const registerCustomerSchema = z
  .object({
    name: z.string().min(2, "Full name is required."),
    email: z.string().email("Enter a valid email address."),
    phone: z.string().min(10, "Enter a valid 10-digit Indian mobile number."),
    city: z.string().min(2, "Select your city."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const designerRegistrationSchema = z.object({
  name: z.string().min(2, "Full name is required."),
  email: z.string().email("Valid studio email required."),
  phone: z.string().min(10, "Valid mobile number required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  city: z.string().min(2, "Primary city is required."),
  title: z.string().min(4, "Professional title is required (e.g., Bridal Stylist)."),
  experienceYears: z.coerce.number().min(0).max(50),
  startingPriceInr: z.coerce.number().min(499, "Minimum price is ₹499."),
  categoryIds: z.array(z.string()).min(1, "Select at least one category."),
  skills: z.string().min(3, "Add at least one core skill."),
  bio: z.string().min(30, "Please share at least 30 characters about your craft."),
  documentType: z.enum([
    "Aadhaar / Govt ID",
    "Design Studio Registration",
    "Portfolio Credential",
  ]),
  documentRefMasked: z.string().min(4, "Provide masked document ID reference."),
});

export const bookingRequirementsSchema = z.object({
  occasionDate: z.string().min(4, "Select your occasion date."),
  preferredStyle: z.string().min(2, "Share a preferred style direction."),
  budgetInr: z.coerce.number().min(500, "Enter an estimated wardrobe or project budget."),
  peopleCount: z.coerce.number().min(1).max(50),
  additionalRequirements: z
    .string()
    .min(10, "Briefly describe what you need help styling or designing."),
  notes: z.string().optional(),
});

export const serviceFormSchema = z.object({
  title: z.string().min(4, "Service title is required."),
  categoryId: z.string().min(1, "Category is required."),
  subcategoryName: z.string().min(2, "Subcategory is required."),
  description: z.string().min(20, "Provide a clear service description."),
  priceInr: z.coerce.number().min(499, "Minimum price is ₹499."),
  durationMinutes: z.coerce.number().min(30).max(480),
  travelChargeInr: z.coerce.number().min(0).max(15000),
});

export const portfolioFormSchema = z.object({
  title: z.string().min(4, "Project title is required."),
  categoryName: z.string().min(2, "Category is required."),
  occasion: z.string().min(2, "Occasion is required."),
  city: z.string().min(2, "City is required."),
  description: z.string().min(20, "Add a concise project story."),
  coverImageUrl: z.string().min(1, "Select a cover image."),
});

export const categoryFormSchema = z.object({
  name: z.string().min(2, "Category name is required."),
  groupName: z.string().min(2, "Group name is required."),
  description: z.string().min(10, "Category description is required."),
  commissionRate: z.coerce.number().min(1).max(40),
  imageUrl: z.string().min(1, "Cover image path is required."),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(10, "Please share at least 10 characters of feedback."),
});

export const addressSchema = z.object({
  label: z.enum(["Home", "Event Venue", "Office", "Other"]),
  line1: z.string().min(5, "Street/building address is required."),
  landmark: z.string().optional(),
  city: z.string().min(2, "City is required."),
  state: z.string().min(2, "State is required."),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code."),
});
