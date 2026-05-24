"use client";

import { useForm } from "@/lib/form-context";
import { vocab } from "@/lib/vocab";

import { Field } from "./Section";
import { SingleSelectDropdown } from "./SingleSelectDropdown";

export function CompositionGroup() {
  const { state, setNested } = useForm();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="构图视角" hint={`${vocab.composition.perspectives.length} 项`}>
        <SingleSelectDropdown
          options={vocab.composition.perspectives}
          value={state.composition.perspective}
          onChange={(v) => setNested("composition", "perspective", v)}
        />
      </Field>
      <Field label="景别" hint={`${vocab.composition.shots.length} 项`}>
        <SingleSelectDropdown
          options={vocab.composition.shots}
          value={state.composition.shot}
          onChange={(v) => setNested("composition", "shot", v)}
        />
      </Field>
    </div>
  );
}
