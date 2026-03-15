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
    <div className={isStack ? "space-y-3" : "flex gap-2"}>
      <Button
        variant="outline"
        className={isStack ? "w-full h-11" : "flex-1 h-9"}
        onClick={onSwitch}
      >
        {UI_COPY.btnSwitch}
      </Button>
      <Button
        variant="secondary"
        className={isStack ? "w-full h-11" : "flex-1 h-9"}
        onClick={() => setShowPauseSelector(true)}
      >
        {UI_COPY.btnPause}
      </Button>
      <Button
        variant="destructive"
        className={isStack ? "w-full h-11" : "flex-1 h-9"}
        disabled={isStopping}
        onClick={onFinish}
      >
        {isStopping ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {UI_COPY.btnSaving}
          </span>
        ) : (
          UI_COPY.btnFinish
        )}
      </Button>
    </div>
  );
}
