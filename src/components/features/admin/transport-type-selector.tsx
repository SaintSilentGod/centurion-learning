"use client";

import Image from "next/image";
import { TRANSPORT_TYPES, type TransportTypeValue } from "@/lib/transport";

const TRANSPORT_ICONS: Record<TransportTypeValue, string> = {
  ROAD: "/icons/road.svg",
  RAIL: "/icons/railway.svg",
  AVIATION: "/icons/plane.svg",
  MARITIME: "/icons/boat.svg",
};

export function TransportTypeSelector({
  value,
  onChange,
}: {
  value: TransportTypeValue | "";
  onChange: (value: TransportTypeValue) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-base font-medium text-slate-800">
        Вид транспорта <span className="text-red-600">*</span>
      </legend>
      <p className="text-sm text-slate-600">
        Выберите один вид транспорта до назначения классификаций.
      </p>
      <input type="hidden" name="transportType" value={value} required />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {TRANSPORT_TYPES.map((type) => {
          const selected = value === type.value;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange(type.value)}
              className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border-2 px-3 py-4 transition ${
                selected
                  ? "border-blue-700 bg-blue-50 text-blue-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
              aria-pressed={selected}
            >
              <Image
                src={TRANSPORT_ICONS[type.value]}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10"
                aria-hidden
              />
              <span className="text-center text-sm font-medium">{type.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
