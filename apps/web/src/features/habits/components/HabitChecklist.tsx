import { useMemo, useState } from "react";
import { useStore } from "@tanstack/react-store";
import {
  ArchiveIcon,
  FlameIcon,
  MinusIcon,
  PencilLineIcon,
  PlayIcon,
  PlusIcon,
  SquareIcon,
  Trash2Icon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast";
import { useNow } from "@/features/routines/lib/use-countdown";
import { useT, type MessageKey } from "@/i18n/use-t";
import { cn } from "@/lib/utils";
import {
  adjustHabit,
  allHabitLogs,
  archiveHabit,
  createHabit,
  deleteHabit,
  restoreHabit,
} from "../collection";
import { habitDay, hasHistory, type HabitRow } from "../habits";
import type { Habit } from "../schema";
import {
  habitTimerStore,
  startHabitTimer,
  stopHabitTimer,
} from "../timer-store";
import { useHabits } from "../use-habits";
import { toHabitInput } from "../input";
import { HabitForm } from "./HabitForm";

/** Above this many a day, boxes stop being tappable and a stepper takes over. */
const MAX_BOXES = 8;

/**
 * Ready-made habits for an empty page. Named in the reader's language at the
 * moment you add one — after that the name is yours, like any you typed.
 */
const STARTERS: Array<{
  nameKey: MessageKey;
  kind: "count" | "minutes";
  perDay: number;
}> = [
  { nameKey: "habits.starter.teeth", kind: "count", perDay: 3 },
  { nameKey: "habits.starter.floss", kind: "count", perDay: 1 },
  { nameKey: "habits.starter.read", kind: "minutes", perDay: 15 },
  { nameKey: "habits.starter.stretch", kind: "minutes", perDay: 10 },
  { nameKey: "habits.starter.meditate", kind: "minutes", perDay: 10 },
  { nameKey: "habits.starter.walk", kind: "minutes", perDay: 30 },
];

/**
 * The day's habits, and whether you've done them.
 *
 * **Nothing auto-ticks**, the rule the Today tab follows. Removing a tick
 * gets no undo toast: unlike a meal, a tick here is one tap to put back.
 */
export function HabitChecklist({ day, today }: { day: number; today: number }) {
  const t = useT();
  const { habits, logs, isLoading } = useHabits();
  const [editing, setEditing] = useState<Habit | "new" | undefined>();

  const summary = useMemo(
    () => habitDay(habits, logs, day, today),
    [habits, logs, day, today],
  );
  const activeCount = habits.filter((h) => h.archivedAt === undefined).length;

  const remove = (habit: Habit) => {
    if (hasHistory(allHabitLogs(), habit.id)) {
      archiveHabit(habit.id);
      toast.add({
        title: t("habits.archived", { name: habit.name }),
        type: "info",
        actionProps: {
          children: t("history.undo"),
          onClick: () => restoreHabit(habit.id),
        },
      });
      return;
    }
    deleteHabit(habit.id);
    toast.add({ title: t("habits.deleted", { name: habit.name }), type: "info" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>{t("habits.checklist")}</CardTitle>
            <CardDescription>
              {summary.total > 0
                ? t("habits.doneOf", { done: summary.done, total: summary.total })
                : t("habits.checklistBody")}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing("new")}>
            <PlusIcon data-icon="inline-start" />
            {t("habits.add")}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {isLoading ? null : summary.rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {activeCount === 0 ? t("habits.empty") : t("habits.nothingDue")}
          </p>
        ) : (
          summary.rows.map((row) => (
            <HabitRowView
              key={row.habit.id}
              row={row}
              day={day}
              hasHistory={hasHistory(logs, row.habit.id)}
              onEdit={() => setEditing(row.habit)}
              onRemove={() => remove(row.habit)}
            />
          ))
        )}

        {/* Only on a first visit: once you have habits, a row of suggestions
            above them is clutter. */}
        {!isLoading && activeCount === 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {t("habits.startersTitle")}
            </span>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((starter) => (
                <Button
                  key={starter.nameKey}
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const name = t(starter.nameKey);
                    createHabit(
                      toHabitInput({
                        name,
                        kind: starter.kind,
                        perDay: starter.perDay,
                        scheduleKind: "daily",
                        days: [],
                        timesPerWeek: 7,
                        timing: "",
                      }),
                    );
                  }}
                >
                  <PlusIcon data-icon="inline-start" />
                  {t(starter.nameKey)} ·{" "}
                  {starter.kind === "count"
                    ? t("habits.perDayCount", { count: starter.perDay })
                    : t("habits.perDayMinutes", { count: starter.perDay })}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>

      <Dialog
        open={editing !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing === "new" || editing === undefined
                ? t("habits.add")
                : t("habits.editTitle", { name: editing.name })}
            </DialogTitle>
            <DialogDescription>{t("habits.formBody")}</DialogDescription>
          </DialogHeader>
          {editing !== undefined ? (
            <HabitForm
              existing={editing === "new" ? undefined : editing}
              onDone={() => setEditing(undefined)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function StreakBadge({ row }: { row: Pick<HabitRow, "streak"> }) {
  const t = useT();
  if (row.streak.count === 0) return null;
  return (
    <Badge variant="secondary" className="gap-1 tabular-nums">
      <FlameIcon />
      {row.streak.unit === "days"
        ? t.plural("habits.streakDays", row.streak.count, { count: row.streak.count })
        : t.plural("habits.streakWeeks", row.streak.count, { count: row.streak.count })}
    </Badge>
  );
}

function HabitRowView({
  row,
  day,
  hasHistory,
  onEdit,
  onRemove,
}: {
  row: HabitRow;
  day: number;
  hasHistory: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const t = useT();
  const { habit, amount, met } = row;
  const archived = habit.archivedAt !== undefined;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-md border p-3",
        met && "border-primary/50 bg-primary/5",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {/* `min-w-0`, never `shrink-0`, on a flex child holding text. */}
        <span className="min-w-0 flex-1 truncate font-medium">{habit.name}</span>
        <StreakBadge row={row} />
        {archived ? <Badge variant="secondary">{t("habits.archivedTag")}</Badge> : null}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("habits.edit", { name: habit.name })}
            onClick={onEdit}
          >
            <PencilLineIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label={t("habits.remove", { name: habit.name })}
            onClick={onRemove}
          >
            {hasHistory ? <ArchiveIcon /> : <Trash2Icon />}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {habit.target.kind === "count"
          ? t("habits.perDayCount", { count: habit.target.perDay })
          : t("habits.perDayMinutes", { count: habit.target.perDay })}
        {row.week
          ? ` · ${t("habits.weekProgress", { met: row.week.met, target: row.week.target })}`
          : ""}
        {habit.timing ? ` · ${habit.timing}` : ""}
      </p>

      {archived ? null : habit.target.kind === "count" ? (
        <CountControl habit={habit} amount={amount} day={day} />
      ) : (
        <MinutesControl habit={habit} amount={amount} day={day} />
      )}
    </div>
  );
}

/**
 * One box per time — the supplements checklist's shape, for the same reason:
 * three brushes are three things you did, not one you did three of.
 */
function CountControl({ habit, amount, day }: { habit: Habit; amount: number; day: number }) {
  const t = useT();
  const perDay = habit.target.perDay;

  if (perDay > MAX_BOXES) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t("habits.less", { name: habit.name })}
          disabled={amount === 0}
          onClick={() => adjustHabit(habit.id, day, -1)}
        >
          <MinusIcon />
        </Button>
        <span className="min-w-16 text-center text-sm tabular-nums">
          {t("habits.countOf", { count: amount, target: perDay })}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t("habits.more", { name: habit.name })}
          onClick={() => adjustHabit(habit.id, day, 1)}
        >
          <PlusIcon />
        </Button>
      </div>
    );
  }

  // Never fewer boxes than ticks, so lowering the target never hides one.
  const slots = Math.max(perDay, amount);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {Array.from({ length: slots }, (_, i) => {
        const done = i < amount;
        return (
          <Label
            key={i}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-normal",
              done && "border-primary bg-primary/10",
            )}
          >
            <Checkbox
              checked={done}
              aria-label={
                slots > 1
                  ? t("habits.timeOf", { number: i + 1, total: slots })
                  : t("habits.done", { name: habit.name })
              }
              // Which box you press doesn't matter — only how many are
              // filled does, so a tick fills the next and an untick empties
              // the last.
              onCheckedChange={() => adjustHabit(habit.id, day, done ? -1 : 1)}
            />
            {slots > 1 ? <span className="tabular-nums">{i + 1}</span> : null}
          </Label>
        );
      })}
    </div>
  );
}

function MinutesControl({ habit, amount, day }: { habit: Habit; amount: number; day: number }) {
  const t = useT();
  const perDay = habit.target.perDay;
  const timer = useStore(habitTimerStore, (s) => s);
  const running = timer?.habitId === habit.id;
  const now = useNow(running);
  const elapsedSeconds = running ? Math.max(0, Math.floor((now - timer.startedAt) / 1000)) : 0;
  // Small steps for a short habit, bigger ones for a long one.
  const step = perDay >= 30 ? 15 : 5;

  const stop = () => {
    const stopped = stopHabitTimer(Date.now());
    if (stopped === null) return;
    if (stopped.minutes > 0) {
      adjustHabit(stopped.timer.habitId, stopped.timer.day, stopped.minutes);
      toast.add({
        title: t("habits.timerLogged", { count: stopped.minutes, name: habit.name }),
        type: "success",
      });
    } else {
      toast.add({ title: t("habits.timerTooShort"), type: "info" });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Progress
          value={Math.min(100, (amount / perDay) * 100)}
          className="flex-1"
          aria-label={t("habits.minutesOf", { count: amount, target: perDay })}
        />
        <span className="text-sm tabular-nums">
          {t("habits.minutesOf", { count: amount, target: perDay })}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t("habits.lessMinutes", { count: step })}
          disabled={amount === 0}
          onClick={() => adjustHabit(habit.id, day, -step)}
        >
          <MinusIcon />
        </Button>
        <Button variant="outline" size="sm" onClick={() => adjustHabit(habit.id, day, step)}>
          <PlusIcon data-icon="inline-start" />
          {t("habits.addMinutes", { count: step })}
        </Button>
        {running ? (
          <Button size="sm" onClick={stop}>
            <SquareIcon data-icon="inline-start" />
            {t("habits.stopTimer", {
              time: `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, "0")}`,
            })}
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            // One timer at a time: starting another would leave the first
            // counting minutes nobody spent on it.
            disabled={timer !== null}
            onClick={() => startHabitTimer(habit.id, day, Date.now())}
          >
            <PlayIcon data-icon="inline-start" />
            {t("habits.startTimer")}
          </Button>
        )}
      </div>
    </div>
  );
}
