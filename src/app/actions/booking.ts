'use server';

import { db } from "@/db";
import { appointments, users, workshops, vehicles, services } from "@/db/schema";
import { stackServerApp } from "@/stack";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createAppointment(data: {
  workshopId: number;
  serviceId: number;
  date: Date;
  time: string;
}) {
  const user = await stackServerApp.getUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.stackId, user.id),
    with: {
      vehicles: true
    }
  });

  if (!dbUser) throw new Error("User not found");

  // Use first vehicle as default for now
  const vehicleId = dbUser.vehicles.length > 0 ? dbUser.vehicles[0].id : null;
  if (!vehicleId) throw new Error("No vehicle found");

  // Combine date and time
  const [hours, minutes] = data.time.split(':').map(Number);
  const appointmentDate = new Date(data.date);
  appointmentDate.setHours(hours, minutes, 0, 0);

  await db.insert(appointments).values({
    userId: dbUser.id,
    workshopId: data.workshopId,
    vehicleId: vehicleId,
    serviceId: data.serviceId,
    date: appointmentDate,
    status: "pending",
  });

  revalidatePath("/dashboard/driver/history");
  revalidatePath("/dashboard/workshops");
}
