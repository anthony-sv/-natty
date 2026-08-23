import type { Routine } from "./schema";
import { bulkingProgram } from "./bulking-program";
import { cuttingProgram } from "./cutting-program";
import { armsProgram } from "./arms-program";
import { backProgram } from "./back-program";
import { bigWheelsProgram } from "./big-wheels-program";
import { chestArmsProgram } from "./chest-arms-program";

export const routines: Routine[] = [
  bulkingProgram,
  cuttingProgram,
  armsProgram,
  backProgram,
  bigWheelsProgram,
  chestArmsProgram,
];

export function getRoutineBySlug(slug: string): Routine | undefined {
  return routines.find((routine) => routine.slug === slug);
}

export {
  routineSchema,
  prescriptionSchema,
  setSegmentSchema,
  exerciseEntrySchema,
} from "./schema";
export type {
  Routine,
  TrainingWeek,
  TrainingDay,
  ExerciseEntry,
  Prescription,
  PoseCue,
  SetModifiers,
  SetSegment,
} from "./schema";
export { warmupSections, getWarmupSection } from "./warmups";
export type { WarmupSection, WarmupMove } from "./schema";
