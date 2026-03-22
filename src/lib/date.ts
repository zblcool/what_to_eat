const dateFormatter = new Intl.DateTimeFormat("sv-SE", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

const labelFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "long",
  day: "numeric",
  weekday: "short"
});

export function getTodayDate(): string {
  return dateFormatter.format(new Date());
}

export function getYesterdayDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return dateFormatter.format(date);
}

export function toOrderLabel(date: string): string {
  return `${date} 今日订单`;
}

export function formatDisplayDate(date: string): string {
  return labelFormatter.format(new Date(`${date}T00:00:00`));
}

export function nowIso(): string {
  return new Date().toISOString();
}
