// Equipo del salón: la dueña invita por email a quienes usan la app y elige
// su rol. Cada invitada recibe un correo de Dexie Cloud y, al entrar con ese
// email, ve los mismos datos del salón.
import { useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { UserPlus, Trash2 } from 'lucide-react';
import { db } from '../../db/db';
import { buscarRealmSalon, invitarAlSalon, cambiarRol, NOMBRE_ROL, type RolSalon } from '../../db/salon';

export default function EquipoTab() {
  const realm = useLiveQuery(buscarRealmSalon);
  const miembros = useLiveQuery(
    () => (realm ? db.members.filter(m => m.realmId === realm.realmId).toArray() : []),
    [realm?.realmId]
  );
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<RolSalon>('empleada');
  const [mensaje, setMensaje] = useState('');

  if (!realm || !miembros) return <div>Cargando equipo…</div>;

  const invitar = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await invitarAlSalon(realm.realmId!, email, rol);
      setMensaje(`Invitación enviada a ${email.trim().toLowerCase()}`);
      setEmail('');
    } catch (err) {
      setMensaje((err as Error).message);
    }
  };

  const estadoDe = (m: (typeof miembros)[number]) =>
    m.accepted ? 'Activa' : m.rejected ? 'Rechazó la invitación' : 'Invitación pendiente';

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      <div>
        <h3 className="font-semibold text-lg">Equipo del salón</h3>
        <p className="text-sm text-gray-600">
          Quien invites entra con su correo y comparte los datos del salón. Las empleadas no ven Configuración ni Reportes.
        </p>
      </div>

      <form onSubmit={invitar} className="flex flex-col sm:flex-row gap-2">
        <input type="email" required placeholder="correo@ejemplo.com" value={email}
          onChange={e => setEmail(e.target.value)} className="flex-1 border rounded p-2" />
        <select value={rol} onChange={e => setRol(e.target.value as RolSalon)} className="border rounded p-2">
          <option value="empleada">{NOMBRE_ROL.empleada}</option>
          <option value="duena">{NOMBRE_ROL.duena}</option>
        </select>
        <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700">
          <UserPlus size={18} /> Invitar
        </button>
      </form>
      {mensaje && <p className="text-sm text-purple-700">{mensaje}</p>}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2">Correo</th><th>Rol</th><th>Estado</th><th />
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-2">{realm.owner}</td><td>{NOMBRE_ROL.duena}</td><td>Creó el salón</td><td />
          </tr>
          {miembros.filter(m => m.userId !== realm.owner).map(m => (
            <tr key={m.id} className="border-b">
              <td className="py-2">{m.email ?? m.userId}</td>
              <td>
                <select value={m.roles?.includes('duena') ? 'duena' : 'empleada'} className="border rounded p-1"
                  onChange={e => cambiarRol(m.id, e.target.value as RolSalon)}>
                  <option value="empleada">{NOMBRE_ROL.empleada}</option>
                  <option value="duena">{NOMBRE_ROL.duena}</option>
                </select>
              </td>
              <td>{estadoDe(m)}</td>
              <td className="text-right">
                <button title="Quitar del equipo" className="text-red-600 p-1 hover:bg-red-50 rounded"
                  onClick={() => confirm(`¿Quitar a ${m.email} del salón?`) && db.members.delete(m.id)}>
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
