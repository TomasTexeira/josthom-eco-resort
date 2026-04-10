"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const schema = z.object({
  name:    z.string().min(2, "Ingresá tu nombre"),
  email:   z.string().email("Email inválido"),
  phone:   z.string().optional(),
  message: z.string().min(10, "El mensaje es muy corto"),
});

type FormData = z.infer<typeof schema>;

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    // Redirect a WhatsApp con el mensaje armado (igual que el original)
    const text = encodeURIComponent(
      `Hola! Soy ${data.name}.\n\nMensaje: ${data.message}\n\nEmail: ${data.email}${data.phone ? `\nTeléfono: ${data.phone}` : ""}`
    );
    window.open(`https://wa.me/5491138323695?text=${text}`, "_blank");
    setSent(true);
    toast.success("Redirigiendo a WhatsApp...");
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <CheckCircle size={48} className="text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">¡Mensaje listo!</h3>
        <p className="text-gray-500 text-sm">Te abrimos WhatsApp con tu consulta. Si no se abrió solo, escribinos directo.</p>
        <button onClick={() => setSent(false)} className="text-green-700 text-sm hover:underline">Enviar otro mensaje</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-xl font-semibold text-gray-900">Envianos un mensaje</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
        <input {...register("name")} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" placeholder="Tu nombre" />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
        <input {...register("email")} type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" placeholder="tu@email.com" />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
        <input {...register("phone")} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" placeholder="+54 9 11 ..." />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje *</label>
        <textarea {...register("message")} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none" placeholder="¿En qué te podemos ayudar?" />
        {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary gap-2 w-full">
        <Send size={16} />
        {isSubmitting ? "Enviando..." : "Enviar por WhatsApp"}
      </button>
      <p className="text-xs text-gray-400 text-center">Se abrirá WhatsApp con tu mensaje pre-cargado.</p>
    </form>
  );
}
