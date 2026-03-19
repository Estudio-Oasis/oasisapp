import { useState, useRef, useEffect, useCallback } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineEditableTextProps {
  value: string;
  onSave: (newValue: string) => void | Promise<void>;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
}

export function InlineEditableText({
  value,
  onSave,
  placeholder = "Sin descripción",
  className,
  inputClassName,
  multiline = false,
}: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const save = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      void onSave(trimmed);
    }
    setIsEditing(false);
  }, [draft, value, onSave]);

  const cancel = useCallback(() => {
    setDraft(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      cancel();
    }
  };

  if (isEditing) {
    const sharedProps = {
      ref: inputRef as any,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: save,
      onKeyDown: handleKeyDown,
      placeholder,
      className: cn(
        "w-full bg-transparent border-b border-accent/40 focus:border-accent outline-none text-foreground transition-colors py-0.5",
        inputClassName
      ),
    };

    return multiline ? (
      <textarea {...sharedProps} rows={2} />
    ) : (
      <input type="text" {...sharedProps} />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        "group inline-flex items-center gap-1.5 text-left cursor-text hover:bg-foreground/5 rounded-md transition-colors -ml-1 px-1",
        className
      )}
    >
      <span className={cn(!value && "text-foreground-muted italic")}>
        {value || placeholder}
      </span>
      <Pencil className="h-3 w-3 text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  );
}
