import { Database } from "@/types/supabase-types";
import { Row } from "@/hooks/database";

export type UserProfileRow = Row<"v_user_profiles_extended">;

// Define a type for the user data row directly from the auto-generated Supabase types.
// This ensures type safety and that the type is always in sync with the database view.
export type UserProfileData = Database["public"]["Views"]["v_user_profiles_extended"]["Row"];