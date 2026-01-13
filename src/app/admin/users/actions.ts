"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserRole(formData: FormData) {
  const userId = formData.get("userId") as string;
  const role = formData.get("role") as string;
  
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    console.error("Error updating role:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
}

export async function giveTestToUser(formData: FormData) {
  const userId = formData.get("userId") as string;
  const testId = formData.get("testId") as string;

  const supabase = await createClient();

  const { error } = await supabase
    .from("purchases")
    .insert({
      user_id: userId,
      test_id: testId,
      status: "completed",
      amount: 0,
      transaction_id: "ADMIN_GIFT_" + Math.random().toString(36).substring(7).toUpperCase()
    });

  if (error) {
    console.error("Error giving test:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
}
