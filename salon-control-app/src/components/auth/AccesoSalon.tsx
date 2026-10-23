// Diálogo de inicio de sesión de Dexie Cloud en español (customLoginGui) y
// pantalla para cuentas que aún no pertenecen al salón.
import { useState, type FormEvent } from 'react';
import { useObservable } from 'dexie-react-hooks';
import type { DXCAlert } from 'dexie-cloud-addon';
import { db } from '../../db/db';
import { NOMBRE_REALM, aceptarInvitacion, crearRealmSalon } from '../../db/salon';

const MENSAJES: Record<string, string> = {
  INVALID_OTP: 'Código incorrecto. Revísalo e inténtalo de nuevo.',
  INVALID_EMAIL: 'Ese correo no es válido.',
  LICENSE_LIMIT_REACHED: 'Se alcanzó el límite de usuarios de la cuenta.',
  NO_SEATS_AVAILABLE: 'Se alcanzó el límite de usuarios de la cuenta.',
  USER_NOT_REGISTERED: 'Este correo no tiene acceso. Pide a la dueña que te invite.',
  USER_NOT_ACCEPTED: 'Este correo no tiene acceso. Pide a la dueña que te invite.',
  USER_DEACTIVATED: 'Esta cuenta está desactivada.',
  LOGOUT_CONFIRMATION: 'Hay cambios que aún no se subieron a la nube. Si cierras sesión ahora se perderán.'
};

const textoAlerta = (a: DXCAlert) =>
  a.messageCode === 'OTP_SENT'
    ? `Te enviamos un código de acceso a ${a.messageParams.email ?? 'tu correo'}.`
    : MENSAJES[a.messageCode] ?? a.message;

const TEXTOS: Record<string, { titulo: string; enviar: string }> = {
  email: { titulo: 'Iniciar sesión', enviar: 'Enviar código' },
  otp: { titulo: 'Escribe el código', enviar: 'Entrar' },
  'message-alert': { titulo: 'Aviso', enviar: 'Aceptar' },
  'logout-confirmation': { titulo: '¿Cerrar sesión?', enviar: 'Cerrar sesión' }
};

const COLOR_ALERTA = { error: 'bg-red-50 text-red-700', warning: 'bg-yellow-50 text-yellow-800', info: 'bg-purple-50 text-purple-800' };

const tarjeta = 'w-full max-w-sm bg-white rounded-lg shadow-2xl px-8 py-9 space-y-5';
const botonPrincipal = 'w-full bg-marca-negro text-white py-3.5 rounded-md text-[11px] uppercase tracking-[0.24em] hover:bg-gray-800 transition-colors disabled:opacity-60';
const botonSecundario = 'w-full text-gray-600 py-3 rounded-md text-sm hover:bg-gray-100 transition-colors';

/** Monograma y nombre arriba de cada tarjeta de acceso */
const Marca = () => (
  <div className="text-center">
    <img src="./marca/CB_monograma_dorado.svg" alt="" className="mx-auto h-12 w-auto" />
    <p className="mt-4 font-display text-3xl leading-none text-marca-negro">CB <em className="text-marca-dorado-prof">Control</em></p>
    <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-gray-500">Cristina Borquez Beauty Salon</p>
    <div className="mx-auto mt-5 h-px w-10 bg-marca-dorado" />
  </div>
);

/** Se muestra cuando Dexie Cloud pide algo al usuario (email, código, avisos) */
export function LoginSalon() {
  const ui = useObservable(db.cloud.userInteraction);
  const [valores, setValores] = useState<Record<string, string>>({});
  if (!ui) return null;

  const textos = TEXTOS[ui.type] ?? { titulo: ui.title, enviar: ui.submitLabel };
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    ui.onSubmit(valores);
    setValores({});
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-marca-negro/95 p-4 backdrop-blur-sm">
      <form onSubmit={enviar} className={tarjeta}>
        <Marca />
        <h2 className="text-center text-2xl text-gray-900">{textos.titulo}</h2>
        {ui.type === 'email' && (
          <p className="text-center text-sm text-gray-500">Escribe tu correo y te enviaremos un código para entrar.</p>
        )}
        {ui.alerts.map((a, i) => (
          <p key={i} className={`text-sm rounded-lg p-3 ${COLOR_ALERTA[a.type]}`}>{textoAlerta(a)}</p>
        ))}
        {'options' in ui && ui.options?.map(op => (
          <button key={op.value} type="button" className={botonSecundario + ' border'}
            onClick={() => ui.onSubmit({ [op.name]: op.value })}>
            Entrar con {op.displayName}
          </button>
        ))}
        {Object.entries(ui.fields).map(([nombre, campo]: [string, any]) => (
          <label key={nombre} className="block">
            <span className="block text-[10px] uppercase tracking-[0.24em] text-gray-500 mb-1">
              {nombre === 'email' ? 'Correo electrónico' : nombre === 'otp' ? 'Código' : campo.label}
            </span>
            <input
              autoFocus
              required
              className="w-full border-0 border-b border-gray-300 bg-transparent px-0 py-2.5 text-base focus:border-marca-dorado focus:ring-0 outline-none transition-colors"
              type={nombre === 'email' ? 'email' : campo.type === 'password' ? 'password' : 'text'}
              inputMode={nombre === 'otp' ? 'numeric' : undefined}
              autoComplete={nombre === 'email' ? 'email' : nombre === 'otp' ? 'one-time-code' : undefined}
              placeholder={nombre === 'email' ? 'tu@correo.com' : campo.placeholder}
              value={valores[nombre] ?? ''}
              onChange={e => setValores({ ...valores, [nombre]: e.target.value })}
            />
          </label>
        ))}
        <button type="submit" className={botonPrincipal}>{textos.enviar}</button>
        {/* Sin cancelar en el email: la app exige sesión (requireAuth) */}
        {ui.cancelLabel && ui.type !== 'email' && (
          <button type="button" className={botonSecundario} onClick={ui.onCancel}>Cancelar</button>
        )}
      </form>
    </div>
  );
}

/** Cuenta con sesión pero sin salón: aceptar invitación o crear uno */
export function PantallaSinSalon({ estado, reintentar }: { estado: 'sin-salon' | 'invitada'; reintentar: () => void }) {
  const usuario = useObservable(db.cloud.currentUser);
  const [trabajando, setTrabajando] = useState(false);

  const hacer = (accion: () => Promise<unknown>) => async () => {
    setTrabajando(true);
    try {
      await accion();
      await db.cloud.sync({ wait: true, purpose: 'pull' });
      reintentar();
    } catch (e) {
      alert('No se pudo completar: ' + (e as Error).message);
      setTrabajando(false);
    }
  };
  const unirme = hacer(aceptarInvitacion);
  const crear = hacer(crearRealmSalon);

  return (
    <div className="min-h-screen flex items-center justify-center bg-marca-negro p-4">
      <div className={tarjeta}>
        <Marca />
        {estado === 'invitada' ? (
          <>
            <p className="text-gray-700">Te invitaron a unirte al equipo del <b>{NOMBRE_REALM}</b>.</p>
            <button disabled={trabajando} onClick={unirme} className={botonPrincipal}>
              {trabajando ? 'Uniéndote…' : 'Unirme al salón'}
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-700">
              La cuenta <b>{usuario?.email}</b> todavía no pertenece a ningún salón.
              Si trabajas en el salón, pide a la dueña que te invite desde Configuración → Equipo con este correo.
            </p>
            <button disabled={trabajando} onClick={reintentar} className={botonPrincipal}>Ya me invitaron, revisar</button>
            <button disabled={trabajando} onClick={crear} className={botonSecundario + ' border'}>
              Soy la dueña: crear salón nuevo
            </button>
          </>
        )}
        <button onClick={() => db.cloud.logout().then(() => location.reload())} className={botonSecundario}>
          Salir ({usuario?.email})
        </button>
      </div>
    </div>
  );
}
