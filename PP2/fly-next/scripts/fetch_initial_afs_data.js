import { prisma } from "./db.js";

async function fetchAndStoreCities() {

    try {
        
        // AFS API URLs
        const airportsUrl = `https://advanced-flights-system.replit.app/api/airports`
        const citiesUrl = `https://advanced-flights-system.replit.app/api/cities`

        // Perform the airports API request
        const airportResponse = await fetch (airportsUrl, {
            method: "GET",
            headers: {
                "x-api-key": process.env.AFS_KEY,
                "Content-Type": "application/json"
            }
        });

        // If response is not OK, error
        if (airportResponse.status !== 200) {
            console.error("Error fetching and storing airports. AFS returned code: " + airportResponse.status);
            return;
        }

        // Convert response to json
        const airportData = await airportResponse.json();

        // Perform the cities API request
        const citiesResponse = await fetch (citiesUrl, {
            method: "GET",
            headers: {
                "x-api-key": process.env.AFS_KEY,
                "Content-Type": "application/json"
            }
        });
        
        // If response is not OK, error
        if (citiesResponse.status !== 200) {
            console.error("Error fetching and storing cities. AFS returned code: " + citiesResponse.status);
            return;  
        }

        // Convert response to json
        const cityData = await citiesResponse.json();

        // Wipe old data
        await prisma.city.deleteMany();
        await prisma.airport.deleteMany();

        // Insert new airport data
        await prisma.airport.createMany({data: airportData});

        // Insert new city data
        await prisma.city.createMany({data: cityData});
    }

    catch (error) {
        console.error("Error fetching and storing cities: " + error);
    }
}

// Run function
fetchAndStoreCities();