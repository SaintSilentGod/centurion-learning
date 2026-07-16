export const TRANSPORT_TYPES = [
  { value: "ROAD", label: "Дорога" },
  { value: "RAIL", label: "Железная дорога" },
  { value: "AVIATION", label: "Авиация" },
  { value: "MARITIME", label: "Морской" },
] as const;

export type TransportTypeValue = (typeof TRANSPORT_TYPES)[number]["value"];

export function isTransportType(value: string): value is TransportTypeValue {
  return TRANSPORT_TYPES.some((t) => t.value === value);
}

export function transportTypeLabel(value: string): string {
  return TRANSPORT_TYPES.find((t) => t.value === value)?.label ?? value;
}

/** Минимальное время на теорию модуля (секунды) перед доступом к тесту */
export const MODULE_THEORY_REQUIRED_SEC = 2 * 60 * 60;

/** Интервал heartbeat (секунды) — клиент шлёт пинг пока вкладка открыта */
export const HEARTBEAT_INTERVAL_SEC = 30;
