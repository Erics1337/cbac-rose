<cfscript>
component {
    // Application Name
    this.name = "CBACRose_" & hash(getBaseTemplatePath()); // Unique name

    // Application Settings
    this.applicationTimeout = createTimeSpan(1, 0, 0, 0); // 1 day
    this.sessionManagement = false; // Assuming no session needed based on PHP code

    // --- Application Start ---
    public boolean function onApplicationStart() {
        // Lock scope for safety during initialization
        lock scope="application" type="exclusive" timeout="30" {

            // Initialize Filter Data (ported from filterData.php)
            application.filterData = {};
            application.filterData.zones = ["Northwest", "Southeast"];
            application.filterData.sizes = ["D1", "D1.5", "D2", "D2.5", "D3", "D3.5", "D4", "D4.5", "D5"];
            application.filterData.types = ["Loose", "Wet Loose", "Soft Slab", "Hard Slab", "Wet Slab", "Other"];
            application.filterData.interfaces = ["Within storm snow", "New/Old interface", "Old Snow", "Ground", "Unknown"];
            application.filterData.triggers = ["Natural", "Human Triggered", "Explosive", "Other", "Unknown"];
            application.filterData.modifiers = ["Unintentional", "Controlled", "Remote", "Sympathetic", "Unknown"];

            // Plotting Configuration (from json.php)
            application.aspectAdjustments = {
                E : { angle: 0 },
                NE: { angle: -45 },
                N : { angle: -90 },
                SE: { angle: 45 },
                S : { angle: 95 },  // Note: PHP value was 95, visually might expect 270/-90?
                NW: { angle: -135 },
                W : { angle: 180 }, // Note: PHP value was 180
                SW: { angle: 135 }  // Note: PHP value was 135, visually might expect 225/-135?
            };
            // Note: Keys are ATL, NTL, BTL (Above/Near/Below Tree Line). data.cfm needs mapping logic.
            application.elevationCenter = {
                ATL: 5.5,
                NTL: 11,
                BTL: 15
            };
            application.elevationVariance = {
                ATL: 2,
                NTL: 1,
                BTL: 1
            };

            // Function to map elevation to ATL/NTL/BTL - ** Placeholder logic - adjust ranges as needed! **
            application.getElevationBand = function(numericElevation) {
                if (!isNumeric(arguments.numericElevation) || arguments.numericElevation <= 0) return "BTL"; // Default if invalid
                var elev = val(arguments.numericElevation);
                if (elev > 11500) { // Example threshold for ATL
                    return "ATL";
                } else if (elev >= 10000) { // Example threshold for NTL
                    return "NTL";
                } else { // Default to BTL
                    return "BTL";
                }
            };

        } // end lock

        return true;
    }

    // --- Optional: Request Start ---
    /*
    public boolean function onRequestStart(string targetPage) {
        // Code to run at the beginning of each request
        // e.g., set default parameters, check authentication
        return true;
    }
    */

    // --- Optional: Application End ---
    /*
    public void function onApplicationEnd(struct applicationScope) {
        // Code to run when application times out or server stops
    }
    */
}
</cfscript>
