<cfscript>
    // Define cache buster variable
    variables.cacheClear = "1.0"; // Or use now().getTime()

    // Define date range (consider making these URL params like index.cfm)
    variables.startDate = "2021-08-01"; // Default start date from table.php
    variables.endDate = dateFormat(now(), "yyyy-mm-dd"); // Current date

    // --- Include Data Fetching Logic ---
    // Pass the dates as URL parameters to data.cfm
    variables.urlParams = "startDate=#variables.startDate#&endDate=#variables.endDate#";
    request.avalanches = []; // Initialize to prevent errors if include fails
    request.dataError = false;
    request.errorMessage = "";

    try {
        cfinclude(template="data.cfm?#variables.urlParams#");
    } catch (any e) {
        request.dataError = true;
        request.errorMessage = "Error including data.cfm: #e.message# #e.detail#";
        // Optionally log the full stack trace
        cflog(text="Error in table.cfm during include: #e.message# #e.detail# #e.stacktrace#", file="application", type="Error");
    }

    // Handle potential errors from data.cfm itself
    if (!structKeyExists(request, "dataError") || request.dataError) {
        // Output an error message or handle gracefully
        // For now, just ensure avalanches is an empty array if there was an error
        request.avalanches = [];
        // You might want to display request.errorMessage to the user here
    }
</cfscript>
<!DOCTYPE html>
<html>
<head>
    <title>Avalanche Table</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!--- Basic CSS includes from table.php --->
    <link rel='stylesheet' id='wp-block-library-css'
		href='//cbavalanchecenter.org/wp-includes/css/dist/block-library/style.min.css?ver=5.8.2' type='text/css'
		media='all' />
	<link rel='stylesheet' id='wp-block-library-theme-inline-css'
		href='/css/template1.css' type='text/css'
		media='all' />
    <!--- DataTables CSS --->
    <link rel='stylesheet' href='//cdn.datatables.net/1.11.4/css/jquery.dataTables.min.css'>
    <link rel="stylesheet" type="text/css" href="//cdn.datatables.net/buttons/2.2.2/css/buttons.dataTables.min.css">
	<link rel="stylesheet" type="text/css" href="//cdn.datatables.net/datetime/1.1.1/css/dataTables.dateTime.min.css">
    <link rel="stylesheet" type="text/css" href="//cdn.datatables.net/searchpanes/1.4.0/css/searchPanes.dataTables.min.css">
    <link rel="stylesheet" type="text/css" href="//cdn.datatables.net/rowreorder/1.2.8/css/rowReorder.dataTables.min.css">
	<link rel="stylesheet" type="text/css" href="//cdn.datatables.net/responsive/2.3.0/css/responsive.dataTables.min.css">
	<link rel="stylesheet" type="text/css" href="//cdn.datatables.net/select/1.3.4/css/select.dataTables.min.css">

    <!--- Custom Table CSS --->
    <cfoutput>
        <link rel='stylesheet' href='/css/table.css?c=#variables.cacheClear#' type='text/css' media='all' />
    </cfoutput>
</head>
<body>
    <div class="banner">
        <a href="https://cbavalanchecenter.org"> <!--- Link to main site? --->
            <img src="/img/CBAC_white.png" alt="CBAC">
        </a>
    </div>
    <div class="main-container">
        <header class="entry-header" style="margin-bottom:15px;">
            <h1 class="entry-title">Avalanche Table</h1>
             <cfif request.dataError>
                <p style="color:red;">Error loading data: <cfoutput>#request.errorMessage#</cfoutput></p>
            </cfif>
        </header>
        <!--- Date Filter Inputs (JavaScript in table.js will handle these) --->
        <table class="date-filter-container" border="0" cellspacing="0" cellpadding="0">
            <tbody>
                <tr>
                    <td style="padding:0;"><b id="date-filter-title">Filters:&nbsp;&nbsp;</b>
                        <input type="text" id="min" name="min" placeholder="Start Date">&nbsp;
                        <input type="text" id="max" name="max" placeholder="End Date">&nbsp;
                        <select id="location-filter"><option value="">Location</option></select> <!--- Assuming table.js populates this --->
                    </td>
                </tr>
            </tbody>
        </table>
        <table id="example" class="display" style="width:100%">
            <thead>
                <tr>
                    <th>Date (Sort)</th>  <!--- Hidden column for correct sorting --->
                    <th>Date (Display)</th>
                    <th>Forecast Zone</th>
                    <th>Location</th>
                    <th>Size</th>
                    <th>Elevation</th>
                    <th>Aspect</th>
                    <th>Trigger</th>
                    <th>Trigger Modifier</th>
                    <th>Type</th>
                    <th>Interface</th>
                    <th>Link</th>
                </tr>
            </thead>
            <tbody>
                <cfoutput query="request.avalanches">
                    <cfset displayDate = "N/A"> <!--- Default display date --->
                    <cfif isDate(avalancheDate)>
                        <cfset displayDate = dateFormat(avalancheDate, "mm/dd/yyyy")>
                    </cfif>
                    <tr>
                        <td>#dateFormat(avalancheDate, "yyyy-mm-dd")#</td> <!--- Sortable date format --->
                        <td>#displayDate#</td>
                        <td>#zone#</td>
                        <td>#location#</td>
                        <td>#size#</td>
                        <td>#elevation#</td>
                        <td>#aspect#</td>
                        <td>#trigger#</td>
                        <td>#modifier#</td>
                        <td>#type#</td>
                        <td>#interface#</td>
                        <td><a href="#url#" target="_blank">View&nbsp;Observation</a></td>
                    </tr>
                </cfoutput>
            </tbody>
        </table>
    </div>

    <!--- Core JS Libraries --->
    <script src="//code.jquery.com/jquery-3.5.1.js" integrity="sha256-QWo7LDvxbWT2tbbQ97B53yJnYU3WhH/C8ycbRAkjPDc=" crossorigin="anonymous"></script>
	<script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min.js"></script>

    <!--- DataTables JS --->
    <script src="//cdn.datatables.net/1.11.4/js/jquery.dataTables.min.js"></script>
    <script type="text/javascript" language="javascript" src="//cdn.datatables.net/buttons/2.2.2/js/dataTables.buttons.min.js"></script>
	<script type="text/javascript" language="javascript" src="//cdnjs.cloudflare.com/ajax/libs/jszip/3.1.3/jszip.min.js"></script>
	<script type="text/javascript" language="javascript" src="//cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/pdfmake.min.js"></script>
	<script type="text/javascript" language="javascript" src="//cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/vfs_fonts.js"></script>
	<script type="text/javascript" language="javascript" src="//cdn.datatables.net/buttons/2.2.2/js/buttons.html5.min.js"></script>
	<script type="text/javascript" language="javascript" src="//cdn.datatables.net/buttons/2.2.2/js/buttons.print.min.js"></script>
	<script type="text/javascript" language="javascript" src="//cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js"></script>
	<script type="text/javascript" language="javascript" src="//cdn.datatables.net/datetime/1.1.1/js/dataTables.dateTime.min.js"></script>
    <script type="text/javascript" language="javascript" src="//cdn.datatables.net/searchpanes/1.4.0/js/dataTables.searchPanes.min.js"></script>
	<script type="text/javascript" language="javascript" src="//cdn.datatables.net/select/1.3.4/js/dataTables.select.min.js"></script>
    <script type="text/javascript" language="javascript" src="//cdn.datatables.net/rowreorder/1.2.8/js/dataTables.rowReorder.min.js"></script>
	<script type="text/javascript" language="javascript" src="//cdn.datatables.net/responsive/2.3.0/js/dataTables.responsive.min.js"></script>

    <!--- Custom Table JS --->
    <cfoutput>
        <script type="text/javascript" src="/js/table.js?c=#variables.cacheClear#"></script>
    </cfoutput>
</body>
</html> 