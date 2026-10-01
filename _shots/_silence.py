import miniaudio
from array import array

path = r"C:\Users\nblffnb123\Doubao\chats\2026-09-21\new-chat-1\frog-game\assets\birthday-music.mp3"
dec = miniaudio.decode_file(path, output_format=miniaudio.SampleFormat.SIGNED16, nchannels=1)
a = array('h')
a.frombytes(bytes(dec.samples))
sr = dec.sample_rate
total = len(a)
dur = total / sr
print("sr=%d total=%d dur=%.3fs" % (sr, total, dur))

win = int(0.05 * sr)
peak_thresh = 40
first_non_silent = None
last_non_silent = None
start = 0
while start < total:
    seg = a[start:start+win]
    if seg:
        peak = max(abs(x) for x in seg)
        if peak >= peak_thresh:
            if first_non_silent is None:
                first_non_silent = start
            last_non_silent = start + len(seg)
    start += win
print("first_non_silent=%s last_non_silent=%s" % (first_non_silent, last_non_silent))
if first_non_silent is not None:
    lead = first_non_silent / sr
    trail = (total - 1 - last_non_silent) / sr
    print("leading_silence=%.2fs" % lead)
    print("trailing_silence=%.2fs" % trail)
else:
    print("no non-silent found")
