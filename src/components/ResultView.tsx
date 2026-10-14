"use client";

import Link from "next/link";
import type { ScreeningResult } from "@/lib/screening";
import StatusMark from "./StatusMark";

const LABEL: Record<ScreeningResult["status"], string> = {
  green: "Hijau",
  yellow: "Kuning",
  red: "Merah",
  insufficient: "Belum ditentukan",
};

const WHO = { lansia: "dijawab lansia", caregiver: "dicatat caregiver" } as const;

interface Props {
  result: ScreeningResult;
  /** Dipanggil saat pengguna ingin memperbaiki satu jawaban. */
  onRevise: (nodeId: string) => void;
  onRestart: () => void;
  homeHref: string;
  homeLabel: string;
}

export default function ResultView({ result, onRevise, onRestart, homeHref, homeLabel }: Props) {
  return (
    <div className="stack-lg">
      <section className={`status status-${result.status}`} aria-labelledby="hasil-judul">
        <StatusMark status={result.status} />
        <div>
          <p className="status-label">Hasil skrining: {LABEL[result.status]}</p>
          <h1 id="hasil-judul" tabIndex={-1}>
            {result.headline}
          </h1>
          <p>{result.summary}</p>
          {result.interrupted && (
            <p>
              <strong>Pemeriksaan dihentikan lebih awal</strong> karena ada tanda bahaya. Pertanyaan
              yang tersisa tidak ditanyakan.
            </p>
          )}
        </div>
      </section>

      {result.emergencyContacts.length > 0 && (
        <section className="panel" aria-labelledby="darurat">
          <h2 id="darurat">Hubungi sekarang</h2>
          <div className="emergency">
            {result.emergencyContacts.map((c) => (
              <a key={c.number} className="btn btn-primary" href={`tel:${c.number}`}>
                {c.label}: {c.number}
              </a>
            ))}
          </div>
        </section>
      )}

      {result.reasons.length > 0 && (
        <section className="panel" aria-labelledby="alasan">
          <h2 id="alasan">Alasan hasil ini</h2>
          <ul>
            {result.reasons.map((r) => (
              <li key={r.ruleId}>
                <strong>{r.text}</strong>
                <br />
                <span className="small">
                  Dari jawaban &ldquo;{r.answerLabel}&rdquo; pada pertanyaan &ldquo;{r.question}&rdquo;
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.unknownItems.length > 0 && (
        <section className="panel" aria-labelledby="belum-tahu">
          <h2 id="belum-tahu">Belum diketahui</h2>
          <p>Pertanyaan berikut dijawab &ldquo;tidak yakin&rdquo;, jadi tidak dianggap aman:</p>
          <ul>
            {result.unknownItems.map((u) => (
              <li key={u.nodeId}>{u.question}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel" aria-labelledby="langkah">
        <h2 id="langkah">Yang bisa dilakukan</h2>
        <ul>
          {result.actions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </section>

      <section className="panel" aria-labelledby="ringkasan">
        <h2 id="ringkasan">Ringkasan jawaban</h2>
        <dl className="qa">
          {result.answers.map((a) => (
            <div key={a.nodeId}>
              <dt>{a.question}</dt>
              <dd>
                {a.answerLabel} <span className="who">({WHO[a.source]})</span>
                <br />
                <button type="button" className="btn btn-quiet" onClick={() => onRevise(a.nodeId)}>
                  Ubah jawaban ini
                </button>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="stack">
        <Link className="btn btn-primary" href={homeHref}>
          {homeLabel}
        </Link>
        <button type="button" className="btn" onClick={onRestart}>
          Ulangi pemeriksaan dari awal
        </button>
      </section>

      <p className="small">
        {result.disclaimer} Pohon pertanyaan versi {result.treeVersion}
        {result.reviewStatus === "belum_ditinjau" ? " (belum ditinjau tenaga kesehatan)." : "."}
      </p>
    </div>
  );
}
