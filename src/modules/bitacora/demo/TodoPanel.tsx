import { useState, useCallback, useRef, useEffect } from "react";
import { Plus, Play, Trash2, CheckCircle2, Circle, ListChecks } from "lucide-react";
import { useBitacora } from "../BitacoraContext";
import type { DemoTodo } from "./types";
import { LS_DEMO_TODOS } from "./types";

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

export function TodoPanel() {
  const [todos, setTodos] = useState<DemoTodo[]>(loadTodos);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const bita = useBitacora();

  useEffect(() => saveTodos(todos), [todos]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const addTodo = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    // Support comma/newline separated batch
    const items = text.split(/[,\n]+/).map((t) => t.trim()).filter(Boolean);
    setTodos((prev) => [
      ...prev,
      ...items.map((t) => ({
        id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: t,
        done: false,
        inProgress: false,
      })),
    ]);
    setInput("");
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
      // Mark all others as not in progress
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

  const total = todos.length;
  const doneCount = todos.filter((t) => t.done).length;
  const inProgressCount = todos.filter((t) => t.inProgress).length;
  const pendingCount = total - doneCount;

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
            {inProgressCount > 0 && <span className="text-accent">· 1 en progreso</span>}
            {doneCount > 0 && <span className="text-green-500">· {doneCount} listo{doneCount !== 1 ? "s" : ""}</span>}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-b border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTodo();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="¿Qué necesitas hacer hoy?"
            className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-foreground-muted outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent hover:bg-accent/20 transition-colors disabled:opacity-30"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </form>
        <p className="text-[10px] text-foreground-muted mt-1">
          Separa con comas para agregar varios de golpe
        </p>
      </div>

      {/* List */}
      {todos.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-[12px] text-foreground-muted">
            Agrega tus pendientes y elige cuál empezar primero
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={`px-4 py-2.5 flex items-center gap-3 group transition-colors ${
                todo.inProgress ? "bg-accent/5" : ""
              } ${todo.done ? "opacity-50" : ""}`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleDone(todo.id)}
                className="shrink-0 text-foreground-muted hover:text-foreground transition-colors"
              >
                {todo.done ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </button>

              {/* Text */}
              <span
                className={`flex-1 text-[13px] ${
                  todo.done
                    ? "line-through text-foreground-muted"
                    : "text-foreground"
                }`}
              >
                {todo.text}
              </span>

              {/* In-progress badge */}
              {todo.inProgress && (
                <span className="text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full animate-pulse">
                  EN CURSO
                </span>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!todo.done && !todo.inProgress && (
                  <button
                    onClick={() => startTodo(todo)}
                    className="h-6 px-2 rounded-md bg-accent/10 text-accent text-[10px] font-medium flex items-center gap-1 hover:bg-accent/20 transition-colors"
                    title="Empezar este pendiente"
                  >
                    <Play className="h-3 w-3" />
                    Empezar
                  </button>
                )}
                <button
                  onClick={() => removeTodo(todo.id)}
                  className="h-6 w-6 rounded-md flex items-center justify-center text-foreground-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
