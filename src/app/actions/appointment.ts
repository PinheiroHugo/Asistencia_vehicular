'use server';

import { db } from "@/db";
import { appointments, users, vehicles, services, workshops } from "@/db/schema";
import { stackServerApp } from "@/stack";
import { eq, and, desc, gte, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getWorkshopAppointments(status: 'upcoming' | 'past' | 'cancelled' = 'upcoming') {
  const user = await stackServerApp.getUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.stackId, user.id),
  });

  if (!dbUser) throw new Error("User not found");

  const workshop = await db.query.workshops.findFirst({
    where: eq(workshops.ownerId, dbUser.id),
  });

  if (!workshop) throw new Error("Workshop not found");

  const now = new Date();

  let whereCondition;
  if (status === 'upcoming') {
    whereCondition = and(
      eq(appointments.workshopId, workshop.id),
      gte(appointments.date, now),
      // We might want to include pending and confirmed here, exclude cancelled
      // Assuming 'cancelled' status exists in enum
    );
  } else if (status === 'past') {
    whereCondition = and(
      eq(appointments.workshopId, workshop.id),
      lt(appointments.date, now)
    );
  } else if (status === 'cancelled') {
    whereCondition = and(
      eq(appointments.workshopId, workshop.id),
      eq(appointments.status, 'cancelled')
    );
  }

  const data = await db.query.appointments.findMany({
    where: whereCondition,
    with: {
      user: true,
      vehicle: true,
      service: true,
    },
    orderBy: [desc(appointments.date)],
  });

  // Filter out cancelled from upcoming/past if not explicitly asked for
  if (status !== 'cancelled') {
    return data.filter(a => a.status !== 'cancelled');
  }

  return data;
}

const createAppointmentSchema = z.object({
  userId: z.number().optional(), // Optional if we are creating a "guest" or using existing
  clientName: z.string().optional(), // For manual entry if user doesn't exist (not in schema yet, but useful for UI logic)
  vehicleId: z.number(),
  serviceId: z.number(),
  date: z.date(),
  notes: z.string().optional(),
});

export async function createManualAppointment(data: z.infer<typeof createAppointmentSchema>) {
  const user = await stackServerApp.getUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.stackId, user.id),
  });
  if (!dbUser) throw new Error("User not found");

  const workshop = await db.query.workshops.findFirst({
    where: eq(workshops.ownerId, dbUser.id),
  });
  if (!workshop) throw new Error("Workshop not found");

  // Validate data
  // For MVP, we assume the UI passes a valid vehicleId belonging to a user
  // If userId is missing, we might need to infer it from the vehicle or require it.
  // The schema requires userId.
  
  const vehicle = await db.query.vehicles.findFirst({
    where: eq(vehicles.id, data.vehicleId),
  });
  
  if (!vehicle) throw new Error("Vehicle not found");

  await db.insert(appointments).values({
    userId: vehicle.userId, // Use the vehicle's owner
    workshopId: workshop.id,
    vehicleId: data.vehicleId,
    serviceId: data.serviceId,
    date: data.date,
    status: "confirmed", // Manual appointments are usually confirmed immediately
    notes: data.notes,
  });

  revalidatePath("/dashboard/workshop/calendar");
}

export async function getWorkshopClients() {
    const user = await stackServerApp.getUser();
    if (!user) throw new Error("Unauthorized");
  
    const dbUser = await db.query.users.findFirst({
      where: eq(users.stackId, user.id),
    });
  
    if (!dbUser) throw new Error("User not found");
  
    const workshop = await db.query.workshops.findFirst({
      where: eq(workshops.ownerId, dbUser.id),
    });
  
    if (!workshop) throw new Error("Workshop not found");

    // Get users who have had appointments or requests with this workshop
    // For simplicity now, just return all users (or maybe just those with vehicles?)
    // Better: Return users who have vehicles so we can select them.
    // Real implementation should probably be more specific.
    
    const allUsers = await db.query.users.findMany({
        where: eq(users.role, 'driver'),
        with: {
            vehicles: true
        }
    });
    
    return allUsers;
}

export async function getWorkshopServices() {
    const user = await stackServerApp.getUser();
    if (!user) throw new Error("Unauthorized");
  
    const dbUser = await db.query.users.findFirst({
      where: eq(users.stackId, user.id),
    });
  
    if (!dbUser) throw new Error("User not found");
  
    const workshop = await db.query.workshops.findFirst({
      where: eq(workshops.ownerId, dbUser.id),
    });
  
    if (!workshop) throw new Error("Workshop not found");

    return await db.query.services.findMany({
        where: eq(services.workshopId, workshop.id)
    });
}
