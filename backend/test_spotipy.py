import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import os
from dotenv import load_dotenv

load_dotenv()
CLIENT_ID = os.getenv("spotify-client")
CLIENT_SECRET = os.getenv("spotify-secret")
print("ID:", CLIENT_ID)

if not CLIENT_ID:
    print("ID is none!")

try:
    sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(client_id=CLIENT_ID, client_secret=CLIENT_SECRET))
    res = sp.artist('66CXWjxzNUsdJxJ2JdwvnR')
    print("Artist genres:", res.get('genres'))
except Exception as e:
    print("Error:", e)
