import { useState } from "react";
import { SearchIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { LogEntryForm } from "./LogEntryForm";
import { RecordsTable } from "./RecordsTable";
import { useAllRecords } from "../queries";

/** The records half of /progress: every PR, plus backfill logging. */
export function RecordsPanel() {
  const { rows, isLoading, loggedSetCount } = useAllRecords();
  // No debounce: the filter runs over rows already in memory, so a keystroke
  // costs less than the lag a debounce would add.
  const [search, setSearch] = useState("");

  const hasNothingLogged = !isLoading && loggedSetCount === 0;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Log a set</CardTitle>
          <CardDescription>
            For work done outside the player, or to catch up on a session you
            didn't log at the time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LogEntryForm />
        </CardContent>
      </Card>

      {hasNothingLogged ? (
        <Empty>
          <EmptyTitle>Nothing logged yet</EmptyTitle>
          <EmptyDescription>
            Log a set above, or start a workout and record your sets as you go.
          </EmptyDescription>
        </Empty>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Records</CardTitle>
            <CardDescription>
              The best weight at each rep count, per exercise — a set only shows
              here when nothing beat it on both weight and reps.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Search records by exercise"
                placeholder="Search exercises..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <RecordsTable rows={rows} isLoading={isLoading} search={search} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
