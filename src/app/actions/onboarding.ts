"use server";

import { db } from "@/db";
import { users, workshops } from "@/db/schema";
import { stackServerApp } from "@/stack";
import { redirect } from "next/navigation";
import { classifyWorkshop } from "@/lib/ai-classification";

export async function completeOnboarding(formData: FormData) {
  const user = await stackServerApp.getUser();
  if (!user) throw new Error("No autorizado");

  const role = formData.get("role") as "driver" | "workshop_owner";
  
  const description = formData.get("description") as string;

  if (!role) throw new Error("Rol no seleccionado");

  // Sync user to DB
  const [newUser] = await db.insert(users).values({
    clerkId: user.id,
    email: user.primaryEmail!,
    fullName: user.displayName || "",
    role: role,
    avatarUrl: user.profileImageUrl,
  }).onConflictDoUpdate({
    target: users.clerkId,
    set: { role: role },
  }).returning();

  if (role === "workshop_owner") {
    // AI Classification
    let tags: string[] = [];
    let finalDescription = description || "Taller mecánico";

    if (description) {
      const classification = await classifyWorkshop(description);
      tags = classification.tags;
      finalDescription = classification.improvedDescription;
    }

    // Create Workshop Entry
    await db.insert(workshops).values({
      ownerId: newUser.id,
      name: `${user.displayName || "Taller"}'s Workshop`, // Default name, user can change later
      address: "Dirección pendiente", // Placeholder
      latitude: "0",
      longitude: "0",
      description: finalDescription,
      tags: tags,
    });

    redirect("/dashboard/workshop");
  } else {
    redirect("/dashboard/driver");
  }
}
