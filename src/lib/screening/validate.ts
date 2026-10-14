import type { ChoiceNode, ScreeningTree } from "./types";

/**
 * Memeriksa struktur pohon. Mengembalikan daftar masalah (kosong = valid).
 * Dijalankan oleh tes sehingga pohon yang rusak tidak bisa ter-deploy diam-diam.
 */
export function validateTree(tree: ScreeningTree): string[] {
  const errors: string[] = [];
  const ids = Object.keys(tree.nodes);

  if (!tree.nodes[tree.start]) errors.push(`start tidak ada: ${tree.start}`);

  const nextOf = (id: string): (string | null)[] => {
    const node = tree.nodes[id];
    if (!node) return [];
    return node.kind === "text" ? [node.next] : Object.values(node.next);
  };

  for (const id of ids) {
    const node = tree.nodes[id];
    if (node.id !== id) errors.push(`id node tidak cocok dengan kuncinya: ${id}`);

    if (node.kind === "choice") {
      const optionIds = node.options.map((o) => o.id);
      if (new Set(optionIds).size !== optionIds.length) errors.push(`${id}: id pilihan ganda`);
      if (node.options.length < 2) errors.push(`${id}: kurang dari 2 pilihan`);
      for (const opt of node.options) {
        if (!(opt.id in node.next)) errors.push(`${id}: pilihan ${opt.id} tidak punya langkah berikutnya`);
      }
      for (const key of Object.keys(node.next)) {
        if (!optionIds.includes(key)) errors.push(`${id}: next merujuk pilihan yang tidak ada: ${key}`);
      }
      if (node.critical && !node.options.some((o) => o.unknown)) {
        errors.push(`${id}: pertanyaan penting harus punya pilihan "tidak tahu"`);
      }
    }

    for (const n of nextOf(id)) {
      if (n !== null && !tree.nodes[n]) errors.push(`${id}: langkah berikutnya tidak ada: ${n}`);
    }
  }

  for (const rule of tree.rules) {
    const node = tree.nodes[rule.when.node];
    if (!node) {
      errors.push(`aturan ${rule.id}: node tidak ada: ${rule.when.node}`);
      continue;
    }
    if (node.kind !== "choice") {
      errors.push(`aturan ${rule.id}: hanya node pilihan yang bisa dipakai aturan`);
      continue;
    }
    const optionIds = (node as ChoiceNode).options.map((o) => o.id);
    for (const v of rule.when.anyOf) {
      if (!optionIds.includes(v)) errors.push(`aturan ${rule.id}: pilihan tidak ada di ${node.id}: ${v}`);
    }
  }
  const ruleIds = tree.rules.map((r) => r.id);
  if (new Set(ruleIds).size !== ruleIds.length) errors.push("id aturan ganda");

  for (const req of tree.requiredNodes) {
    if (!tree.nodes[req]) errors.push(`requiredNodes tidak ada: ${req}`);
  }

  // Putaran dan keterjangkauan.
  const color = new Map<string, 0 | 1 | 2>(); // 1 = sedang dikunjungi, 2 = selesai
  let cycle = false;
  const visit = (id: string) => {
    if (!tree.nodes[id]) return;
    const state = color.get(id);
    if (state === 1) {
      cycle = true;
      return;
    }
    if (state === 2) return;
    color.set(id, 1);
    for (const n of nextOf(id)) if (n !== null) visit(n);
    color.set(id, 2);
  };
  visit(tree.start);
  if (cycle) errors.push("pohon memiliki putaran");
  for (const id of ids) if (!color.has(id)) errors.push(`node tidak terjangkau dari start: ${id}`);

  // Setiap jalur yang selesai (tanpa terhenti tanda bahaya) harus melewati requiredNodes.
  if (!cycle && errors.length === 0) {
    const MAX_PATHS = 20000;
    let paths = 0;
    const redOptions = new Set(
      tree.rules.filter((r) => r.level === "red").flatMap((r) => r.when.anyOf.map((v) => `${r.when.node}/${v}`)),
    );
    const walk = (id: string, visited: string[]) => {
      if (paths > MAX_PATHS) return;
      const node = tree.nodes[id];
      const branches: { key: string; next: string | null }[] =
        node.kind === "text"
          ? [{ key: `${id}/*`, next: node.next }]
          : Object.entries(node.next).map(([opt, next]) => ({ key: `${id}/${opt}`, next }));
      for (const b of branches) {
        if (redOptions.has(b.key)) continue; // berhenti karena tanda bahaya, boleh melewatkan sisanya
        const path = [...visited, id];
        if (b.next === null) {
          paths++;
          for (const req of tree.requiredNodes) {
            if (!path.includes(req)) errors.push(`jalur selesai tanpa melewati ${req}: ${path.join(" > ")}`);
          }
        } else {
          walk(b.next, path);
        }
      }
    };
    walk(tree.start, []);
    if (paths > MAX_PATHS) errors.push("terlalu banyak jalur untuk diperiksa");
  }

  return [...new Set(errors)];
}
