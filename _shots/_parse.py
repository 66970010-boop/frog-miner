import sys, json
s = sys.stdin.read()
start = s.find('{')
data = json.loads(s[start:])
d = data['shots']['desktop']
print('consoleErrors  =', json.dumps(d.get('consoleErrors'), ensure_ascii=False))
print('consoleWarnings=', json.dumps(d.get('consoleWarnings'), ensure_ascii=False))
print('resourceErrors =', json.dumps(d.get('resourceErrors'), ensure_ascii=False))
print('horizontalOverflow=', json.dumps(d.get('horizontalOverflow'), ensure_ascii=False))
