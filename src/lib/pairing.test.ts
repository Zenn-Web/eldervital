import { describe, expect, it } from "vitest";
import { extractToken, groupToken, pairingUrl } from "./pairing";

const TOKEN = "0123456789abcdef".repeat(4);

describe("token pairing", () => {
  it("URL di QR memuat token di fragmen, bukan di query", () => {
    const url = pairingUrl("https://eldervital.example", TOKEN);
    expect(url).toBe(`https://eldervital.example/caregiver/hubungkan#t=${TOKEN}`);
    expect(new URL(url).search).toBe("");
  });

  it("mengambil token dari isi QR", () => {
    expect(extractToken(pairingUrl("https://x.test", TOKEN))).toBe(TOKEN);
  });

  it("menerima ketikan manual berkelompok, huruf besar, atau bertanda hubung", () => {
    expect(extractToken(groupToken(TOKEN).toUpperCase())).toBe(TOKEN);
    expect(extractToken(` ${TOKEN.slice(0, 32)}-${TOKEN.slice(32)} `)).toBe(TOKEN);
  });

  it("menolak masukan yang bukan token", () => {
    expect(extractToken("")).toBeNull();
    expect(extractToken(TOKEN.slice(1))).toBeNull();
    expect(extractToken("https://x.test/caregiver/hubungkan#t=abc")).toBeNull();
    expect(extractToken(TOKEN.replace("a", "z"))).toBeNull();
  });
});
