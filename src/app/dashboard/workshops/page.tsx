import { WorkshopCard } from "@/components/workshops/WorkshopCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getWorkshops } from "@/app/actions/workshop";

export default async function WorkshopsPage({ searchParams }: { searchParams: { filter?: string } }) {
  const filter = searchParams.filter || "all";
  const workshops = await getWorkshops(filter);

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Talleres y Servicios</h1>
          <p className="text-muted-foreground">Encuentra los mejores talleres mecánicos cerca de ti.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar taller..." 
              className="pl-8" 
              // Note: Client-side search would require a client component wrapper or URL state
            />
          </div>
          {/* Filter implementation would need client component or Link updates */}
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {workshops.map((workshop) => (
          <WorkshopCard 
            key={workshop.id} 
            id={workshop.id.toString()}
            name={workshop.name}
            image={workshop.imageUrl || "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1000&auto=format&fit=crop"}
            rating={Number(workshop.rating)}
            reviews={workshop.reviewCount || 0}
            address={workshop.address}
            isOpen={true} // Logic for open/close can be added
            services={workshop.services.map(s => s.name)}
          />
        ))}
      </div>
    </div>
  );
}
