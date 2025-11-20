'use client';

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { createManualAppointment } from "@/app/actions/appointment";
import { toast } from "sonner";

interface Client {
  id: number;
  fullName: string | null;
  email: string;
  vehicles: {
    id: number;
    make: string;
    model: string;
    plate: string;
  }[];
}

interface Service {
  id: number;
  name: string;
  price: string;
  durationMinutes: number | null;
}

interface CreateAppointmentModalProps {
  clients: Client[];
  services: Service[];
}

export function CreateAppointmentModal({ clients, services }: CreateAppointmentModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>("09:00");
  const [notes, setNotes] = useState<string>("");

  const selectedClient = clients.find(c => c.id.toString() === selectedClientId);
  const clientVehicles = selectedClient?.vehicles || [];

  const handleSubmit = async () => {
    if (!selectedClientId || !selectedVehicleId || !selectedServiceId || !date || !time) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    const [hours, minutes] = time.split(":").map(Number);
    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours, minutes);

    startTransition(async () => {
      try {
        await createManualAppointment({
          vehicleId: parseInt(selectedVehicleId),
          serviceId: parseInt(selectedServiceId),
          date: appointmentDate,
          notes: notes,
        });
        toast.success("Cita creada exitosamente");
        setOpen(false);
        // Reset form
        setSelectedClientId("");
        setSelectedVehicleId("");
        setSelectedServiceId("");
        setDate(undefined);
        setTime("09:00");
        setNotes("");
      } catch (error) {
        console.error(error);
        toast.error("Error al crear la cita");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Cita Manual
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Cita</DialogTitle>
          <DialogDescription>
            Agendar una cita manualmente para un cliente existente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="client">Cliente</Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.fullName || client.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="vehicle">Vehículo</Label>
            <Select 
              value={selectedVehicleId} 
              onValueChange={setSelectedVehicleId}
              disabled={!selectedClientId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar vehículo" />
              </SelectTrigger>
              <SelectContent>
                {clientVehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                    {vehicle.make} {vehicle.model} - {vehicle.plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="service">Servicio</Label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar servicio" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name} ({service.durationMinutes} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles adicionales..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Guardando..." : "Agendar Cita"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
