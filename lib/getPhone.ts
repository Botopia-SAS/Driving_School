import { connectDB } from "./mongodb";
import Phone from "@/models/Phone";

// Cache del número de teléfono
let cachedPhone: {
  phoneNumber: string;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene el número de teléfono principal desde la base de datos
 * Usa caché para mejorar el rendimiento
 */
export async function getMainPhone() {
  try {
    // Verificar si hay caché válido
    if (
      cachedPhone &&
      Date.now() - cachedPhone.timestamp < CACHE_DURATION
    ) {
      return cachedPhone;
    }

    await connectDB();

    // Buscar el número principal
    let phone = await Phone.findOne({ key: "main" });

    // Si no existe, crear uno por defecto
    if (!phone) {
      phone = await Phone.create({
        key: "main",
        phoneNumber: "(561) 969-0150",
      });
    }

    // Actualizar caché
    cachedPhone = {
      phoneNumber: phone.phoneNumber,
      timestamp: Date.now(),
    };

    return cachedPhone;
  } catch (error) {
    console.error("Error fetching main phone:", error);
    // Retornar número por defecto en caso de error
    return {
      phoneNumber: "(561) 969-0150",
      timestamp: Date.now(),
    };
  }
}

/**
 * Invalida el caché del número de teléfono
 * Llamar esta función después de actualizar el número
 */
export function invalidatePhoneCache() {
  cachedPhone = null;
}
