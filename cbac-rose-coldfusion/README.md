# CBAC Avalanche Rose (ColdFusion Port)

This project is a ColdFusion (CFML) port of the original PHP CBAC Avalanche Rose visualization tool.

## Description

The application displays avalanche data queried from Google BigQuery on:

1.  **An interactive Avalanche Rose (`index.cfm`):** Plots avalanches based on aspect and elevation, allowing filtering by date, zone, type, interface, trigger, modifier, and size. Also allows color-coding by different attributes.
2.  **A filterable data table (`table.cfm`):** Presents the raw avalanche data in a table format using DataTables.js, with options for date range and location filtering, sorting, and exporting.

## Requirements

*   **ColdFusion Server:** Adobe ColdFusion 2021+ or Lucee 5.x+ recommended.
*   **Google BigQuery Account:** Access to the relevant BigQuery project and dataset (`cbac-306316.cbac_wordpress.long_avy_table_for_plot` is used in the code).
*   **Google BigQuery JDBC Driver:** Download the appropriate JDBC driver JAR file(s) from Google Cloud. See: [BigQuery JDBC/ODBC Drivers](https://cloud.google.com/bigquery/docs/reference/odbc-jdbc-drivers)
*   **ColdFusion Datasource:** A datasource configured in the ColdFusion Administrator.

## Setup

1.  **Deploy Files:** Place the contents of this directory (`cbac-rose-coldfusion`) into a web-accessible directory on your ColdFusion server.
2.  **Install JDBC Driver:** Place the downloaded BigQuery JDBC driver JAR file(s) into the appropriate directory for your ColdFusion server (e.g., `cfusion/lib` for Adobe ColdFusion, `lucee-server/lib` for Lucee) and restart the ColdFusion service.
3.  **Configure Datasource:**
    *   Log in to your ColdFusion Administrator.
    *   Go to Data & Services > Datasources.
    *   Add a new datasource. **Crucially, name it `bigQueryDSN`** (as this name is hardcoded in `data.cfm`).
    *   Select "Other" for the driver type.
    *   Enter the JDBC URL and Driver Class specific to the Google BigQuery driver. You will need to provide authentication details within the JDBC URL or driver properties, such as the Project ID, OAuth mechanism (e.g., Service Account key file path), etc. Refer to the Google BigQuery JDBC driver documentation for the correct connection string format.
    *   Example JDBC URL (may vary based on driver version and auth method):
        ```
        jdbc:bigquery://https://www.googleapis.com/bigquery/v2:443;ProjectId=cbac-306316;OAuthType=0;OAuthServiceAcctEmail=your-service-account@your-project.iam.gserviceaccount.com;OAuthPvtKeyPath=/path/to/your/keyfile.json;
        ```
    *   Example Driver Class (may vary):
        ```
        com.simba.googlebigquery.jdbc.Driver
        ```
    *   Verify the connection.
4.  **Adjust Elevation Mapping (Optional):** Review the `application.getElevationBand` function within `Application.cfc`. The elevation thresholds (e.g., 11500, 10000) used to map numeric elevation to ATL/NTL/BTL bands are examples and may need adjustment based on the specific region's characteristics.
5.  **Review Aspect Angles (Optional):** Review the angles defined in `application.aspectAdjustments` in `Application.cfc`. Some angles noted from the PHP code (e.g., S: 95, W: 180, SW: 135) might differ from standard compass bearings and may need adjustment for accurate visual representation.

## Running the Application

*   **Avalanche Rose:** Access the main visualization via your browser: `http://your-cf-server/path/to/cbac-rose-coldfusion/index.cfm`
*   **Avalanche Table:** Access the data table view via your browser: `http://your-cf-server/path/to/cbac-rose-coldfusion/table.cfm`

Ensure the ColdFusion application has the necessary permissions to read the BigQuery service account key file if you are using that authentication method. 