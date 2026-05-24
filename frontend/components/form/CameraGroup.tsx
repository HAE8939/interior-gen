"use client";

import { useForm } from "@/lib/form-context";
import { vocab } from "@/lib/vocab";

import { Field } from "./Section";
import { SingleSelectDropdown } from "./SingleSelectDropdown";

export function CameraGroup() {
  const { state, setNested } = useForm();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="机身" hint={`${vocab.camera.bodies.length} 款`}>
        <SingleSelectDropdown
          options={vocab.camera.bodies}
          value={state.camera.body}
          onChange={(v) => setNested("camera", "body", v)}
        />
      </Field>
      <Field label="镜头" hint={`${vocab.camera.lenses.length} 款`}>
        <SingleSelectDropdown
          options={vocab.camera.lenses}
          value={state.camera.lens}
          onChange={(v) => setNested("camera", "lens", v)}
        />
      </Field>
      <Field label="光圈" hint={`${vocab.camera.apertures.length} 档`}>
        <SingleSelectDropdown
          options={vocab.camera.apertures}
          value={state.camera.aperture}
          onChange={(v) => setNested("camera", "aperture", v)}
        />
      </Field>
      <Field label="ISO" hint={`${vocab.camera.iso.length} 档`}>
        <SingleSelectDropdown
          options={vocab.camera.iso}
          value={state.camera.iso}
          onChange={(v) => setNested("camera", "iso", v)}
        />
      </Field>
    </div>
  );
}
