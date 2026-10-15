
import { errorMessage } from "./errors";
import {describe, expect, it} from "vitest";


describe("errorMessage", () => {
  it("memetakan kode galat Auth ke Bahasa Indonesia", () => {
    expect(errorMessage({ code: "invalid_credentials", message: "Invalid login credentials" })).toBe(
      "Email atau password salah.",
    );
  });

  it("merapikan pesan dari fungsi database kita", () => {
    expect(errorMessage({ code: "P0001", message: "token tidak valid atau sudah kedaluwarsa" })).toBe(
      "Token tidak valid atau sudah kedaluwarsa.",
    );
  });

  it("galat jaringan menjadi pesan koneksi", () => {
    expect(errorMessage(new TypeError("Failed to fetch"))).toMatch(/koneksi internet/);
  });

  it("pesan berbahasa Inggris yang tidak dikenal tidak ditampilkan mentah", () => {
    expect(errorMessage({ message: "duplicate key value violates unique constraint" })).toBe(
      "Terjadi kesalahan. Coba lagi.",
    );
  });
});