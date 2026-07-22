export default async function handler(req, res) {
  const { videoId } = req.query;

  if (!videoId) {
    return res.status(400).json({ error: 'videoId is required' });
  }

  const apiKey = process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error('YouTube API key not configured');
    return res.status(500).json({ error: 'YouTube API key not configured' });
  }

  const youtubeUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`;

  try {
    const response = await fetch(youtubeUrl);
    const data = await response.json();

    res.setHeader('Content-Type', 'application/json');
    res.status(response.status).json(data);
  } catch (error) {
    console.error('YouTube API proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch YouTube data' });
  }
}
