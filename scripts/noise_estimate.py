"""Estimate a hotel's noise complaint rate and the chance it exceeds a threshold.

Usage: uv run --with numpy,pandas,scipy python -I noise_estimate.py PARAMS_JSON REVIEWS_CSV [--now YYYY-MM-DD] [--threshold RATE]

REVIEWS_CSV has one row per Booking.com review with text, with columns date
(YYYY-MM-DD) and label: C (noise complaint), M (noise audible but not
bothersome), Q (says the place was quiet or the guest slept well) or N (nothing
about noise). Label every review with text, not only those that mention noise.
PARAMS_JSON is params-booking.json, fitted on the 100 newest reviews of 39
random London hotels rated 8+ (18 Oct 2026). The threshold defaults to the one
in PARAMS_JSON: 7.5%, the 55th percentile of those hotels.
"""
import argparse
import json
from datetime import date

import numpy as np
import pandas as pd
from scipy.stats import beta

ap = argparse.ArgumentParser()
ap.add_argument("params")
ap.add_argument("reviews")
ap.add_argument("--now", default=date.today().isoformat())
ap.add_argument("--threshold", type=float)
a = ap.parse_args()

p = json.load(open(a.params))
t = p["threshold"] if a.threshold is None else a.threshold
rev = pd.read_csv(a.reviews)
assert {"date", "label"} <= set(rev.columns), "need columns date,label"
assert rev.label.isin(list("CMQN")).all(), "labels must be C, M, Q or N"
age = (pd.Timestamp(a.now) - pd.to_datetime(rev.date)).dt.days.clip(lower=0) / 365.25
w = 0.5 ** (age / p["half_life_years"])
n, c, q = w.sum(), (w * rev.label.eq("C")).sum(), (w * rev.label.eq("Q")).sum()
qs = q / n if n > 0 else p["quiet_centre"]
base = 1 / (1 + np.exp(-(p["b0"] + p["bq"] * (qs - p["quiet_centre"]))))
al, be = p["a"] * base + c, p["a"] * (1 - base) + n - c
lo, hi = beta.ppf([0.05, 0.95], al, be)
counts = rev.label.value_counts().reindex(list("CMQN"), fill_value=0)
print(f"estimator {p['version']}; reviews {len(rev)} (weighted {n:.1f}): "
      + ", ".join(f"{k} {v}" for k, v in counts.items()))
print(f"expected complaint rate {al / (al + be):.1%} (90% range {lo:.1%}–{hi:.1%}); "
      f"prior {base:.1%} from quiet share {qs:.0%}")
print(f"chance the rate is above {t:.1%}: {beta.sf(t, al, be):.0%}")
