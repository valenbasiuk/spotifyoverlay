export default async function handler(req, res) {
  const {
    SPOTIFY_CLIENT_ID: client_id,
    SPOTIFY_CLIENT_SECRET: client_secret,
    SPOTIFY_REFRESH_TOKEN: refresh_token,
  } = process.env;

  const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
  const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
  const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

  // 1. Obtener nuevo access_token
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token,
    }),
  });

  const { access_token } = await response.json();

  // 2. Consultar Spotify
  const nowPlaying = await fetch(NOW_PLAYING_ENDPOINT, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (nowPlaying.status === 204 || nowPlaying.status > 400) {
    return res.status(200).json({ isPlaying: false });
  }

  const song = await nowPlaying.json();
  
  // 3. Responder con los datos limpios
  return res.status(200).json({
    isPlaying: song.is_playing,
    title: song.item.name,
    artist: song.item.artists.map((_artist) => _artist.name).join(', '),
    albumImageUrl: song.item.album.images[0].url,
    url: song.item.external_urls.spotify
  });
}
