export default async function handler(req, res) {
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;

  const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) return res.status(200).json({ isPlaying: false, error: tokenData.error });

    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    // --- EL FIX PARA EL ERROR QUE TE DIO ---
    if (response.status === 429) {
      return res.status(200).json({ isPlaying: false, error: "Spotify Rate Limit (Muchos pedidos)" });
    }
    if (response.status === 204) {
      return res.status(200).json({ isPlaying: false, status: "🦗🦗🦗🦗🦗" });
    }

    const song = await response.json();

    return res.status(200).json({
      isPlaying: song.is_playing,
      title: song.item.name,
      artist: song.item.artists.map((_artist) => _artist.name).join(', '),
      albumImageUrl: song.item.album.images[0].url,
    });

  } catch (error) {
    return res.status(200).json({ isPlaying: false, error: "Error de red o JSON" });
  }
}
