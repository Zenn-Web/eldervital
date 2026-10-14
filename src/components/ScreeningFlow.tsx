"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  answerChoice,
  answerText,
  currentNode,
  evaluate,
  matchSpokenAnswer,
  progress,
  reviseAnswer,
  startSession,
  saveExamination,
  treeV1 as tree,
  undoLast,
  type ChoiceNode,
  type Mode,
  type ScreeningResult,
  type Session,
  type Source,
  type TextNode,
} from "@/lib/screening";
import {
  LISTEN_ERROR_MESSAGE,
  listenOnce,
  speak,
  sttSupported,
  stopListening,
  stopSpeaking,
  ttsSupported,
} from "@/lib/voice/speech";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ResultView from "./ResultView";

type Pending =
  | { kind: "confirm"; optionId: string; label: string; heard: string }
  | { kind: "retry"; heard: string };

interface Props {
  mode: Mode;
  homeHref: string;
  homeLabel: string;
  onFinish?: (session: Session, result: ScreeningResult) => void;
}

const noopSubscribe = () => () => {};

export default function ScreeningFlow({ mode, homeHref, homeLabel, onFinish }: Props) {
  const source: Source = mode === "caregiver" ? "caregiver" : "lansia";

  const [session, setSession] = useState<Session | null>(null);
  const [presence, setPresence] = useState(false);
  const [voiceOn] = useState(mode === "mandiri");
  const [slow, setSlow] = useState(false);
  const [listening, setListening] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [textValue, setTextValue] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const tts = useSyncExternalStore(noopSubscribe, ttsSupported, () => false);
  const stt = useSyncExternalStore(noopSubscribe, sttSupported, () => false);

  const nodeId = session?.currentId ?? null;
  const node = session && nodeId ? currentNode(tree, session) : null;
  const result = useMemo(
    () => (session && session.currentId === null ? evaluate(tree, session) : null),
    [session],
  );

  // Bacakan pertanyaan setiap kali pertanyaan berganti
  useEffect(() => {
    if (!nodeId || !voiceOn || !tts || pending) return;
    const n = tree.nodes[nodeId];
    speak(n.prompt, { slow });
    return () => stopSpeaking();
  }, [nodeId, voiceOn, tts, slow, pending]);

  // Bacakan konfirmasi jawaban suara
  useEffect(() => {
    if (!pending || !voiceOn || !tts) return;
    const text =
      pending.kind === "confirm"
        ? `Saya mendengar ${pending.heard}. Jawabannya ${pending.label}. Apakah benar?`
        : "Maaf, saya belum paham. Silakan ulangi, atau pilih salah satu tombol.";
    speak(text, { slow });
    return () => stopSpeaking();
  }, [pending, voiceOn, tts, slow]);

  // Fokus ke judul setiap layar baru
  const atIntro = session === null;
  useEffect(() => {
    headingRef.current?.focus();
  }, [nodeId, result, atIntro]);

  // Bersihkan audio saat unmount
  useEffect(
    () => () => {
      stopSpeaking();
      stopListening();
    },
    [],
  );

  function commit(next: Session) {
    setSession(next);
    setPending(null);
    setNotice(null);
    setTextValue("");
    if (next.currentId === null) {
      const res = evaluate(tree, next);
      saveExamination(next, res).catch((err) => {
        console.warn("Gagal menyimpan pemeriksaan:", err);
      });
      onFinish?.(next, res);
    }
  }

  function begin() {
    setSession(startSession(tree, { mode }));
  }

  function choose(optionId: string) {
    if (!session) return;
    stopListening();
    commit(answerChoice(tree, session, optionId, source));
  }

  function saveText(text: string | null) {
    if (!session) return;
    stopListening();
    commit(answerText(tree, session, text, source));
  }

  function listen() {
    if (!node) return;
    stopSpeaking();
    setNotice(null);
    setPending(null);
    setListening(true);
    listenOnce({
      onResult: (transcript) => {
        if (node.kind === "choice") {
          const m = matchSpokenAnswer(transcript, (node as ChoiceNode).options);
          if (m.status === "match") {
            const opt = (node as ChoiceNode).options.find((o) => o.id === m.optionId)!;
            setPending({ kind: "confirm", optionId: opt.id, label: opt.label, heard: m.heard });
          } else {
            setPending({ kind: "retry", heard: m.heard });
          }
        } else {
          setTextValue(transcript);
          setNotice("Periksa tulisan di kolom. Perbaiki bila keliru, lalu tekan Simpan.");
        }
      },
      onError: (e) => setNotice(LISTEN_ERROR_MESSAGE[e]),
      onEnd: () => setListening(false),
    });
  }

  function repeat() {
    if (!node) return;
    if (tts) speak(node.prompt, { slow });
    else setNotice("Browser ini belum bisa membacakan pertanyaan. Silakan baca di layar.");
  }

  function restart() {
    stopSpeaking();
    stopListening();
    setSession(null);
    setPending(null);
    setNotice(null);
    setTextValue("");
  }

  // ---------- Layar: Pengantar ----------
  if (!session) {
    const needsPresence = mode === "caregiver";
    return (
      <div className="space-y-6 max-w-md mx-auto py-4 text-ink">
        <Link
          href={homeHref}
          className="inline-flex items-center gap-2 text-primary font-bold text-base hover:underline"
        >
          ← {homeLabel}
        </Link>

        <section className="space-y-3">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-ink leading-tight"
          >
            {mode === "mandiri" ? "Pemeriksaan Gejala Mandiri" : "Pemeriksaan Bersama Lansia"}
          </h1>
          {mode === "mandiri" ? (
            <p className="text-lg text-ink-soft leading-relaxed">
              Aplikasi akan menanyakan kondisi Anda satu per satu. Anda bisa menjawab dengan tombol besar atau suara lisan. Pertanyaan bisa diulang kapan saja.
            </p>
          ) : (
            <p className="text-lg text-ink-soft leading-relaxed">
              Bacakan setiap pertanyaan kepada lansia, atau tunjukkan layar ini. Catat jawaban yang benar-benar diberikan lansia.
            </p>
          )}

          <div className="p-4 rounded-xl bg-status-alert-bg/40 border border-status-alert-mark/40 text-status-alert-ink text-sm">
            <strong>Keadaan Darurat:</strong> Jika merasa sangat sesak atau nyeri dada hebat saat ini, segera hubungi <strong>112</strong> atau <strong>119</strong>. Jangan menunggu pemeriksaan selesai.
          </div>
        </section>

        {needsPresence && (
          <div className="p-4 rounded-xl border-2 border-line bg-surface flex items-start gap-3 cursor-pointer">
            <input
              id="hadir"
              type="checkbox"
              checked={presence}
              onChange={(e) => setPresence(e.target.checked)}
              className="w-6 h-6 mt-0.5 rounded border-2 border-line accent-primary"
            />
            <label htmlFor="hadir" className="text-base font-bold text-ink leading-snug cursor-pointer">
              Lansia sedang bersama saya dan dapat menjawab langsung. Saya tidak akan mengisi berdasarkan perkiraan.
            </label>
          </div>
        )}

        <Button
          type="button"
          size="senior"
          onClick={begin}
          disabled={needsPresence && !presence}
          className="w-full text-xl font-bold rounded-2xl"
        >
          Mulai Pertanyaan Pertama
        </Button>
      </div>
    );
  }

  // ---------- Layar: Hasil Skrining ----------
  if (result) {
    return (
      <ResultView
        result={result}
        homeHref={homeHref}
        homeLabel={homeLabel}
        onRestart={restart}
        onRevise={(id) => {
          stopSpeaking();
          setSession(reviseAnswer(tree, session, id));
        }}
      />
    );
  }

  // ---------- Layar: Pertanyaan Adaptif (Frame 08a, 08b, 08c) ----------
  if (!node) return null;
  const prog = progress(tree, session);
  const progressPercent = Math.min(100, Math.round((prog.position / Math.max(prog.atMost, 1)) * 100));

  return (
    <section aria-labelledby="pertanyaan" className="space-y-6 max-w-md mx-auto py-2 text-ink">
      {/* Baris Progress & Topik */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm font-bold text-ink-soft">
          <span className="uppercase tracking-wider text-sogan font-serif font-bold">
            {node.topic}
          </span>
          <span>
            Pertanyaan {prog.position} dari {prog.atMost}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-line/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Judul Pertanyaan Besar */}
      <div className="space-y-2">
        <h1
          id="pertanyaan"
          ref={headingRef}
          tabIndex={-1}
          className="font-serif text-3xl md:text-4xl font-bold text-ink leading-tight"
        >
          {node.prompt}
        </h1>
        {node.hint && <p className="text-base text-ink-soft leading-normal">{node.hint}</p>}
      </div>

      {/* State Konfirmasi Suara (Frame 08b) */}
      {pending ? (
        <Card className="p-6 border-2 border-primary bg-[#F9F5EC] rounded-2xl space-y-4" role="alert">
          {pending.kind === "confirm" ? (
            <>
              <div className="space-y-1">
                <span className="text-sm font-bold text-ink-soft">Suara terdeteksi:</span>
                <p className="text-xl font-bold text-ink">
                  &ldquo;{pending.heard}&rdquo;
                </p>
                <p className="text-lg text-ink-soft pt-1">
                  Jawaban yang dipilih: <strong className="text-primary text-xl">{pending.label}</strong>. Apakah benar?
                </p>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <Button
                  type="button"
                  size="senior"
                  onClick={() => choose(pending.optionId)}
                  className="w-full text-xl font-bold rounded-xl"
                >
                  ✓ Benar, Lanjutkan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => setPending(null)}
                  className="w-full text-base font-bold text-ink-soft"
                >
                  Bukan, Saya Ulangi
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg text-ink font-bold leading-normal">
                {pending.heard ? <>Saya mendengar: &ldquo;{pending.heard}&rdquo;. </> : null}
                Maaf, suara belum jelas. Silakan ulangi ucapan atau tekan salah satu tombol di bawah.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPending(null)}
                className="w-full font-bold text-base"
              >
                Pilih dengan Tombol
              </Button>
            </>
          )}
        </Card>
      ) : node.kind === "choice" ? (
        /* Opsi Tombol Jawaban Besar (Frame 08a) */
        <div className="space-y-3" role="group" aria-label="Pilihan jawaban">
          {(node as ChoiceNode).options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => choose(o.id)}
              className="w-full min-h-[3.75rem] px-6 py-4 rounded-2xl border-2 border-line bg-surface text-ink text-left font-bold text-xl hover:border-primary active:border-primary hover:bg-[#F9F5EC] active:bg-[#F9F5EC] transition-all flex items-center justify-between group shadow-none focus-visible:ring-4 focus-visible:ring-focus focus-visible:outline-none"
            >
              <span>{o.label}</span>
              <span className="w-8 h-8 rounded-full border border-line flex items-center justify-center text-ink-soft group-hover:border-primary group-hover:text-primary transition-colors text-base">
                ➔
              </span>
            </button>
          ))}
        </div>
      ) : (
        /* Isian Teks Obat Rutin (Frame 08c) */
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveText(textValue);
          }}
        >
          <div className="space-y-2">
            <label htmlFor="jawaban-teks" className="block text-xl font-bold text-ink">
              Nama obat yang diminum
            </label>
            <input
              id="jawaban-teks"
              type="text"
              value={textValue}
              maxLength={(node as TextNode).maxLength}
              autoComplete="off"
              placeholder="contoh: Amlodipine atau Obat tensi"
              onChange={(e) => setTextValue(e.target.value)}
              className="w-full min-h-[3.75rem] px-5 text-xl rounded-xl border-2 border-line bg-surface text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-focus font-sans"
            />
          </div>

          <Button
            type="submit"
            size="senior"
            disabled={textValue.trim() === ""}
            className="w-full text-xl font-bold rounded-2xl"
          >
            Simpan Jawaban
          </Button>

          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => saveText(null)}
            className="w-full text-base font-bold text-ink-soft"
          >
            {(node as TextNode).unknownLabel}
          </Button>
        </form>
      )}

      {notice && (
        <div className="p-3.5 bg-paper rounded-xl border border-line text-sm text-ink-soft" role="status">
          {notice}
        </div>
      )}

      {/* Toolbar Alat Bantu: Suara & Koreksi */}
      <div className="pt-2 border-t border-line/60 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={repeat}
          className="font-bold text-sm h-11"
        >
          🔊 Ulangi
        </Button>

        {tts && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={slow}
            onClick={() => setSlow(!slow)}
            className={`font-bold text-sm h-11 ${slow ? "border-primary bg-primary/10 text-primary" : ""}`}
          >
            🐢 Lebih Pelan: {slow ? "Ya" : "Tidak"}
          </Button>
        )}

        {stt && mode === "mandiri" && (
          <Button
            type="button"
            variant={listening ? "primary" : "outline"}
            size="sm"
            onClick={listen}
            disabled={listening}
            className="col-span-2 font-bold text-base h-12 flex items-center justify-center gap-2"
          >
            <span>🎙️</span>
            <span>{listening ? "Mendengarkan ucapan..." : "Jawab dengan Suara"}</span>
          </Button>
        )}

        {session.answers.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              stopListening();
              setPending(null);
              setNotice(null);
              setSession(undoLast(tree, session));
            }}
            className="col-span-2 font-bold text-sm text-ink-soft hover:text-ink h-10"
          >
            ↩️ Ubah Jawaban Sebelumnya
          </Button>
        )}
      </div>
    </section>
  );
}
