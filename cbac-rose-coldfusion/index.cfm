<cfscript>
    // Define cache buster variable (use timestamp or version number)
    variables.cacheClear = "1.0"; // Or use now().getTime()

    // Get filter data from application scope
    variables.filterData = application.filterData;

    // Calculate year range for dropdown
    variables.currentYear = year(now());
    variables.startYear = (month(now()) >= 9) ? variables.currentYear : variables.currentYear - 1;
    variables.selectedYear = URL.year ?: variables.startYear; // Get year from URL or default

    // Ensure selectedYear is numeric
    if (!isNumeric(variables.selectedYear)) {
        variables.selectedYear = variables.startYear;
    }

</cfscript>
<!DOCTYPE html>
<html>
<head>
    <title>Avalanche Rose</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!--- Link CSS files - Assuming they are served from the web root --->
    <link rel='stylesheet' id='wp-block-library-css'
		href='//cbavalanchecenter.org/wp-includes/css/dist/block-library/style.min.css?ver=5.8.2' type='text/css'
		media='all' />
	<link rel='stylesheet' id='wp-block-library-theme-inline-css'
		href='/css/template1.css' type='text/css'
		media='all' />
	<link rel='stylesheet' id='foobox-free-min-css'
		href='//cbavalanchecenter.org/wp-content/plugins/foobox-image-lightbox/free/css/foobox.free.min.css?ver=2.7.16'
		type='text/css' media='all' />
	<link rel='stylesheet' id='mappress-leaflet-css' href='//unpkg.com/leaflet@1.7.1/dist/leaflet.css?ver=1.7.1'
		type='text/css' media='all' />
	<link rel='stylesheet' id='mappress-css'
		href='//cbavalanchecenter.org/wp-content/plugins/mappress-google-maps-for-wordpress/css/mappress.css?ver=2.72.5'
		type='text/css' media='all' />
	<link rel='stylesheet' id='nac-avalanche-shortcodes-css'
		href='//cbavalanchecenter.org/wp-content/plugins/nac-avalanche-shortcodes/public/css/nac-avalanche-shortcodes-public.css?ver=1.0.1'
		type='text/css' media='all' />
	<link rel='stylesheet' id='x-stack-css'
		href='//cbavalanchecenter.org/wp-content/themes/pro/framework/dist/css/site/stacks/integrity-light.css?ver=5.0.8'
		type='text/css' media='all' />
	<link rel='stylesheet' id='x-child-css'
		href='//cbavalanchecenter.org/wp-content/themes/pro-child/style.css?ver=5.0.8' type='text/css'
		media='all' />
	<link rel='stylesheet' id='cs-inline-css' href='/css/template2.css' type='text/css' media='all' />
	<link href="/lib/jQRangeSlider/css/iThing.css" rel="stylesheet" media="screen">

    <link href="https://cdn.jsdelivr.net/gh/StephanWagner/jBox@v1.3.3/dist/jBox.all.min.css" rel="stylesheet">

    <!--- Use the cacheClear variable for rose.css --->
    <cfoutput>
        <link rel='stylesheet' href='/css/rose.css?c=#variables.cacheClear#' type='text/css' media='all' />
    </cfoutput>
</head>
<body class="loading">
	<div class="custom-widget">
		<div class="container">

			<div class="filters-container">
                <div class="date-container">
                    <div class="year-container">
                        <select id="year-select" class="small gfield_select">
                            <cfoutput>
                                <cfloop from="#variables.startYear#" to="2021" index="yyyy" step="-1">
                                    <cfset nextYear = yyyy + 1>
                                    <option value="#yyyy#"<cfif yyyy eq variables.selectedYear> selected</cfif>>#yyyy#-#nextYear#</option>
                                </cfloop>
                            </cfoutput>
                        </select>
                    </div>
                    <div class="slider-container">
                        <div id="slider"></div>
                    </div>
                </div>
				<div class="filter-container">
					<!--- Zone Filter --->
					<select id="zone-filter" class="filters small gfield_select" data-type="zone">
						<option value="">All Forecast Zones</option>
                        <cfloop array="#variables.filterData.zones#" index="zone">
                            <cfset formattedValue = lcase(zone)>
                            <cfoutput><option value="zone-#formattedValue#">#zone#</option></cfoutput>
                        </cfloop>
					</select>
					<!--- Type Filter --->
					<select id="type-filter" class="filters small gfield_select" data-type="typeFilter">
						<option value="">All Avalanche Types</option>
                        <cfloop array="#variables.filterData.types#" index="type">
                            <cfset formattedValue = replace(lcase(type), " ", "-", "all")>
                            <cfoutput><option value="type-#formattedValue#">#type#</option></cfoutput>
                        </cfloop>
					</select>
					<!--- Interface Filter --->
					<select id="interface-filter" class="filters small gfield_select" data-type="interface">
						<option value="">All Failure Interfaces</option>
                        <cfloop array="#variables.filterData.interfaces#" index="item">
                            <cfset formattedValue = replace(replace(lcase(item), " ", "-", "all"), "/", "-", "all")>
                            <cfoutput><option value="interface-#formattedValue#">#item#</option></cfoutput>
                        </cfloop>
					</select>
					<!--- Trigger Filter --->
					<select id="trigger-filter" class="filters small gfield_select" data-type="triggerFilter">
						<option value="">All Triggers</option>
                         <cfloop array="#variables.filterData.triggers#" index="item">
                            <cfset formattedValue = replace(lcase(item), " ", "-", "all")>
                            <cfoutput><option value="trigger-#formattedValue#">#item#</option></cfoutput>
                        </cfloop>
					</select>
                    <!--- Modifier Filter --->
                    <select id="modifier-filter" class="filters small gfield_select" data-type="modifier">
						<option value="">All Modifiers</option>
                        <cfloop array="#variables.filterData.modifiers#" index="item">
                            <cfset formattedValue = lcase(item)>
                            <cfoutput><option value="modifier-#formattedValue#">#item#</option></cfoutput>
                        </cfloop>
					</select>
					<!--- Size Filter --->
					<select id="size-filter" class="filters small gfield_select" data-type="size">
						<option value="">All Sizes</option>
                        <cfloop array="#variables.filterData.sizes#" index="size">
                            <cfset lowerCaseSize = replace(lcase(size), ".", "-", "all")>
                            <cfoutput><option value="size-#lowerCaseSize#">#size#</option></cfoutput>
                        </cfloop>
					</select>
				</div>
			</div>
            <div class="avalanche-row">
                <div class="avalanche-rose-container">
                    <div class="avalanche-rose">
                        <div class="avalanche-rose-center"></div>
                        <!--- Avalanche points will be added here by JavaScript --->
                    </div>
                </div>
                <div class="legend-container">
                    <div class="legend">
                        <select id="color-by" class="small gfield_select">
                            <option value="">Color Code By</option>
                            <option value="type">Avalanche Type</option>
                            <option value="interface">Failure Interface</option>
                            <option value="trigger">Trigger</option>
                            <option value="zone">Forecast Zone</option>
                        </select>
                        <div class="custom-legend" style="display:none;">
                            <table border="0">
                                <!--- Type Legend --->
                                <cfloop array="#variables.filterData.types#" index="type" item="item">
                                    <cfset formattedValue = replace(lcase(item), " ", "-", "all")>
                                    <cfoutput>
                                    <tr class="legend-entry type-legend">
                                        <td class="legend-col-left"><div class="legend-circle size-d3 color#index# color-type" data-name="#formattedValue#" data-count="#index#"></div></td>
                                        <td><div class="legend-label">#item#</div></td>
                                    </tr>
                                    </cfoutput>
                                </cfloop>
                                <!--- Interface Legend --->
                                <cfloop array="#variables.filterData.interfaces#" index="idx" item="item">
                                     <cfset formattedValue = replace(replace(lcase(item), " ", "-", "all"), "/", "-", "all")>
                                     <cfoutput>
                                     <tr class="legend-entry interface-legend">
                                        <td class="legend-col-left"><div class="legend-circle size-d3 color#idx# color-interface" data-name="#formattedValue#" data-count="#idx#"></div></td>
                                        <td><div class="legend-label">#item#</div></td>
                                    </tr>
                                    </cfoutput>
                                </cfloop>
                                <!--- Trigger Legend --->
                                <cfloop array="#variables.filterData.triggers#" index="idx" item="item">
                                    <cfset formattedValue = replace(lcase(item), " ", "-", "all")>
                                     <cfoutput>
                                     <tr class="legend-entry trigger-legend">
                                        <td class="legend-col-left"><div class="legend-circle size-d3 color#idx# color-trigger" data-name="#formattedValue#" data-count="#idx#"></div></td>
                                        <td><div class="legend-label">#item#</div></td>
                                    </tr>
                                    </cfoutput>
                                </cfloop>
                                <!--- Zone Legend --->
                                <cfloop array="#variables.filterData.zones#" index="idx" item="item">
                                    <cfset lowerCaseZone = lcase(item)>
                                    <cfoutput>
                                    <tr class="legend-entry zone-legend">
                                            <td class="legend-col-left"><div class="legend-circle size-d3 color#idx# color-zone" data-name="#lowerCaseZone#" data-count="#idx#"></div></td>
                                            <td><div class="legend-label">#item#&nbsp;Mountains</div></td>
                                    </tr>
                                    </cfoutput>
                                </cfloop>
                            </table>
                        </div>
                    </div>
                    <hr>
                    <div class="legend size-legend">
                        <label>Avalanche Size:</label>
                        <table border="0">
                            <tr><td class="legend-col-left"><div class="legend-circle size-d5 color1"></div></td><td><div class="legend-label">D5</div></td></tr>
                            <tr><td class="legend-col-left"><div class="legend-circle size-d4 color1"></div></td><td><div class="legend-label">D4</div></td></tr>
                            <tr><td class="legend-col-left"><div class="legend-circle size-d3 color1"></div></td><td><div class="legend-label">D3</div></td></tr>
                            <tr><td class="legend-col-left"><div class="legend-circle size-d2 color1"></div></td><td><div class="legend-label">D2</div></td></tr>
                            <tr><td class="legend-col-left"><div class="legend-circle size-d1 color1"></div></td><td><div class="legend-label">D1</div></td></tr>
                        </table>
                    </div>
                </div>
            </div>
		</div>
	</div>
    <!--- Link JS files - Assuming they are served from the web root --->
    <script src="//code.jquery.com/jquery-3.5.1.js" integrity="sha256-QWo7LDvxbWT2tbbQ97B53yJnYU3WhH/C8ycbRAkjPDc=" crossorigin="anonymous"></script>
	<script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min.js"></script>
	<script src="/lib/jQRangeSlider/lib/jquery.mousewheel.min.js"></script>
	<script src="/lib/jQRangeSlider/jQRangeSliderMouseTouch.js"></script>
	<script src="/lib/jQRangeSlider/jQRangeSliderDraggable.js"></script>
	<script src="/lib/jQRangeSlider/jQRangeSliderHandle.js"></script>
	<script src="/lib/jQRangeSlider/jQRangeSliderBar.js"></script>
	<script src="/lib/jQRangeSlider/jQRangeSliderLabel.js"></script>
	<script src="/lib/jQRangeSlider/jQRangeSlider.js"></script>
	<script src="/lib/jQRangeSlider/jQDateRangeSliderHandle.js"></script>
	<script src="/lib/jQRangeSlider/jQDateRangeSlider.js"></script>
	<script src="/lib/jQRangeSlider/jQEditRangeSliderLabel.js"></script>
	<script src="/lib/jQRangeSlider/jQEditRangeSlider.js"></script>
	<script src="/lib/jQRangeSlider/jQRuler.js"></script>
    <script type="text/javascript" src="/lib/jQRangeSlider/jQDateRangeSlider.js"></script>

    <!--- jBox tooltip plugin --->
    <script src="https://cdn.jsdelivr.net/gh/StephanWagner/jBox@v1.3.3/dist/jBox.all.min.js"></script>

    <!--- Use the cacheClear variable for rose.js --->
    <cfoutput>
        <script type="text/javascript" src="/js/rose.js?c=#variables.cacheClear#"></script>
    </cfoutput>
    <div class="loading-modal"></div>
</body>
</html>
