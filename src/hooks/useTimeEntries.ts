import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  isSameDay,
  startOfDay,
  startOfWeek,
} from "@/lib/timer-utils";
import type { Tables } from "@/integrations/supabase/types";

type TimeEntry = Tables<"time_entries">;

export interface EntryWithRelations extends TimeEntry {
  clients: { name: string } | null;
  tasks: { title: string } | null;
}

export interface ProfileInfo {
  id: string;
  name: string | null;
}

export interface GapInfo {
  startTime: Date;
  endTime: Date;
  durationMin: number;
}

interface UseTimeEntriesOptions {
  view: "today" | "week";
  entryFilter: "mine" | "all";
  /** Re-fetch trigger — pass isRunning to refresh when timer state changes */
  refreshTrigger?: boolean;
}

export function useTimeEntries({ view, entryFilter, refreshTrigger }: UseTimeEntriesOptions) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<EntryWithRelations[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, ProfileInfo>>({});
  const [gaps, setGaps] = useState<GapInfo[]>([]);
  const [workSchedule, setWorkSchedule] = useState({
    startHour: 9, startMinute: 0, endHour: 18, endMinute: 0,
  });

  // Fetch work schedule
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("work_start_hour, work_start_minute, work_end_hour, work_end_minute")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setWorkSchedule({
            startHour: (data as any).work_start_hour ?? 9,
            startMinute: (data as any).work_start_minute ?? 0,
            endHour: (data as any).work_end_hour ?? 18,
            endMinute: (data as any).work_end_minute ?? 0,
          });
        }
      });
  }, [user]);

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("id, name");
    const map: Record<string, ProfileInfo> = {};
    ((data || []) as ProfileInfo[]).forEach((p) => { map[p.id] = p; });
    setProfileMap(map);
  }, []);

  const detectGaps = useCallback((todayEntries: EntryWithRelations[]) => {
    const today = new Date();
    const sorted = [...todayEntries]
      .filter((e) => e.ended_at && isSameDay(new Date(e.started_at), today))
      .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

    const foundGaps: GapInfo[] = [];
    const THRESHOLD = 30;

    const workdayStart = new Date(today);
    workdayStart.setHours(workSchedule.startHour, workSchedule.startMinute, 0, 0);

    const workdayEnd = new Date(today);
    workdayEnd.setHours(workSchedule.endHour, workSchedule.endMinute, 0, 0);

    const capTime = Math.min(Date.now(), workdayEnd.getTime());

    if (today.getTime() >= workdayStart.getTime() && capTime > workdayStart.getTime()) {
      if (sorted.length === 0) {
        const gapMin = Math.round((capTime - workdayStart.getTime()) / 60000);
        if (gapMin > THRESHOLD) {
          foundGaps.push({ startTime: workdayStart, endTime: new Date(capTime), durationMin: gapMin });
        }
      } else {
        const firstStart = new Date(sorted[0].started_at);
        const gapMin = Math.round((firstStart.getTime() - workdayStart.getTime()) / 60000);
        if (gapMin > THRESHOLD) {
          foundGaps.push({ startTime: workdayStart, endTime: firstStart, durationMin: gapMin });
        }
      }
    }

    for (let i = 0; i < sorted.length - 1; i++) {
      const currEnd = new Date(sorted[i].ended_at!);
      const nextStart = new Date(sorted[i + 1].started_at);
      if (currEnd.getTime() >= workdayEnd.getTime()) continue;
      const clampedNext = Math.min(nextStart.getTime(), workdayEnd.getTime());
      const gapMin = Math.round((clampedNext - currEnd.getTime()) / 60000);
      if (gapMin > THRESHOLD) {
        foundGaps.push({ startTime: currEnd, endTime: new Date(clampedNext), durationMin: gapMin });
      }
    }

    setGaps(foundGaps);
  }, [workSchedule]);

  const fetchEntries = useCallback(async () => {
    if (!user) return;

    const now = new Date();
    const rangeStart = view === "today" ? startOfDay(now) : startOfWeek(now);

    let query = supabase
      .from("time_entries")
      .select("*, clients(name), tasks(title)")
      .not("ended_at", "is", null)
      .gte("started_at", rangeStart.toISOString())
      .order("started_at", { ascending: false });

    if (entryFilter === "mine") {
      query = query.eq("user_id", user.id);
    }

    const { data } = await query;
    const typedData = (data || []) as EntryWithRelations[];
    setEntries(typedData);

    if (view === "today") {
      const myEntries = entryFilter === "all" && user
        ? typedData.filter(e => e.user_id === user.id)
        : typedData;
      detectGaps(myEntries);
    } else {
      setGaps([]);
    }
  }, [user, view, entryFilter, detectGaps]);

  useEffect(() => {
    fetchProfiles();
    fetchEntries();
  }, [fetchEntries, fetchProfiles, refreshTrigger]);

  const totalMinutes = entries.reduce((sum, e) => sum + (Number(e.duration_min) || 0), 0);

  const groupedByDay = entries.reduce<Record<string, EntryWithRelations[]>>((acc, entry) => {
    const dayKey = startOfDay(new Date(entry.started_at)).toISOString();
    if (!acc[dayKey]) acc[dayKey] = [];
    acc[dayKey].push(entry);
    return acc;
  }, {});

  const sortedDays = Object.keys(groupedByDay).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return {
    entries,
    profileMap,
    gaps,
    totalMinutes,
    groupedByDay,
    sortedDays,
    fetchEntries,
    workSchedule,
  };
}
