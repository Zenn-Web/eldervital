"use client";

import { useSyncExternalStore } from "react";
import { useElderSession } from "./ElderSession";
import ElderName from "./ElderName";

function getGreeting(hour: number): string {
  if (hour >= 4 && hour < 11) return "Selamat pagi";
  if (hour >= 11 && hour < 15) return "Selamat siang";
  if (hour >= 15 && hour < 18) return "Selamat sore";
  return "Selamat malam";
}

function formatIndonesianDate(date: Date): string {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${monthName} ${year}`;
}

const noopSubscribe = () => () => {};

let cachedTime: { greeting: string; dateText: string } | null = null;

function getClientSnapshot() {
  if (!cachedTime) {
    const now = new Date();
    cachedTime = {
      greeting: getGreeting(now.getHours()),
      dateText: formatIndonesianDate(now),
    };
  }
  return cachedTime;
}

const SERVER_SNAPSHOT = {
  greeting: "Selamat pagi",
  dateText: "",
};

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

export default function ElderGreetingHeader() {
  const { profile } = useElderSession();
  const time = useSyncExternalStore(noopSubscribe, getClientSnapshot, getServerSnapshot);

  const nameLower = (profile?.displayName ?? "").toLowerCase();
  const sapaan = nameLower.includes("pak")
    ? "Bapak"
    : nameLower.includes("bu")
      ? "Ibu"
      : "Ibu/Bapak";

  return (
    <header className="space-y-1.5 pt-1" aria-label="Sapaan lansia">
      {time.dateText ? (
        <span className="text-xs font-bold text-sogan uppercase tracking-widest block">
          {time.dateText}
        </span>
      ) : (
        <span className="text-xs font-bold text-sogan uppercase tracking-widest block invisible">
          Memuat tanggal...
        </span>
      )}
      <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink leading-tight">
        {time.greeting},{" "}
        <span className="text-primary">
          <ElderName fallback="Bu Sari" />
        </span>
      </h1>
      <p className="text-base text-ink-soft leading-relaxed">
        Bagaimana kondisi {sapaan} hari ini? Mari luangkan sebentar untuk pemeriksaan singkat.
      </p>
    </header>
  );
}
