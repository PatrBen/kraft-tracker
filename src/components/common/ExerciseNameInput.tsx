import { useId } from 'react';
import { useExercises } from '../../hooks/useExercises';

interface ExerciseNameInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}

/** Freitext-Eingabe mit Vorschlägen aus der Übungsbibliothek. */
export function ExerciseNameInput({ id, value, onChange }: ExerciseNameInputProps) {
  const exercises = useExercises();
  const listId = useId();

  return (
    <>
      <input
        id={id}
        className="input"
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="z. B. Bankdrücken"
        autoComplete="off"
        enterKeyHint="done"
      />
      <datalist id={listId}>
        {exercises?.map((e) => <option key={e.id} value={e.name} />)}
      </datalist>
    </>
  );
}
