import { useMemo } from "react";

interface ClientOption {
  id: string;
  name: string;
}

interface ProjectOption {
  id: string;
  name: string;
  clientId: string;
}

interface Suggestion {
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  confidence: number;
}

function normalize(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function fuzzyMatch(text: string, target: string): number {
  const normText = normalize(text);
  const normTarget = normalize(target);
  
  // Exact word match
  if (normText.includes(normTarget)) return 1;
  
  // Split target into words and check each
  const targetWords = normTarget.split(/\s+/);
  const matchedWords = targetWords.filter((w) => w.length >= 3 && normText.includes(w));
  if (targetWords.length > 0 && matchedWords.length > 0) {
    return matchedWords.length / targetWords.length;
  }
  
  return 0;
}

export function useAutoSuggestClient(
  text: string,
  clients: ClientOption[],
  projects: ProjectOption[]
): Suggestion | null {
  return useMemo(() => {
    if (!text || text.length < 3) return null;

    let bestSuggestion: Suggestion | null = null;
    let bestScore = 0;

    // Check projects first (more specific)
    for (const project of projects) {
      const score = fuzzyMatch(text, project.name);
      if (score > bestScore && score >= 0.8) {
        const client = clients.find((c) => c.id === project.clientId);
        bestScore = score;
        bestSuggestion = {
          clientId: project.clientId,
          clientName: client?.name || "",
          projectId: project.id,
          projectName: project.name,
          confidence: score,
        };
      }
    }

    // Check clients
    for (const client of clients) {
      const score = fuzzyMatch(text, client.name);
      if (score > bestScore && score >= 0.8) {
        bestScore = score;
        bestSuggestion = {
          clientId: client.id,
          clientName: client.name,
          confidence: score,
        };
      }
    }

    return bestSuggestion;
  }, [text, clients, projects]);
}
