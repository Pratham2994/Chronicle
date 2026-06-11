import requests

res = requests.get('https://itunes.apple.com/search?term=ariana+grande&entity=musicArtist&limit=1')
data = res.json()
if data['resultCount'] > 0:
    print("Genre:", data['results'][0].get('primaryGenreName'))
else:
    print("No results")

res2 = requests.get('https://itunes.apple.com/search?term=martin+garrix&entity=musicArtist&limit=1')
data2 = res2.json()
if data2['resultCount'] > 0:
    print("Genre 2:", data2['results'][0].get('primaryGenreName'))
