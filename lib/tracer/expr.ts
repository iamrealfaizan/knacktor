/**
 * Safe expression DSL evaluator for the visual-mapping layer (D9).
 *
 * A tiny, sandboxed expression language — NOT eval/new Function. It powers every
 * `when` / `onlyWhen` / `derived` / `flags` / `keyEvents` / `phaseRules` /
 * narration-variant expression in a problem's mapping.json & narration.json.
 *
 * Grammar (precedence low→high):
 *   ternary  ?:
 *   ||
 *   &&
 *   == !=
 *   < <= > >=
 *   + -
 *   * / %
 *   unary  ! -
 *   primary: number | string | true | false | null | ident | call | (expr)
 *            | member (a.b) | index (a[expr])
 *   call: ident( args )   — only min, max, len, abs
 *
 * Scope: the step's captured vars, their previous-step values as `<name>_prev`,
 * plus `idx` (current cell index), `values` (the valuesFrom array), `phase`, and
 * author `flags`. A referenced name absent this step resolves to `undefined`
 * (comparisons against it are false) — so authors don't need existence guards.
 */

type Node =
  | { t: "num"; v: number }
  | { t: "str"; v: string }
  | { t: "bool"; v: boolean }
  | { t: "null" }
  | { t: "id"; name: string }
  | { t: "member"; obj: Node; prop: string }
  | { t: "index"; obj: Node; index: Node }
  | { t: "call"; name: string; args: Node[] }
  | { t: "unary"; op: string; arg: Node }
  | { t: "bin"; op: string; l: Node; r: Node }
  | { t: "ternary"; c: Node; a: Node; b: Node };

const FUNCS = new Set(["min", "max", "len", "abs"]);

// ── Tokenizer ────────────────────────────────────────────────────────────────
type Tok = { k: string; v?: string };
function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  const isIdStart = (c: string) => /[A-Za-z_]/.test(c);
  const isId = (c: string) => /[A-Za-z0-9_]/.test(c);
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (isIdStart(c)) {
      let j = i + 1;
      while (j < src.length && isId(src[j])) j++;
      toks.push({ k: "id", v: src.slice(i, j) });
      i = j;
      continue;
    }
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] ?? ""))) {
      let j = i + 1;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      toks.push({ k: "num", v: src.slice(i, j) });
      i = j;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      let s = "";
      while (j < src.length && src[j] !== c) { s += src[j]; j++; }
      if (j >= src.length) throw new Error(`unterminated string in expr: ${src}`);
      toks.push({ k: "str", v: s });
      i = j + 1;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (["==", "!=", "<=", ">=", "&&", "||"].includes(two)) {
      toks.push({ k: two });
      i += 2;
      continue;
    }
    if ("+-*/%<>!?:().,[]".includes(c)) {
      toks.push({ k: c });
      i++;
      continue;
    }
    throw new Error(`unexpected char '${c}' in expr: ${src}`);
  }
  toks.push({ k: "eof" });
  return toks;
}

// ── Parser (recursive descent) ─────────────────────────────────────────────────
function parse(src: string): Node {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];
  const eat = (k: string) => {
    if (toks[p].k !== k) throw new Error(`expected '${k}' in expr: ${src}`);
    return toks[p++];
  };

  function parseExpr(): Node { return parseTernary(); }

  function parseTernary(): Node {
    const c = parseOr();
    if (peek().k === "?") {
      next();
      const a = parseExpr();
      eat(":");
      const b = parseExpr();
      return { t: "ternary", c, a, b };
    }
    return c;
  }
  function parseOr(): Node {
    let l = parseAnd();
    while (peek().k === "||") { next(); l = { t: "bin", op: "||", l, r: parseAnd() }; }
    return l;
  }
  function parseAnd(): Node {
    let l = parseEq();
    while (peek().k === "&&") { next(); l = { t: "bin", op: "&&", l, r: parseEq() }; }
    return l;
  }
  function parseEq(): Node {
    let l = parseRel();
    while (peek().k === "==" || peek().k === "!=") {
      const op = next().k;
      l = { t: "bin", op, l, r: parseRel() };
    }
    return l;
  }
  function parseRel(): Node {
    let l = parseAdd();
    while (["<", "<=", ">", ">="].includes(peek().k)) {
      const op = next().k;
      l = { t: "bin", op, l, r: parseAdd() };
    }
    return l;
  }
  function parseAdd(): Node {
    let l = parseMul();
    while (peek().k === "+" || peek().k === "-") {
      const op = next().k;
      l = { t: "bin", op, l, r: parseMul() };
    }
    return l;
  }
  function parseMul(): Node {
    let l = parseUnary();
    while (["*", "/", "%"].includes(peek().k)) {
      const op = next().k;
      l = { t: "bin", op, l, r: parseUnary() };
    }
    return l;
  }
  function parseUnary(): Node {
    if (peek().k === "!" || peek().k === "-") {
      const op = next().k;
      return { t: "unary", op, arg: parseUnary() };
    }
    return parsePostfix();
  }
  function parsePostfix(): Node {
    let node = parsePrimary();
    for (;;) {
      if (peek().k === ".") {
        next();
        const id = eat("id");
        node = { t: "member", obj: node, prop: id.v! };
      } else if (peek().k === "[") {
        next();
        const index = parseExpr();
        eat("]");
        node = { t: "index", obj: node, index };
      } else break;
    }
    return node;
  }
  function parsePrimary(): Node {
    const tk = peek();
    if (tk.k === "num") { next(); return { t: "num", v: Number(tk.v) }; }
    if (tk.k === "str") { next(); return { t: "str", v: tk.v! }; }
    if (tk.k === "(") { next(); const e = parseExpr(); eat(")"); return e; }
    if (tk.k === "id") {
      next();
      const name = tk.v!;
      if (name === "true") return { t: "bool", v: true };
      if (name === "false") return { t: "bool", v: false };
      if (name === "null") return { t: "null" };
      if (peek().k === "(") {
        if (!FUNCS.has(name)) throw new Error(`unknown function '${name}' in expr: ${src}`);
        next();
        const args: Node[] = [];
        if (peek().k !== ")") {
          args.push(parseExpr());
          while (peek().k === ",") { next(); args.push(parseExpr()); }
        }
        eat(")");
        return { t: "call", name, args };
      }
      return { t: "id", name };
    }
    throw new Error(`unexpected token '${tk.k}' in expr: ${src}`);
  }

  const node = parseExpr();
  if (peek().k !== "eof") throw new Error(`trailing tokens in expr: ${src}`);
  return node;
}

// ── Evaluation ───────────────────────────────────────────────────────────────
export type Scope = Record<string, unknown>;

function isNullish(v: unknown): boolean {
  return v === null || v === undefined;
}

function evalNode(n: Node, scope: Scope): unknown {
  switch (n.t) {
    case "num": return n.v;
    case "str": return n.v;
    case "bool": return n.v;
    case "null": return null;
    case "id": return scope[n.name];
    case "member": {
      const o = evalNode(n.obj, scope);
      return isNullish(o) ? undefined : (o as Record<string, unknown>)[n.prop];
    }
    case "index": {
      const o = evalNode(n.obj, scope);
      const k = evalNode(n.index, scope);
      if (isNullish(o)) return undefined;
      return (o as Record<string | number, unknown>)[k as string | number];
    }
    case "call": {
      const a = n.args.map((x) => evalNode(x, scope));
      switch (n.name) {
        case "min": return Math.min(...(a as number[]));
        case "max": return Math.max(...(a as number[]));
        case "abs": return Math.abs(a[0] as number);
        case "len": {
          const v = a[0];
          if (typeof v === "string" || Array.isArray(v)) return v.length;
          return 0;
        }
      }
      return undefined;
    }
    case "unary": {
      const v = evalNode(n.arg, scope);
      return n.op === "!" ? !truthy(v) : -(v as number);
    }
    case "ternary":
      return truthy(evalNode(n.c, scope)) ? evalNode(n.a, scope) : evalNode(n.b, scope);
    case "bin":
      return evalBin(n, scope);
  }
}

function evalBin(n: Extract<Node, { t: "bin" }>, scope: Scope): unknown {
  if (n.op === "&&") return truthy(evalNode(n.l, scope)) ? evalNode(n.r, scope) : evalNode(n.l, scope);
  if (n.op === "||") return truthy(evalNode(n.l, scope)) ? evalNode(n.l, scope) : evalNode(n.r, scope);
  const l = evalNode(n.l, scope);
  const r = evalNode(n.r, scope);
  switch (n.op) {
    case "+": return (l as number) + (r as number);
    case "-": return (l as number) - (r as number);
    case "*": return (l as number) * (r as number);
    case "/": return (l as number) / (r as number);
    case "%": return (l as number) % (r as number);
    case "<": return (l as number) < (r as number);
    case "<=": return (l as number) <= (r as number);
    case ">": return (l as number) > (r as number);
    case ">=": return (l as number) >= (r as number);
    case "==": return eq(l, r);
    case "!=": return !eq(l, r);
  }
  return undefined;
}

// null and undefined are interchangeable; otherwise strict.
function eq(a: unknown, b: unknown): boolean {
  if (isNullish(a) && isNullish(b)) return true;
  if (isNullish(a) || isNullish(b)) return false;
  return a === b;
}

function truthy(v: unknown): boolean {
  return Boolean(v);
}

// ── Public API (with a parse cache) ────────────────────────────────────────────
const cache = new Map<string, Node>();
function compile(src: string): Node {
  let n = cache.get(src);
  if (!n) { n = parse(src); cache.set(src, n); }
  return n;
}

/** Evaluate an expression string against a scope. */
export function evalExpr(src: string, scope: Scope): unknown {
  return evalNode(compile(src), scope);
}

/** Evaluate as a boolean condition. */
export function evalBool(src: string, scope: Scope): boolean {
  return truthy(evalExpr(src, scope));
}

/** Parse-check an expression (throws on syntax error) — used by validators. */
export function checkExpr(src: string): void {
  compile(src);
}
