import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWorkshopAppointments, getWorkshopClients, getWorkshopServices } from "@/app/actions/appointment";
import { CreateAppointmentModal } from "@/components/calendar/CreateAppointmentModal";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function WorkshopCalendar({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const activeTab = searchParams.tab || "upcoming";
  
  // Fetch data in parallel
  const [appointments, clients, services] = await Promise.all([
    getWorkshopAppointments(activeTab as 'upcoming' | 'past' | 'cancelled'),
    getWorkshopClients(),
    getWorkshopServices(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Calendario de Citas</h1>
        <CreateAppointmentModal clients={clients} services={services} />
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <a href="?tab=upcoming">
            <TabsTrigger value="upcoming" data-state={activeTab === 'upcoming' ? 'active' : 'inactive'}>Próximas</TabsTrigger>
          </a>
          <a href="?tab=past">
            <TabsTrigger value="past" data-state={activeTab === 'past' ? 'active' : 'inactive'}>Historial</TabsTrigger>
          </a>
          <a href="?tab=cancelled">
            <TabsTrigger value="cancelled" data-state={activeTab === 'cancelled' ? 'active' : 'inactive'}>Canceladas</TabsTrigger>
          </a>
        </TabsList>
        
        <div className="space-y-4 mt-4">
          {appointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay citas {activeTab === 'upcoming' ? 'próximas' : activeTab === 'past' ? 'pasadas' : 'canceladas'}.
            </div>
          ) : (
            appointments.map((apt) => (
              <Card key={apt.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex gap-6 items-center">
                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-muted rounded-lg">
                      <span className="text-sm font-bold uppercase text-muted-foreground">
                        {format(apt.date, "MMM", { locale: es })}
                      </span>
                      <span className="text-lg font-bold">
                        {format(apt.date, "d")}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg">{apt.service.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(apt.date, "h:mm a")}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {apt.user.fullName || apt.user.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {apt.vehicle.make} {apt.vehicle.model}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant={apt.status === "confirmed" ? "default" : apt.status === "cancelled" ? "destructive" : "secondary"}>
                      {apt.status === "confirmed" ? "Confirmada" : apt.status === "cancelled" ? "Cancelada" : "Pendiente"}
                    </Badge>
                    <Button variant="outline" size="sm">Detalles</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </Tabs>
    </div>
  );
}
