export interface MongoDBObjectId {
  $oid: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  status?: 'scheduled' | 'cancelled' | 'free' | 'canceled';
  _id?: string | MongoDBObjectId;
  studentId?: string | MongoDBObjectId;
}

export interface Class {
  id: string;
  _id?: string | MongoDBObjectId; // Agregar soporte para _id de MongoDB
  date: string | Date;
  hour: number;
  status: 'scheduled' | 'cancelled' | 'available' | 'pending' | 'booked';
  studentId?: string | MongoDBObjectId;
  instructorId?: string | MongoDBObjectId;
  slots?: TimeSlot[];
  start?: string;
  end?: string;
  day?: number;
  classType?: 'driving lesson' | 'driving test' | 'ticket class' | string; // Nuevos tipos específicos
  amount?: number;
  paid?: boolean;
  pickupLocation?: string;
  dropoffLocation?: string;
  ticketClassId?: string | MongoDBObjectId;
  studentName?: string; // Agregar nombre del estudiante
  paymentMethod?: string; // Agregar método de pago
  reservedAt?: Date; // Agregar fecha de reserva
} 