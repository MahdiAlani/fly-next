export async function GET(req) {
    const { city } = req.nextUrl.searchParams;
  
    if (!city) {
        return Response.json({ error: 'City is required' }, { status: 400 });
    }
  
    const response = await fetch(
      `https://advanced-flights-system.replit.app/api/flights?origin=${city}`,
        {
            headers: {
            'x-api-key': process.env.AFS_KEY,
            },
        }
    );
  
    const flights = await response.json();
  
    return Response.json(flights);
  }