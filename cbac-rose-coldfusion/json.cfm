<cfscript>
    /*
    Port of json.php
    Acts as an AJAX endpoint to fetch processed avalanche data.

    Expects:
    - FORM.start: Start date string (YYYY-MM-DD)
    - FORM.end: End date string (YYYY-MM-DD)

    Outputs:
    - JSON representation of the avalanche data array.
    */

    // --- Parameter Handling ---
    param name="form.start" type="string" default="";
    param name="form.end" type="string" default="";

    // Basic validation (align with validation in data.cfm or enhance)
    if (!len(trim(form.start)) || !len(trim(form.end))) {
        cfcontent(type="application/json");
        writeOutput(serializeJSON({ error: true, message: "'start' and 'end' form parameters are required." }));
        cfabort;
    }
    if (!isDate(form.start) || !isDate(form.end)) {
        cfcontent(type="application/json");
        writeOutput(serializeJSON({ error: true, message: "'start' and 'end' must be valid dates." }));
        cfabort;
    }

    // --- Include Data Fetching Logic ---
    // Pass the form dates as URL parameters to data.cfm (as data.cfm expects URL scope)
    var urlParams = "startDate=#form.start#&endDate=#form.end#";

    // Use try/catch around the include in case data.cfm throws an error
    try {
        // Include data.cfm within the current request context
        // Variables set in the 'request' scope by data.cfm will be available here.
        cfinclude(template="data.cfm?#urlParams#");

        // Check if data.cfm set an error flag
        if (structKeyExists(request, "dataError") && request.dataError) {
             cfcontent(type="application/json");
             writeOutput(serializeJSON({ error: true, message: request.errorMessage ?: "Error fetching data." }));
             cfabort;
        }

        // Ensure request.avalanches exists and is an array
        if (!structKeyExists(request, "avalanches") || !isArray(request.avalanches)) {
            // Should not happen if data.cfm runs correctly without error, but good to check
             cfcontent(type="application/json");
             writeOutput(serializeJSON({ error: true, message: "Data processing failed to produce results." }));
             cfabort;
        }

        // --- Output JSON ---
        cfcontent(type="application/json");
        writeOutput(serializeJSON(request.avalanches));

    } catch (any e) {
        // Catch errors from cfinclude or serialization
        // Log the detailed error server-side
        cflog(text="Error in json.cfm: #e.message# #e.detail# #e.stacktrace#", file="application", type="Error");

        // Send a generic error response to the client
        cfcontent(type="application/json");
        // Avoid sending detailed internal error messages to the client
        writeOutput(serializeJSON({ error: true, message: "An internal server error occurred." }));
        cfabort; // Ensure script stops here
    }

</cfscript> 