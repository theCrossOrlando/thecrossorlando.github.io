#!/usr/bin/env python
"""Render the episode announcement to WAV with Kokoro. Deterministic: CPU only,
single thread, seeds pinned immediately before generation — on MPS or with
default threading the same text drifts by up to 27% of full scale between runs."""
import sys, random, numpy as np, soundfile as sf, torch
torch.set_num_threads(1)
from kokoro import KPipeline

text, voice, out = sys.argv[1], sys.argv[2], sys.argv[3]
random.seed(0); np.random.seed(0); torch.manual_seed(0)
torch.use_deterministic_algorithms(True, warn_only=True)
pipe = KPipeline(lang_code='a', device='cpu')
random.seed(0); np.random.seed(0); torch.manual_seed(0)
chunks = [a for _, _, a in pipe(text, voice=voice)]
audio = np.concatenate([c.numpy() if hasattr(c, 'numpy') else c for c in chunks])
sf.write(out, audio, 24000)
print(f"{len(audio)/24000:.3f}")
