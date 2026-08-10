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
import { useT } from "@/i18n/use-t";
import { LogEntryForm } from "./LogEntryForm";
import { RecordsTable } from "./RecordsTable";
import { useAllRecords } from "../queries";

/** The records half of /progress: every PR, plus backfill logging. */
export function RecordsPanel() {
  const { rows, isLoading, loggedSetCount } = useAllRecords();
  const t = useT();
  // No debounce: the filter runs over rows already in memory, so a keystroke
  // costs less than the lag a debounce would add.
  const [search, setSearch] = useState("");

  const hasNothingLogged = !isLoading && loggedSetCount === 0;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("records.logSet.title")}</CardTitle>
          <CardDescription>{t("records.logSet.body")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LogEntryForm />
        </CardContent>
      </Card>

      {hasNothingLogged ? (
        <Empty>
          <EmptyTitle>{t("records.nothingLogged.title")}</EmptyTitle>
          <EmptyDescription>{t("records.nothingLogged.body")}</EmptyDescription>
        </Empty>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("records.title")}</CardTitle>
            <CardDescription>{t("records.body")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                aria-label={t("records.searchLabel")}
                placeholder={t("common.searchExercises")}
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
