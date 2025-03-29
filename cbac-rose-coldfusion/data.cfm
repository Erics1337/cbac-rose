<cfscript>
    /*
    Port of data.php
    Fetches avalanche data from BigQuery and calculates plotting coordinates.

    Assumptions:
    1. A ColdFusion datasource named 'bigQueryDSN' is configured for Google BigQuery.
       - Requires BigQuery JDBC drivers. See: https://cloud.google.com/bigquery/docs/reference/odbc-jdbc-drivers
    2. URL parameters 'startDate' and 'endDate' are provided in 'YYYY-MM-DD' format.
    3. ColdFusion structs named 'application.aspectAdjustments', 'application.elevationCenter',
       and 'application.elevationVariance' exist and contain the necessary mapping data
       (these will likely be loaded in Application.cfc or a dedicated settings file later).
       Example structure (needs to be defined based on PHP original):
       application.aspectAdjustments = {
           N: { angle: 90 }, S: { angle: 270 }, E: { angle: 0 }, W: { angle: 180 }, ...
       };
       application.elevationCenter = {
           "10000": 100, "9000": 90, ... // elevation band -> center radius
       };
       application.elevationVariance = {
           "10000": 5, "9000": 5, ...   // elevation band -> random variance
       };
    */

    // Initialize the results array
    request.avalanches = [];

    // --- Parameter Handling ---
    param name="URL.startDate" type="string" default=""; // Default or throw error?
    param name="URL.endDate" type="string" default="";   // Default or throw error?

    // Basic validation (consider adding more robust date validation)
    if (!len(trim(URL.startDate)) || !len(trim(URL.endDate))) {
        // Or redirect, or set default dates?
        throw(message="startDate and endDate URL parameters are required.");
    }
    if (!isDate(URL.startDate) || !isDate(URL.endDate)) {
         throw(message="startDate and endDate must be valid dates.");
    }

    // --- Query BigQuery ---
    try {
        query name="GetAvalanches" datasource="bigQueryDSN" {
            writeOutput("<!--- BigQuery SQL --->"); // Add comments in CFML
            writeOutput("SELECT
                id,
                estimated_avalanche_date,
                subject,
                destructive_size AS size,
                aspect,
                start_zone_elevation AS elevation,
                IFNULL(
                CASE
                    WHEN (
                        trigger = 'Skier'
                        OR trigger = 'Snowboarder'
                        OR trigger = 'Snowmobiler'
                        OR trigger = 'Snowbike'
                        OR trigger = 'Snowshoer'
                        OR trigger = 'On Foot'
                        )
                        THEN 'Human Triggered'
                    WHEN (
                        trigger = 'Natural'
                        OR trigger = 'Cornice Fall'
                        )
                        THEN 'Natural'
                    WHEN (trigger = 'Explosive')
                        THEN 'Explosive'
                    WHEN (trigger = 'Unknown')
                        THEN 'Unknown'
                    ELSE 'Other'
                END, 'Unknown') AS triggerFilter,
                IFNULL(trigger, 'Unknown') AS trigger,
                IFNULL(LEFT(forecast_zone, 9), 'Unknown') AS zone,
                IFNULL(IF((type = 'Glide' OR type = 'Roof Avalanche' OR type = 'Cornice'), 'Other', type), 'Other') AS typeFilter,
                IFNULL(type, 'Unknown') AS type,
                IFNULL(failure_plane, 'Unknown') AS interface,
                url,
                random_angle,
                random_radius,
                location,
                number_of_avalanches AS avyCount,
                IFNULL(trigger_modifier, 'Unknown') AS modifier
            FROM `cbac-306316.cbac_wordpress.long_avy_table_for_plot` -- Consider making project/dataset dynamic
            WHERE estimated_avalanche_date BETWEEN <cfqueryparam cfsqltype="cf_sql_date" value="#URL.startDate#"> AND <cfqueryparam cfsqltype="cf_sql_date" value="#URL.endDate#">;
            "); // Use cfqueryparam for dates
        } // end query

        // --- Process Results ---
        for (row in GetAvalanches) {
            var avalanche = {}; // Use local scope for temp struct

            // Load Query into Struct
            avalanche['avalancheDate'] = row.estimated_avalanche_date; // Adjust date format if needed
            avalanche['size'] = row.size;
            avalanche['aspect'] = row.aspect ?: 'Unknown'; // Handle potential nulls/empty strings if needed
            avalanche['elevation'] = row.elevation ?: 0; // Handle potential nulls/empty strings if needed
            avalanche['trigger'] = row.trigger;
            avalanche['triggerFilter'] = row.triggerFilter;
            avalanche['modifier'] = row.modifier;
            avalanche['zone'] = row.zone;
            avalanche['type'] = row.type;
            avalanche['typeFilter'] = row.typeFilter;
            avalanche['interface'] = row.interface;
            avalanche['url'] = row.url;
            avalanche['location'] = row.location;
            avalanche['avyCount'] = row.avyCount;

            // --- Calculate Left and Top Positions ---
            var aspect = avalanche.aspect;
            var elevation = avalanche.elevation; // Keep the numeric elevation

            // Use the application function to get the elevation band (ATL/NTL/BTL)
            var elevationBand = application.getElevationBand(elevation);

            // Get aspect angle
            var aspectDetails = structKeyExists(application.aspectAdjustments, aspect) ? application.aspectAdjustments[aspect] : { angle: 0 }; // Default if aspect not found
            var angle = aspectDetails.angle;

            // Get center radius and variance using the elevation band key
            var centerRadius = structKeyExists(application.elevationCenter, elevationBand) ? application.elevationCenter[elevationBand] : 10; // Default center radius if band not found
            var variance = structKeyExists(application.elevationVariance, elevationBand) ? application.elevationVariance[elevationBand] : 1; // Default variance if band not found

            // Use value if present, otherwise generate random value
            var randomAngle = len(trim(row.random_angle)) ? (val(row.random_angle) + angle) : (randRange(-18, 18) + angle);
            var randomHypotenuse = len(trim(row.random_radius)) ? (val(row.random_radius) + centerRadius) : (randRange(variance * -1, variance) + centerRadius);

            var radians = randomAngle * pi() / 180;
            var left = cos(radians) * randomHypotenuse;
            var top = sin(radians) * randomHypotenuse;

            // Load Left,Top into Struct
            avalanche['left'] = left;
            avalanche['top'] = top;

            // Add the processed avalanche struct to the request array
            arrayAppend(request.avalanches, avalanche);
        }

    } catch (any e) {
        // Handle database or processing errors
        // Log the error, show a user-friendly message, etc.
        writeDump(var=e, label="Error in data.cfm");
        // Potentially rethrow or set a flag for index.cfm to check
        request.dataError = true;
        request.errorMessage = e.message & " " & e.detail;
         // Rethrow? throw(e);
    }

</cfscript> 