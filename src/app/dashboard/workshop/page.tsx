import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Users, Calendar, Star } from "lucide-react";
import { db } from "@/db";
import { appointments, users, workshops } from "@/db/schema";
import { stackServerApp } from "@/stack";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { startOfDay, endOfDay, subDays, format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { redirect } from "next/navigation";

export default async function WorkshopDashboard() {
  const user = await stackServerApp.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, user.id),
    with: {
      workshops: true,
    },
  });

  if (!dbUser || !dbUser.workshops || dbUser.workshops.length === 0) {
    return <div>No tienes un taller registrado.</div>;
  }

  const workshop = dbUser.workshops[0];

  // Fetch all appointments for this workshop
  const allAppointments = await db.query.appointments.findMany({
    where: eq(appointments.workshopId, workshop.id),
    with: {
      service: true,
      user: true,
      vehicle: true,
    },
    orderBy: [desc(appointments.date)],
  });

  // Calculate Stats
  const completedAppointments = allAppointments.filter(a => a.status === 'completed');
  const totalRevenue = completedAppointments.reduce((acc, curr) => acc + Number(curr.service.price), 0);

  const today = new Date();
  const appointmentsToday = allAppointments.filter(a => 
    isSameDay(new Date(a.date), today)
  );
  const pendingToday = appointmentsToday.filter(a => a.status === 'pending').length;

  const uniqueClients = new Set(allAppointments.map(a => a.userId)).size;

  // Calculate Chart Data (Last 7 days)
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i);
    const dayName = format(date, 'EEE', { locale: es });
    
    const dayRevenue = completedAppointments
      .filter(a => isSameDay(new Date(a.date), date))
      .reduce((acc, curr) => acc + Number(curr.service.price), 0);

    chartData.push({
      name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
      total: dayRevenue
    });
  }

  // Recent Activity (Limit to 5)
  const recentActivity = allAppointments.slice(0, 5);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Panel de Control: {workshop.name}</h1>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Bs. {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Histórico total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentsToday.length}</div>
            <p className="text-xs text-muted-foreground">{pendingToday} pendientes de confirmar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueClients}</div>
            <p className="text-xs text-muted-foreground">Total clientes únicos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(workshop.rating).toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Basado en {workshop.reviewCount} reseñas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Ingresos Semanales</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueChart data={chartData} />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No hay actividad reciente
                    </TableCell>
                  </TableRow>
                ) : (
                  recentActivity.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="font-medium">{appointment.user.fullName || "Usuario"}</div>
                        <div className="text-xs text-muted-foreground">
                          {appointment.vehicle.make} {appointment.vehicle.model}
                        </div>
                      </TableCell>
                      <TableCell>{appointment.service.name}</TableCell>
                      <TableCell className="text-right">Bs. {appointment.service.price}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
