import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityTypeSelector } from "./ActivityTypeSelector";
import { UI_COPY } from "./ActivityConstants";

interface TimerControlsProps {
  onSwitch: () => void;
  onPause: (pauseType: string) => void;
  onFinish: () => void;
  isStopping?: boolean;
  layout?: "row" | "stack";
}

export function TimerControls({
  onSwitch,
  onPause,
  onFinish,
  isStopping = false,
  layout = "row",
}: TimerControlsProps) {
  const [showPauseSelector, setShowPauseSelector] = useState(false);

  if (showPauseSelector) {
    return (
      <ActivityTypeSelector
        onSelect={(type) => {
          setShowPauseSelector(false);
          onPause(type);
        }}
        onCancel={() => setShowPauseSelector(false)}
      />
    );
  }

  const isStack = layout === "stack";

  return (
    <div className={isStack ? "space-y-3" : "grid grid-cols-3 gap-2"}>
      <Button
        variant="outline"
        className="h-9 text-[12px]"
        onClick={onSwitch}
      >
        {UI_COPY.btnSwitch}
      </Button>
      <Button
        variant="secondary"
        className="h-9 text-[12px]"
        onClick={() => setShowPauseSelector(true)}
      >
        {UI_COPY.btnPause}
      </Button>
      <Button
        variant="default"
        className="h-9 text-[12px]"
        disabled={isStopping}
        onClick={onFinish}
      >
        {isStopping ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {UI_COPY.btnSaving}
          </span>
        ) : (
          UI_COPY.btnFinish
        )}
      </Button>
    </div>
  );
}
