import { useEffect, useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Calendar, MessageCircle, Search, Phone, Mail, X, User } from 'lucide-react';

interface Cliente {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  cumple: string;
  comentarios: string;
  posibleBaja: boolean;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isModalOpen, set