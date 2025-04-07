export async function GET(req) {
    const { destination } = req.nextUrl.searchParams;
  
    if (!destination) {
        return Response.json({ error: 'Destination is required' }, { status: 400 });
    }
  
    const hotels = await prisma.hotel.findMany({
        where: {
            location: destination,
        },
    });
  
    return Response.json(hotels);
}