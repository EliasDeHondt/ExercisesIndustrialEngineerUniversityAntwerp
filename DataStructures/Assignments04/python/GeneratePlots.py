############################
# @author EliasDH Team     #
# @see https://eliasdh.com #
# @since 01/01/2025        #
############################
#!/usr/bin/env python3
"""
Generate performance graphs automatically by running the C++ Measure executable.
Outputs:
- measurements.csv
- insert.png
- lookup.png
"""
from __future__ import annotations
import csv
import os
import subprocess
import sys
from typing import Dict, List, Tuple

HERE = os.path.abspath(os.path.dirname(__file__))
BUILD_DIR = os.path.join(HERE, "build", "Release")
MEASURE_EXE_CANDIDATES = [
    os.path.join(BUILD_DIR, "Measure.exe"),
    os.path.join(HERE, "build", "Measure"),
    os.path.join(HERE, "Measure"),
]
CSV_PATH = os.path.join(HERE, "measurements.csv")
INSERT_PNG = os.path.join(HERE, "insert.png")
LOOKUP_PNG = os.path.join(HERE, "lookup.png")


def find_measure_exe() -> str:
    for p in MEASURE_EXE_CANDIDATES:
        if os.path.isfile(p):
            return p
    raise FileNotFoundError(
        "Measure executable niet gevonden. Build eerst (Release) zodat Measure.exe in build/Release staat."
    )


def run_measure(seed: int = 42) -> None:
    exe = find_measure_exe()
    print(f"[info] Run: {exe} {seed}")
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        proc = subprocess.run([exe, str(seed)], stdout=f, stderr=subprocess.PIPE, text=True)
        if proc.returncode != 0:
            print(proc.stderr)
            raise RuntimeError("Measure.exe faalde")


def load_csv() -> List[Dict[str, str]]:
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        rdr = csv.DictReader(f)
        return list(rdr)


def plot(results: List[Dict[str, str]]) -> None:
    import matplotlib
    matplotlib.use("Agg")  # headless
    import matplotlib.pyplot as plt

    def series(operation: str, type_: str) -> Tuple[List[int], List[int]]:
        xs, ys = [], []
        for row in results:
            if row["operation"] == operation and row["type"] == type_:
                xs.append(int(row["n"]))
                ys.append(int(row["milliseconds"]))
        return xs, ys

    # Insert plot
    fig, ax = plt.subplots(figsize=(8, 5))
    for t, color in [("MyString1", "tab:blue"), ("MyString2", "tab:orange")]:
        x, y = series("insert", t)
        ax.plot(x, y, marker="o", label=t, color=color)
    ax.set_title("Insertion Time vs Number of Key-Value Pairs")
    ax.set_xlabel("Number of Key-Value Pairs")
    ax.set_ylabel("Time (ms)")
    ax.grid(True, alpha=0.3)
    ax.legend()
    fig.tight_layout()
    fig.savefig(INSERT_PNG, dpi=150)

    # Lookup plot
    fig, ax = plt.subplots(figsize=(8, 5))
    for t, color in [("MyString1", "tab:blue"), ("MyString2", "tab:orange")]:
        x, y = series("lookup", t)
        ax.plot(x, y, marker="o", label=t, color=color)
    ax.set_title("Lookup Time vs Number of Key-Value Pairs")
    ax.set_xlabel("Number of Key-Value Pairs")
    ax.set_ylabel("Time (ms)")
    ax.grid(True, alpha=0.3)
    ax.legend()
    fig.tight_layout()
    fig.savefig(LOOKUP_PNG, dpi=150)


if __name__ == "__main__":
    seed = 42
    if len(sys.argv) >= 2:
        try:
            seed = int(sys.argv[1])
        except Exception:
            pass

    run_measure(seed)
    data = load_csv()
    print(f"[info] CSV regels: {len(data)} -> {CSV_PATH}")
    plot(data)
    print(f"[ok] Grafieken geschreven: {INSERT_PNG} en {LOOKUP_PNG}")
