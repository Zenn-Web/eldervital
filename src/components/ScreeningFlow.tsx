"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  answerChoice,
  answerText,
  currentNode,
  evaluate,
  matchSpokenAnswer,
  progress,
  reviseAnswer,
  startSession,
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
import ResultView from "./ResultView";

type Pending =
  | { kind: "confirm"; optionId: string; label: string; heard: string }
  | { kind: "retry"; heard: string };

interface Props {
  mode: Mode;
  homeHref: string;
  homeLabel: string;
  /**
   * Dipanggil sekali setiap pemeriksaan mencapai akhir (selesai atau terhenti tanda bahaya).
   * Di sinilah hasil nanti disimpan ke Supabase.
   */
  onFinish?: (session: Session, result: ScreeningResult) => void;
}

const noopSubscribe = () => () => {};

export default function ScreeningFlow({ mode, homeHref, homeLabel, onFinish }: Props) {
  const source: Source = mode === "caregiver" ? "caregiver" : "lansia";

  const [session, setSession] = useState<Session | null>(null);
  const [presence, setPresence] = useState(false); // caregiver: lansia ada di dekat
  const [voiceOn, setVoiceOn] = useState(mode === "mandiri");
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

  // Bacakan pertanyaan setiap kali pertanyaan berganti (atau setelah "Bukan, ulangi").
  useEffect(() => {
    if (!nodeId || !voiceOn || !tts || pending) return;
    const n = tree.nodes[nodeId];
    speak(n.prompt, { slow });
    return () => stopSpeaking();
  }, [nodeId, voiceOn, tts, slow, pending]);

  // Bacakan konfirmasi jawaban suara.
  useEffect(() => {
    if (!pending || !voiceOn || !tts) return;
    const text =
      pending.kind === "confirm"
        ? `Saya mendengar ${pending.heard}. Jawabannya ${pending.label}. Apakah benar?`
        : "Maaf, saya belum paham. Silakan ulangi, atau pilih salah satu tombol.";
    speak(text, { slow });
    return () => stopSpeaking();
  }, [pending, voiceOn, tts, slow]);

  // Pindahkan fokus ke judul setiap layar baru (membantu pembaca layar dan papan ketik).
  const atIntro = session === null;
  useEffect(() => {
    headingRef.current?.focus();
  }, [nodeId, result, atIntro]);

  // Hentikan suara dan mikrofon saat halaman ditinggalkan.
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
    if (next.currentId === null) onFinish?.(next, evaluate(tree, next));
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
          // Isian teks: tampilkan di kolom agar bisa diperiksa dan diperbaiki sebelum disimpan.
          setTextValue(transcript);
          setNotice("Periksa tulisan di kolom. Perbaiki bila keliru, lalu tekan Simpan jawaban.");
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

  // ---------- Layar: pengantar ----------
  if (!session) {
    const needsPresence = mode === "caregiver";
    return (
      <div className="stack-lg">
        <section>
          <h1 ref={headingRef} tabIndex={-1}>
            {mode === "mandiri" ? "Pemeriksaan singkat" : "Pemeriksaan bersama caregiver"}
          </h1>
          {mode === "mandiri" ? (
            <p>
              Aplikasi akan menanyakan beberapa hal, satu per satu. Anda bisa menjawab dengan
              tombol atau dengan suara. Pertanyaan bisa diulang kapan saja.
            </p>
          ) : (
            <p>
              Bacakan setiap pertanyaan kepada lansia, atau tunjukkan layar ini. Catat jawaban
              yang benar-benar diberikan lansia. Jangan menebak. Jika lansia belum bisa
              menjawab, pilih &ldquo;Saya tidak yakin&rdquo;.
            </p>
          )}
          <p>
            <strong>Jika Anda merasa sangat tidak sehat atau butuh pertolongan sekarang, hubungi 112
            atau 119.</strong> Jangan menunggu pemeriksaan ini.
          </p>
        </section>
        {needsPresence && (
          <div className="check">
            <input
              id="hadir"
              type="checkbox"
              checked={presence}
              onChange={(e) => setPresence(e.target.checked)}
            />
            <label htmlFor="hadir">
              Lansia sedang bersama saya dan bisa menjawab langsung. Saya tidak akan mengisi
              berdasarkan perkiraan.
            </label>
          </div>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={begin}
          disabled={needsPresence && !presence}
        >
          Mulai pemeriksaan
        </button>
      </div>
    );
  }

  // ---------- Layar: hasil ----------
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

  // ---------- Layar: pertanyaan ----------
  if (!node) return null; // tidak seharusnya terjadi
  const prog = progress(tree, session);

  return (
    <section aria-labelledby="pertanyaan">
      <p className="meta">
        Pertanyaan {prog.position} dari paling banyak {prog.atMost} &middot; {node.topic}
      </p>
      <h1 id="pertanyaan" ref={headingRef} tabIndex={-1}>
        {node.prompt}
      </h1>
      {node.hint && <p className="hint">{node.hint}</p>}

      {pending ? (
        <div className="panel stack" role="alert">
          {pending.kind === "confirm" ? (
            <>
              <p>
                Saya mendengar: &ldquo;{pending.heard}&rdquo;.
                <br />
                Jawabannya: <strong>{pending.label}</strong>. Apakah benar?
              </p>
              <button type="button" className="btn btn-primary" onClick={() => choose(pending.optionId)}>
                Benar, lanjut
              </button>
              <button type="button" className="btn" onClick={() => setPending(null)}>
                Bukan, saya ulangi
              </button>
            </>
          ) : (
            <>
              <p>
                {pending.heard ? <>Saya mendengar: &ldquo;{pending.heard}&rdquo;. </> : null}
                Maaf, saya belum paham. Silakan ulangi, atau pilih salah satu tombol.
              </p>
              <button type="button" className="btn" onClick={() => setPending(null)}>
                Kembali ke pilihan
              </button>
            </>
          )}
        </div>
      ) : node.kind === "choice" ? (
        <div className="stack" role="group" aria-label="Pilihan jawaban">
          {(node as ChoiceNode).options.map((o) => (
            <button key={o.id} type="button" className="btn btn-choice" onClick={() => choose(o.id)}>
              {o.label}
            </button>
          ))}
        </div>
      ) : (
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            saveText(textValue);
          }}
        >
          <div className="field">
            <label htmlFor="jawaban-teks">Nama obat</label>
            <input
              id="jawaban-teks"
              type="text"
              value={textValue}
              maxLength={(node as TextNode).maxLength}
              autoComplete="off"
              onChange={(e) => setTextValue(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={textValue.trim() === ""}>
            Simpan jawaban
          </button>
          <button type="button" className="btn" onClick={() => saveText(null)}>
            {(node as TextNode).unknownLabel}
          </button>
        </form>
      )}

      {notice && (
        <p className="hint" role="status" style={{ marginTop: "var(--s4)" }}>
          {notice}
        </p>
      )}

      <div className="tools">
        <button type="button" className="btn btn-tool" onClick={repeat}>
          Ulangi pertanyaan
        </button>
        {tts && (
          <>
            <button
              type="button"
              className="btn btn-tool"
              aria-pressed={voiceOn}
              onClick={() => {
                if (voiceOn) stopSpeaking();
                setVoiceOn(!voiceOn);
              }}
            >
              Suara: {voiceOn ? "hidup" : "mati"}
            </button>
            <button
              type="button"
              className="btn btn-tool"
              aria-pressed={slow}
              onClick={() => setSlow(!slow)}
            >
              Suara pelan: {slow ? "ya" : "tidak"}
            </button>
          </>
        )}
        {stt && mode === "mandiri" && (
          <button type="button" className="btn btn-tool" onClick={listen} disabled={listening}>
            {listening ? "Mendengarkan..." : "Jawab dengan suara"}
          </button>
        )}
        {session.answers.length > 0 && (
          <button
            type="button"
            className="btn btn-tool"
            onClick={() => {
              stopListening();
              setPending(null);
              setNotice(null);
              setSession(undoLast(tree, session));
            }}
          >
            Ubah jawaban sebelumnya
          </button>
        )}
      </div>

      {stt && mode === "mandiri" && (
        <p className="small">
          Jawaban suara diproses oleh layanan pengenal suara milik browser dan bisa memerlukan
          internet. Anda tetap selalu bisa menjawab dengan tombol.
        </p>
      )}
    </section>
  );
}
