"""
Knacktor trace runner (D9 — hybrid trace model).

PURE CAPTURE. This script runs an author's real Python solution under
sys.settrace and emits a raw "skeleton": one record per executed source line,
with a JSON-safe snapshot of the locals at that moment, plus the call stack,
the function's return value, and the set of executable source lines.

It contains NO visual/narration logic — the TypeScript pipeline
(lib/tracer/pipeline.ts) turns this skeleton into the final Trace via the
bundle's mapping.json / narration.json.

Usage:
    python tracer/run.py <bundleDir> <approachId> <presetId>

Output (stdout): a single JSON object
    { "steps": [ { "lineNo": int, "rawVars": {..}, "callStack": [..] } ],
      "finalResult": <json>, "executableLines": [int,...],
      "sourceLineCount": int, "entry": "Solution.fourSum" }

On error: prints { "error": "..." } to stdout and exits non-zero.
"""
import sys
import os
import json
import dis


def jsonify(value, _depth=0):
    """Recursively convert a Python value into a JSON-safe structure."""
    if _depth > 6:
        return str(value)
    if value is None or isinstance(value, (bool, int, str)):
        return value
    if isinstance(value, float):
        # JSON has no NaN/Infinity — stringify those
        if value != value or value in (float("inf"), float("-inf")):
            return str(value)
        return value
    if isinstance(value, (list, tuple)):
        return [jsonify(v, _depth + 1) for v in value]
    if isinstance(value, set):
        return [jsonify(v, _depth + 1) for v in sorted(value, key=repr)]
    if isinstance(value, dict):
        return {str(k): jsonify(v, _depth + 1) for k, v in value.items()}
    return str(value)


def snapshot_locals(frame):
    """JSON-safe deep copy of a frame's locals, dropping `self`."""
    out = {}
    for name, val in frame.f_locals.items():
        if name == "self":
            continue
        out[name] = jsonify(val)
    return out


def executable_lines(code, acc):
    """Union of line numbers that carry bytecode (what settrace can hit),
    recursing into nested code objects. Excludes the def/class header line."""
    first = code.co_firstlineno
    for _, line in dis.findlinestarts(code):
        if line is not None and line != first:
            acc.add(line)
    for const in code.co_consts:
        if isinstance(const, type(code)):
            executable_lines(const, acc)
    return acc


def main():
    if len(sys.argv) != 4:
        print(json.dumps({"error": "usage: run.py <bundleDir> <approachId> <presetId>"}))
        sys.exit(1)

    bundle_dir, approach_id, preset_id = sys.argv[1], sys.argv[2], sys.argv[3]
    approach_dir = os.path.join(bundle_dir, "approaches", approach_id)
    sol_path = os.path.join(approach_dir, "solution.py")

    try:
        with open(sol_path, "r", encoding="utf-8") as f:
            source = f.read()
        with open(os.path.join(approach_dir, "approach.json"), "r", encoding="utf-8") as f:
            approach = json.load(f)
        with open(os.path.join(bundle_dir, "presets.json"), "r", encoding="utf-8") as f:
            presets = json.load(f)
        with open(os.path.join(bundle_dir, "problem.json"), "r", encoding="utf-8") as f:
            problem = json.load(f)
    except Exception as e:  # noqa: BLE001
        print(json.dumps({"error": f"cannot read bundle: {e}"}))
        sys.exit(1)

    preset = next((p for p in presets if p.get("id") == preset_id), None)
    if preset is None:
        print(json.dumps({"error": f"preset '{preset_id}' not found"}))
        sys.exit(1)
    value = preset.get("value", {})
    entry = approach.get("entrypoint", "")
    max_steps = (problem.get("inputConstraints") or {}).get("maxSteps", 2000)

    # Compile with a stable filename so we only trace frames from this solution.
    sol_file = os.path.abspath(sol_path)
    try:
        code = compile(source, sol_file, "exec")
    except SyntaxError as e:
        print(json.dumps({"error": f"solution.py syntax error: {e}"}))
        sys.exit(1)

    ns = {}
    try:
        exec(code, ns)  # noqa: S102 — author-trusted code at build time
    except Exception as e:  # noqa: BLE001
        print(json.dumps({"error": f"solution.py failed to load: {e}"}))
        sys.exit(1)

    # Resolve the entrypoint "Class.method" or "function".
    if "." in entry:
        cls_name, meth_name = entry.split(".", 1)
        cls = ns.get(cls_name)
        if cls is None:
            print(json.dumps({"error": f"entrypoint class '{cls_name}' not found"}))
            sys.exit(1)
        target = getattr(cls(), meth_name)
        target_code = target.__func__.__code__
    else:
        target = ns.get(entry)
        if target is None:
            print(json.dumps({"error": f"entrypoint '{entry}' not found"}))
            sys.exit(1)
        target_code = target.__code__

    # Collect code objects for the entrypoint class (e.g. Solution) and all nested
    # code objects (comprehensions, nested functions). Helper classes defined in the
    # same file (e.g. ListNode) are intentionally excluded — they are implementation
    # scaffolding, not the algorithm, and should not appear as trace steps.
    target_class = cls_name if "." in entry else None

    def _collect_codes(code_obj, acc):
        acc.append(code_obj)
        for const in code_obj.co_consts:
            if isinstance(const, type(code_obj)):
                _collect_codes(const, acc)

    allowed_codes = []
    if target_class:
        cls_obj = ns.get(target_class)
        if cls_obj:
            for attr_val in vars(cls_obj).values():
                func = None
                if callable(attr_val) and hasattr(attr_val, '__code__'):
                    func = attr_val
                elif isinstance(attr_val, (staticmethod, classmethod)):
                    func = attr_val.__func__
                if func is not None:
                    _collect_codes(func.__code__, allowed_codes)
    if not allowed_codes:
        _collect_codes(target_code, allowed_codes)

    allowed_code_id_set = {id(c) for c in allowed_codes}
    exec_lines = sorted({
        line
        for code_obj in allowed_codes
        for _, line in dis.findlinestarts(code_obj)
        if line is not None and line != code_obj.co_firstlineno
    })

    steps = []
    call_stack = []  # list of {label}
    overflow = {"hit": False}

    def make_label(frame):
        return frame.f_code.co_name

    def trace(frame, event, arg):
        # Only trace frames defined in the solution file.
        if frame.f_code.co_filename != sol_file:
            return None
        # Skip helper class frames (e.g. ListNode.__init__) — trace only the
        # entrypoint class (Solution) and its nested code objects.
        if id(frame.f_code) not in allowed_code_id_set:
            return None
        if event == "call":
            call_stack.append({"label": make_label(frame)})
            return trace
        if event == "line":
            if len(steps) >= max_steps:
                overflow["hit"] = True
                raise _StepCap()
            steps.append({
                "lineNo": frame.f_lineno,
                "rawVars": snapshot_locals(frame),
                "callStack": [dict(c) for c in call_stack],
            })
            return trace
        if event == "return":
            if call_stack:
                call_stack.pop()
            return trace
        return trace

    class _StepCap(Exception):
        pass

    final_result = None
    try:
        sys.settrace(trace)
        final_result = target(**value)
    except _StepCap:
        pass
    except Exception as e:  # noqa: BLE001
        sys.settrace(None)
        print(json.dumps({"error": f"solution raised at runtime: {e}"}))
        sys.exit(1)
    finally:
        sys.settrace(None)

    if overflow["hit"]:
        print(json.dumps({
            "error": f"step cap exceeded ({max_steps}) for {approach_id}:{preset_id} "
                     f"— input too large or non-terminating"
        }))
        sys.exit(1)

    print(json.dumps({
        "steps": steps,
        "finalResult": jsonify(final_result),
        "executableLines": exec_lines,
        "sourceLineCount": len(source.splitlines()),
        "entry": entry,
    }))


if __name__ == "__main__":
    main()
