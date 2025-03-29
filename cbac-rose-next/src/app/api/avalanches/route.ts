import { NextRequest, NextResponse } from 'next/server';
import { BigQuery, BigQueryDate } from '@google-cloud/bigquery';

// Initialize BigQuery client.
// Assumes GOOGLE_APPLICATION_CREDENTIALS environment variable is set.
const bigQuery = new BigQuery();

// Placeholder for positioning constants - WE WILL NEED TO DEFINE THESE LATER
// Based on the logic in data.php
const aspectAdjustments: { [key: string]: { angle: number } } = {
    N: { angle: 90 },
    NE: { angle: 45 },
    E: { angle: 0 },
    SE: { angle: -45 },
    S: { angle: -90 },
    SW: { angle: -135 },
    W: { angle: 180 },
    NW: { angle: 135 },
    // Add other aspects if necessary
    DEFAULT: { angle: 0 }, // Default for unknown/missing aspects
};

// Placeholder - these determine distance from center based on elevation bands
const elevationCenter: { [key: string]: number } = {
    '< 9000': 50, // Example values - adjust based on original PHP/desired scale
    '9000-10000': 100,
    '10000-11000': 150,
    '11000-12000': 200,
    '> 12000': 250,
    DEFAULT: 150, // Default for unknown/missing elevations
};

// Placeholder - this adds randomness to distance within an elevation band
const elevationVariance: { [key: string]: number } = {
    '< 9000': 10, // Example values
    '9000-10000': 15,
    '10000-11000': 20,
    '11000-12000': 25,
    '> 12000': 30,
    DEFAULT: 20,
};

// Helper to map elevation value to a band key
function getElevationBand(elevation: number | null | undefined): string {
    if (elevation == null) return 'DEFAULT';
    if (elevation < 9000) return '< 9000';
    if (elevation < 10000) return '9000-10000';
    if (elevation < 11000) return '10000-11000';
    if (elevation < 12000) return '11000-12000';
    return '> 12000';
}

// Define an interface for the expected row structure from BigQuery
interface AvalancheDataRow {
    id: string;
    estimated_avalanche_date: BigQueryDate | null; // BigQuery returns dates as specific objects
    subject: string | null;
    size: string | null;
    aspect: string | null;
    elevation: number | null;
    triggerFilter: string;
    trigger: string;
    zone: string;
    typeFilter: string;
    type: string;
    interface: string;
    url: string | null;
    random_angle: number | null;
    random_radius: number | null;
    location: string | null; // Assuming location is a string, adjust if it's structured differently
    avyCount: number | null;
    modifier: string;
}

// Define the structure of the processed data returned by the API
interface ProcessedAvalancheData extends Omit<AvalancheDataRow, 'estimated_avalanche_date'> {
    estimated_avalanche_date: string | null; // Date as string
    left: number;
    top: number;
    opacity: number; // Add opacity field
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    // const year = searchParams.get('year'); // Year is no longer the primary date filter
    
    // --- Get filter params ---
    const zone = searchParams.get('zone');
    const typeFilter = searchParams.get('typeFilter');
    const interfaceFilter = searchParams.get('interface'); 
    const triggerFilter = searchParams.get('triggerFilter');
    const modifier = searchParams.get('modifier');
    const size = searchParams.get('size');
    // ---
    const startDateParam = searchParams.get('startDate'); // Format: 'YYYY-MM-DD'
    const endDateParam = searchParams.get('endDate'); // Format: 'YYYY-MM-DD'

    // --- Validate Date Range --- 
    if (!startDateParam || !endDateParam) {
        return NextResponse.json({ error: 'Missing required startDate or endDate parameters' }, { status: 400 });
    }
    // Basic validation (can be more robust)
    if (isNaN(Date.parse(startDateParam)) || isNaN(Date.parse(endDateParam))) {
        return NextResponse.json({ error: 'Invalid date format for startDate or endDate. Use YYYY-MM-DD.' }, { status: 400 });
    }
    const startDate = startDateParam;
    const endDate = endDateParam;
    // ---

    // Get current date at the beginning of the request for consistent age calculation
    // Use UTC to avoid timezone issues in date difference calculation
    const now = new Date();
    const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const oneDayMs = 24 * 60 * 60 * 1000;
    // --- Build WHERE clause and parameters dynamically ---
    const whereClauses: string[] = [`DATE(estimated_avalanche_date) BETWEEN @startDate AND @endDate`];
    const queryParams: { [key: string]: string } = {
         startDate: startDate,
         endDate: endDate 
    };

    if (zone) {
        whereClauses.push(`zone = @zone`);
        queryParams.zone = zone;
    }
    if (typeFilter) {
        // Note: The frontend sends the user-friendly type name.
        // The BigQuery field `typeFilter` already contains the simplified categories.
        whereClauses.push(`typeFilter = @typeFilter`);
        queryParams.typeFilter = typeFilter;
    }
    if (interfaceFilter) {
        whereClauses.push(`interface = @interfaceFilter`);
        queryParams.interfaceFilter = interfaceFilter;
    }
    if (triggerFilter) {
         // Note: The frontend sends the user-friendly trigger name.
        // The BigQuery field `triggerFilter` already contains the simplified categories.
        whereClauses.push(`triggerFilter = @triggerFilter`);
        queryParams.triggerFilter = triggerFilter;
    }
    if (modifier) {
        whereClauses.push(`modifier = @modifier`);
        queryParams.modifier = modifier;
    }
    if (size) {
        whereClauses.push(`size = @size`);
        queryParams.size = size;
    }
    // ---

    // IMPORTANT: Ensure your table name and project ID match your setup
    // The table name `long_avy_table_for_plot` is from the original PHP.
    const query = `
    SELECT
        id,
        estimated_avalanche_date,
        subject,
        destructive_size AS size,
        aspect,
        start_zone_elevation AS elevation,
        triggerFilter, -- Already calculated in the view/table
        trigger,
        zone,
        typeFilter, -- Already calculated in the view/table
        type,
        interface, -- Original name from PHP was failure_plane
        url,
        random_angle,
        random_radius,
        location,
        number_of_avalanches AS avyCount,
        modifier
    FROM \`cbac-306316.cbac_wordpress.long_avy_table_for_plot\`
    WHERE ${whereClauses.join(' AND \n    ')} 
    -- ORDER BY estimated_avalanche_date DESC -- Optional ordering
    `;

    const options = {
        query: query,
        location: 'US', // Specify your dataset location if not US
        params: queryParams, // Use dynamically built params
    };

    try {
        // Run the query
        const [job] = await bigQuery.createQueryJob(options);
        console.log(`Job ${job.id} started.`);

        // Wait for the query to finish
        const [rows] = await job.getQueryResults();

        console.log(`Job ${job.id} completed. Found ${rows.length} rows.`);


        // Process results and calculate positioning + opacity
        const processedRows: ProcessedAvalancheData[] = rows.map((row: AvalancheDataRow) => {
            // Positioning calculations
            const aspect = row.aspect?.toUpperCase() || 'DEFAULT';
            const elevation = row.elevation;
            const aspectDetail = aspectAdjustments[aspect] || aspectAdjustments['DEFAULT'];
            const baseAngle = aspectDetail.angle;
            const randomAngleOffset = row.random_angle != null ? row.random_angle : (Math.random() * 36 - 18);
            const finalAngle = baseAngle + randomAngleOffset;
            const elevationBand = getElevationBand(elevation);
            const baseRadius = elevationCenter[elevationBand] || elevationCenter['DEFAULT'];
            const radiusVariance = elevationVariance[elevationBand] || elevationVariance['DEFAULT'];
            const randomRadiusOffset = row.random_radius != null ? row.random_radius : (Math.random() * 2 * radiusVariance - radiusVariance);
            const finalRadius = baseRadius + randomRadiusOffset;
            const radians = finalAngle * (Math.PI / 180);
            const left = Math.cos(radians) * finalRadius;
            // Invert top calculation for typical screen coordinates (Y increases downwards)
            const top = Math.sin(radians) * finalRadius * -1;

            // Opacity calculation
            let opacity = 1.0;
            const avyDateStr = row.estimated_avalanche_date?.value;
            if (avyDateStr) {
                try {
                    const dateParts = avyDateStr.split('-');
                    const avyDateUTC = Date.UTC(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));

                    if (!isNaN(avyDateUTC)) {
                        const dayDifference = Math.floor((todayUTC - avyDateUTC) / oneDayMs);
                        const cappedDifference = Math.max(0, Math.min(dayDifference, 8)); 
                        opacity = 1.0 - (cappedDifference * 0.1);
                    }
                } catch (dateError) {
                    console.error("Error parsing avalanche date:", avyDateStr, dateError);
                }
            }

            // Explicitly construct the return object to match ProcessedAvalancheData
            const processedRow: ProcessedAvalancheData = {
                id: row.id,
                estimated_avalanche_date: avyDateStr || null,
                subject: row.subject,
                size: row.size,
                aspect: row.aspect,
                elevation: row.elevation,
                triggerFilter: row.triggerFilter,
                trigger: row.trigger,
                zone: row.zone,
                typeFilter: row.typeFilter,
                type: row.type,
                interface: row.interface,
                url: row.url,
                random_angle: row.random_angle,
                random_radius: row.random_radius,
                location: row.location,
                avyCount: row.avyCount,
                modifier: row.modifier,
                left: left,
                top: top,
                opacity: opacity,
            };
            return processedRow;
        });

        return NextResponse.json(processedRows);

    } catch (error) {
        console.error('BigQuery Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to fetch avalanche data', details: errorMessage }, { status: 500 });
    }
} 