import { useState, useCallback, useRef, useEffect } from "react";
import { Plus, Play, Trash2, CheckCircle2, Circle, ListChecks, Square, Sparkles } from "lucide-react";
import { useBitacora, useBitacoraVM } from "../BitacoraContext";
import type { DemoTodo } from "./types";
import { LS_DEMO_TODOS } from "./types";
import { formatDuration } from "@/lib/timer-utils";

function loadTodos(): DemoTodo[] {
  try {
    const raw = localStorage.getItem(LS_DEMO_TODOS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTodos(todos: DemoTodo[]) {
  localStorage.setItem(LS_DEMO_TODOS, JSON.stringify(todos));
}

/**
 * Smartly split raw text into individual todo items.
 * Handles: commas, newlines, numbered lists, bullet points.
 */
function smartSplit(raw: string): string[] {
  // First try newlines
  const lines = raw.split(/\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    // Clean numbered prefixes: "1. ", "1) ", "- ", "• "
    return lines.map((l) => l.replace(/^(\d+[\.\)]\s*|[-•]\s*)/, "").trim()).filter(Boolean);
  }
  // Then try commas
  const parts = raw.split(/,/).map((t) => t.trim()).filter(Boolean);
  if (parts.length > 1) return parts;
  // Single item
  return raw.trim() ? [raw.trim()] : [];
}

export function TodoPanel() {
  const [todos, setTodos] = useState<DemoTodo[]>(loadTodos);
  const [input, setInput] = useState("");
  const [composerMode, setComposerMode] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bita = useBitacora();
  const vm = useBitacoraVM();

  useEffect(() => saveTodos(todos), [todos]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // Track when active session stops — mark the in-progress todo as done with duration
  const prevRunning = useRef(bita.isRunning);
  useEffect(() => {
    if (prevRunning.current && !bita.isRunning) {
      setTodos((prev) => {
        const inProgressTodo = prev.find((t) => t.inProgress);
        if (!inProgressTodo) return prev;
        const matchingEntry = vm.entries.find(
          (e) => e.description === inProgressTodo.text
        );
        const duration = matchingEntry?.duration_min || null;
        return prev.map((t) =>
          t.id === inProgressTodo.id
            ? { ...t, done: true, inProgress: false, registeredMin: duration }
            : t
        );
      });
    }
    prevRunning.current = bita.isRunning;
  }, [bita.isRunning, vm.entries]);

  const addFromInput = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    const items = smartSplit(text);
    setTodos((prev) => [
      ...prev,
      ...items.map((t) => ({
        id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: t,
        done: false,
        inProgress: false,
        registeredMin: null,
      })),
    ]);
    setInput("");
    setComposerMode(false);
  }, [input]);

  const toggleDone = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, done: !t.done, inProgress: false } : t
      )
    );
  }, []);

  const removeTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const startTodo = useCallback(
    async (todo: DemoTodo) => {
      setTodos((prev) =>
        prev.map((t) =>
          t.id === todo.id
            ? { ...t, inProgress: true, done: false }
            : { ...t, inProgress: false }
        )
      );
      await bita.startActivity({ description: todo.text });
    },
    [bita]
  );

  const stopTodo = useCallback(async () => {
    await bita.stopActivity();
  }, [bita]);

  const total = todos.length;
  const doneCount = todos.filter((t) => t.done).length;
  const inProgressTodo = todos.find((t) => t.inProgress);
  const pendingCount = total - doneCount - (inProgressTodo ? 1 : 0);

  const hasMultipleLines = input.includes("\n") || input.includes(",");

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-accent" />
          <span className="text-[13px] font-semibold text-foreground">
            Pendientes del día
          </span>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-2 text-[10px] font-medium text-foreground-muted">
            {pendingCount > 0 && <span>{pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}</span>}
            {inProgressTodo && <span className="text-accent">· 1 en curso</span>}
            {doneCount > 0 && <span className="text-success">· {doneCount} listo{doneCount !== 1 ? "s" : ""}</span>}
          </div>
        )}
      </div>

      {/* Composer input */}
      <div className="px-4 py-3 border-b border-border space-y-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (e.target.value.includes("\n")) setComposerMode(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !composerMode) {
              e.preventDefault();
              addFromInput();
            }
          }}
          placeholder={"¿Qué necesitas hacer hoy?\nEscribe todo junto, nosotros lo separamos."}
          rows={composerMode || input.length > 60 ? 4 : 2}
          className="w-full bg-background-secondary border border-border rounded-xl px-4 py-3 text-[14px] text-foreground placeholder:text-foreground-muted resize-none focus:outline-none focus:border-accent/50 transition-all"
        />

        <div className="flex items-center gap-2 flex-wrap">
          {hasMultipleLines ? (
            <>
              <button
                onClick={addFromInput}
                disabled={!input.trim()}
                className="h-10 px-5 rounded-xl bg-foreground text-background text-[13px] font-bold flex items-center gap-2 hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-30"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Convertir en lista
              </button>
              <button
                onClick={() => {
                  const text = input.trim();
                  if (!text) return;
                  setTodos((prev) => [
                    ...prev,
                    {
                      id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                      text,
                      done: false,
                      inProgress: false,
                      registeredMin: null,
                    },
                  ]);
                  setInput("");
                  setComposerMode(false);
                }}
                disabled={!input.trim()}
                className="h-10 px-4 rounded-xl border border-border text-foreground-secondary text-[13px] font-semibold flex items-center gap-2 hover:bg-background-tertiary active:scale-[0.97] transition-all disabled:opacity-30"
              >
                Guardar como un pendiente
              </button>
            </>
          ) : (
            <button
              onClick={addFromInput}
              disabled={!input.trim()}
              className="h-10 px-5 rounded-xl bg-foreground text-background text-[13px] font-bold flex items-center gap-2 hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar
            </button>
          )}
          <span className="text-[10px] text-foreground-muted">
            Dictar o pegar varios y lo separamos
          </span>
        </div>
      </div>

      {/* List */}
      {todos.length === 0 ? (
        <div className="px-4 py-8 text-center space-y-1">
          <p className="text-[13px] font-medium text-foreground-muted">
            Tu lista está vacía
          </p>
          <p className="text-[11px] text-foreground-muted">
            Escribe tus pendientes arriba y toca "Empezar" en el que quieras atacar primero
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={`px-4 py-3 flex items-center gap-3 transition-colors ${
                todo.inProgress ? "bg-accent/5" : ""
              } ${todo.done ? "opacity-60" : ""}`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleDone(todo.id)}
                className="shrink-0 text-foreground-muted hover:text-foreground transition-colors"
              >
                {todo.done ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </button>

              {/* Text + duration */}
              <div className="flex-1 min-w-0">
                <span
                  className={`text-[14px] block truncate ${
                    todo.done
                      ? "line-through text-foreground-muted"
                      : "text-foreground font-medium"
                  }`}
                >
                  {todo.text}
                </span>
                {todo.done && todo.registeredMin != null && (
                  <span className="text-[11px] text-success font-medium">
                    Registrado · {formatDuration(todo.registeredMin)}
                  </span>
                )}
              </div>

              {/* In-progress badge + stop */}
              {todo.inProgress && (
                <button
                  onClick={stopTodo}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-full hover:bg-accent/20 transition-colors animate-pulse"
                >
                  <Square className="h-3 w-3 fill-current" />
                  Detener
                </button>
              )}

              {/* Actions — always visible on mobile */}
              {!todo.done && !todo.inProgress && (
                <button
                  onClick={() => startTodo(todo)}
                  className="h-9 px-4 rounded-xl bg-accent/10 text-accent text-[12px] font-semibold flex items-center gap-1.5 hover:bg-accent/20 active:scale-[0.97] transition-all shrink-0"
                >
                  <Play className="h-3.5 w-3.5" />
                  Empezar
                </button>
              )}

              <button
                onClick={() => removeTodo(todo.id)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-foreground-muted hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
