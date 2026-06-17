/**
 * Minimal Python tokenizer for display-only syntax highlighting in the code
 * panel. Maps each token to a syntax class (kw/fn/num/str/var/pun/com) that
 * resolves to a --kn-syn-* token. Not a parser — good enough for highlighting
 * the short solutions we display.
 */
export type TokenClass =
  | "kw"
  | "fn"
  | "num"
  | "str"
  | "var"
  | "pun"
  | "com"
  | "txt";

export interface Token {
  t: string;
  c: TokenClass;
}

const KEYWORDS = new Set([
  "def", "return", "if", "elif", "else", "for", "while", "in", "not", "and",
  "or", "is", "None", "True", "False", "break", "continue", "pass", "class",
  "import", "from", "as", "with", "try", "except", "finally", "raise", "lambda",
  "yield", "global", "nonlocal", "del", "assert", "len", "range", "sorted",
  "set", "enumerate", "self",
]);

const BUILTIN_FNS = new Set([
  "len", "range", "sorted", "set", "enumerate", "append", "sort", "add",
  "print", "abs", "min", "max", "sum", "map", "filter", "zip", "int", "str",
]);

const TOKEN_RE =
  /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+\.?\d*\b)|([A-Za-z_]\w*)|(\s+)|([^\sA-Za-z0-9_])/g;

export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  let prevWord: string | null = null;

  while ((m = TOKEN_RE.exec(line)) !== null) {
    const [, comment, str, num, word, ws, punc] = m;
    if (comment !== undefined) {
      tokens.push({ t: comment, c: "com" });
    } else if (str !== undefined) {
      tokens.push({ t: str, c: "str" });
    } else if (num !== undefined) {
      tokens.push({ t: num, c: "num" });
    } else if (word !== undefined) {
      // function call if followed by "("
      const after = line.slice(TOKEN_RE.lastIndex).trimStart();
      const isCall = after.startsWith("(");
      if (KEYWORDS.has(word) && !isCall) {
        tokens.push({ t: word, c: "kw" });
      } else if (isCall || BUILTIN_FNS.has(word)) {
        tokens.push({ t: word, c: prevWord === "def" ? "fn" : "fn" });
      } else {
        tokens.push({ t: word, c: "var" });
      }
      prevWord = word;
    } else if (ws !== undefined) {
      tokens.push({ t: ws, c: "txt" });
    } else if (punc !== undefined) {
      tokens.push({ t: punc, c: "pun" });
    }
    if (m[0].length === 0) TOKEN_RE.lastIndex++; // guard against zero-width
  }
  return tokens;
}

export const SYNTAX_CLASS: Record<TokenClass, string> = {
  kw: "text-kn-syn-kw",
  fn: "text-kn-syn-fn",
  num: "text-kn-syn-num",
  str: "text-kn-syn-str",
  var: "text-kn-syn-var",
  pun: "text-kn-syn-pun",
  com: "text-kn-syn-com",
  txt: "",
};
