import random
import itertools

def repeat_until_length(it, n):
    return itertools.islice(itertools.cycle(it), n)

# - have both best and new songs, enough unique songs to fill each frame
# - have duplicate scores for at least some songs
#   - have better -> worse and worse -> better point ordering for duplicate scores
# - have songs of every chart constant
# - have points from <S, S, SS, SSS, SSS+

# 50 best scores in 35 songs
# 30 new scores in 15 new songs
    
scores_per_range = {
    900000: 10,
    970000: 15,
    990000: 20,
    1000000: 20,
    1007500: 15,
    1010000: 0,
}
assert sum(scores_per_range.values()) == 80

ranges = sorted(scores_per_range.keys())
points = []
for i in range(len(ranges)-1):
    low = ranges[i]
    high = ranges[i+1]
    points.extend(random.randint(low, high) for i in range(scores_per_range[low]))
random.shuffle(points)

songs = [{'id': str(i), "level": level/10, "isNew": False} for i,level in enumerate(
    repeat_until_length(range(120, 150+2, 2), 35)
)]
new_songs = [{'id': str(i+len(songs)), "level": level/10, "isNew": True} for i,level in enumerate(
    repeat_until_length(range(120, 150+2, 2), 15)
)]

# play each song once, and then randomize
songs_played = songs + random.sample(songs, 15) + new_songs + random.sample(new_songs, 15)
random.shuffle(songs_played)

a = []
for i in range(len(songs_played)):
    song = songs_played[i]
    a.append([points[i], song])

import json, pyperclip

builder = [
    '[',
    *['    ' + json.dumps(i) + ',' for i in a],
    ']',
]
string = '\n'.join(builder)
print(string)
pyperclip.copy(string)