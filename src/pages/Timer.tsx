import { Timer } from "lucide-react";

export default function TimerPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Timer className="h-12 w-12 text-border mb-4" />
      <h2 className="text-h2 text-foreground">Timer</h2>
      <p className="text-small text-foreground-secondary mt-2">
        Coming soon — this section is being built.
      </p>
    </div>
  );
}
