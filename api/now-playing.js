export default async function handler(req, res) {
  // 1. Extraer variables (Asegurate que en Vercel se llamen EXACTAMENTE así)
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;

  const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

  try {
    // 2. Pedir el Access Token
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
    
    // Si hay error con el token, lo mostramos
    if (tokenData.error) {
      return res.status(200).json({ isPlaying: false, error: "Error de Token", message: tokenData.error });
    }

    // 3. Pedir la canción
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    // Caso 204: Spotify dice que no hay nada activo
    if (response.status === 204) {
      return res.status(200).json({ isPlaying: false, status: "No hay nada sonando (204)" });
    }

    const song = await response.json();

    return res.status(200).json({
      isPlaying: song.is_playing,
      title: song.item.name,
      artist: song.item.artists.map((_artist) => _artist.name).join(', '),
      albumImageUrl: song.item.album.images[0].url,
    });

  } catch (error) {
    return res.status(200).json({ isPlaying: false, error: error.message });
  }
}
