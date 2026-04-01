export default async function handler(req, res) {
  // 1. Cargamos las variables de entorno de Vercel
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;

  const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

  try {
    // 2. Pedimos un Access Token nuevo usando el Refresh Token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
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

    const tokenData = await tokenResponse.json();

    // 3. Pedimos a Spotify la canción que suena ahora
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    // --- MANEJO DE ESTADOS DE SPOTIFY ---
    if (response.status === 204) {
      return res.status(200).json({ isPlaying: false, message: "Nada reproduciendo" });
    }

    if (response.status === 429) {
      return res.status(200).json({ isPlaying: false, error: "Rate Limit: Spotify te bloqueó temporalmente" });
    }

    const song = await response.json();

    // 4. Devolvemos solo lo que necesitamos para el overlay
    return res.status(200).json({
      isPlaying: song.is_playing,
      title: song.item.name,
      artist: song.item.artists.map((_artist) => _artist.name).join(', '),
      albumImageUrl: song.item.album.images[0].url,
      songUrl: song.item.external_urls.spotify
    });

  } catch (error) {
    return res.status(500).json({ error: "Error en el servidor", details: error.message });
  }
}
