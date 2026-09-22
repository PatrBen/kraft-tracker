import { useObservable } from 'dexie-react-hooks';
import type { DXCAlert, DXCInputField, DXCUserInteraction } from 'dexie-cloud-addon';
import { useId, useState, type FormEvent, type KeyboardEvent } from 'react';
import { db } from '../../db/db';

interface DialogText {
  title?: string;
  intro?: string;
  submit?: string;
  labels?: Record<string, string>;
}

// Dexie Cloud liefert englische Texte – hier die deutschen Fassungen je Dialogtyp.
const TEXTS: Partial<Record<DXCUserInteraction['type'], DialogText>> = {
  email: {
    title: 'Anmelden',
    intro:
      'Mit deiner E-Mail-Adresse meldest du dich auf Handy und PC an. Du bekommst einen Code per E-Mail – ein Passwort gibt es nicht.',
    submit: 'Code senden',
    labels: { email: 'E-Mail-Adresse' },
  },
  otp: {
    title: 'Code eingeben',
    submit: 'Anmelden',
    labels: { otp: 'Code aus der E-Mail' },
  },
  'logout-confirmation': {
    title: 'Abmelden?',
    intro:
      'Es gibt Änderungen, die noch nicht synchronisiert sind. Beim Abmelden gehen sie auf diesem Gerät verloren.',
    submit: 'Trotzdem abmelden',
  },
  'message-alert': { submit: 'OK' },
};

const ALERT_TEXTS: Partial<Record<DXCAlert['messageCode'], (params: Record<string, string>) => string>> = {
  OTP_SENT: (p) => `Code wurde an ${p.email ?? 'deine E-Mail-Adresse'} gesendet.`,
  INVALID_OTP: () => 'Der Code ist falsch oder abgelaufen.',
  INVALID_EMAIL: () => 'Bitte eine gültige E-Mail-Adresse eingeben.',
  LICENSE_LIMIT_REACHED: () => 'Das Nutzerlimit der Datenbank ist erreicht.',
  NO_SEATS_AVAILABLE: () => 'Das Nutzerlimit der Datenbank ist erreicht.',
  USER_NOT_REGISTERED: () => 'Diese E-Mail-Adresse ist für die Datenbank nicht freigeschaltet.',
  USER_NOT_ACCEPTED: () => 'Diese E-Mail-Adresse ist für die Datenbank nicht freigeschaltet.',
  USER_DEACTIVATED: () => 'Dieses Konto ist deaktiviert.',
  LOGOUT_CONFIRMATION: () => 'Nicht synchronisierte Änderungen gehen verloren.',
};

function alertText(alert: DXCAlert): string {
  const german = ALERT_TEXTS[alert.messageCode];
  if (german) return german(alert.messageParams);
  return alert.message.replace(/\{(\w+)\}/g, (_, key: string) => alert.messageParams[key] ?? '');
}

/** Zeigt die Login-Schritte von Dexie Cloud (E-Mail → Code) als Dialog im App-Design. */
export function CloudLoginDialog() {
  const interaction = useObservable(db.cloud.userInteraction);
  if (!interaction) return null;
  // Neuer Schlüssel je Schritt, damit Eingaben des vorigen Schritts nicht stehen bleiben.
  return <InteractionDialog key={`${interaction.type}:${interaction.title}`} ui={interaction} />;
}

function InteractionDialog({ ui }: { ui: DXCUserInteraction }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const titleId = useId();
  const text = TEXTS[ui.type] ?? {};
  const fields = Object.entries(ui.fields as Record<string, DXCInputField>);
  const canCancel = Boolean(ui.cancelLabel);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    ui.onSubmit(values);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && canCancel) ui.onCancel();
  };

  return (
    <div className="dialog-backdrop">
      <form
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className="dialog__title">
          {text.title ?? ui.title}
        </h2>
        {text.intro && <p className="muted">{text.intro}</p>}

        {ui.alerts.map((alert, i) => (
          <p key={i} className={`dialog__alert dialog__alert--${alert.type}`} role="alert">
            {alertText(alert)}
          </p>
        ))}

        {fields.map(([name, field], i) => (
          <div className="field" key={name}>
            <label htmlFor={`${titleId}-${name}`}>{text.labels?.[name] ?? field.label ?? name}</label>
            <input
              id={`${titleId}-${name}`}
              className={`input${name === 'otp' ? ' input--number' : ''}`}
              type={name === 'email' ? 'email' : field.type === 'password' ? 'password' : 'text'}
              inputMode={name === 'otp' ? 'numeric' : undefined}
              autoComplete={name === 'email' ? 'email' : name === 'otp' ? 'one-time-code' : 'off'}
              autoFocus={i === 0}
              placeholder={name === 'email' ? 'name@beispiel.de' : undefined}
              value={values[name] ?? ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [name]: e.target.value }))}
            />
          </div>
        ))}

        <div className="form-actions">
          <button type="submit" className="btn btn--primary">
            {text.submit ?? ui.submitLabel}
          </button>
          {canCancel && (
            <button type="button" className="btn btn--ghost" onClick={ui.onCancel}>
              Abbrechen
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
