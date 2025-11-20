"use client";

export function WorkshopDescriptionInput() {
  return (
    <div className="pt-4 border-t" onClick={(e) => e.stopPropagation()}>
      <label htmlFor="description" className="block text-sm font-medium mb-2">
        ¿Qué servicios ofreces?
      </label>
      <textarea
        id="description"
        name="description"
        placeholder="Ej: Hago cambio de aceite, arreglo frenos y tengo servicio de gomería..."
        className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        required
      />
      <p className="text-xs text-muted-foreground mt-1">
        La IA clasificará tu taller automáticamente basado en esto.
      </p>
    </div>
  );
}
