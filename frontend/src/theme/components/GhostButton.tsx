import { Button } from "./PrimaryButton";

export function GhostButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Button label={label} onPress={onPress} disabled={disabled} variant="secondary" />;
}
