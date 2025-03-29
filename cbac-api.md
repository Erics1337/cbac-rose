**Disclaimer:** This documentation is inferred from the provided JavaScript snippet. It might be incomplete or slightly inaccurate. Always refer to any official API documentation provided by avalanche.org if available. Usage should comply with their terms of service.

---

## Avalanche API V2 Endpoints Summary (CBAC Focus)

**Base URL:** `https://api.avalanche.org/v2/public`

1.  **Get Center Info:** `GET /avalanche-center/CBAC`
    *   Retrieves general info and forecast zones for CBAC.
2.  **Get Forecast:** `GET /product?type=forecast&center_id=CBAC&zone_id={zone_id}`
    *   Fetches the avalanche forecast (danger levels, problems, summary) for a specific `zone_id`.
3.  **Get Map Layer:** `GET /products/map-layer/CBAC`
    *   Retrieves GeoJSON data for displaying forecast danger zones on a map.
4.  **Get Observation:** `GET /observation/{obsId}`
    *   Fetches details for a single observation (requires `obsId`, often found in the forecast).

---

## Avalanche Observation API Documentation (Inferred)

### Overview

This API provides access to avalanche observation data, including general field observations and specific avalanche occurrence reports. It appears to use a combination of RESTful endpoints for single records and a GraphQL endpoint for fetching lists based on criteria like date ranges.

### Base URL Structure

The API has a dynamic base URL structure:

1.  **Domain:**
    * Production/Default: `https://api.avalanche.org`
    * Staging/Development: `https://staging-api.avalanche.org` (Used if `obsWidgetData.devMode` is true)

2.  **API Version Path:** `/obs/v1`

3.  **Access Level Path Segment:** This depends on authentication status:
    * `/public`: For general public access (Default if not authenticated).
    * `/pro`: If a specific `nac_obs_auth` cookie indicates a "pro" user.
    * `""` (Empty): If an `obsWidgetData.auth` variable is true (seems to indicate direct authentication).

**Most Common Public Base URL:** `https://api.avalanche.org/obs/v1/public`

All relative endpoint paths below should be appended to the appropriate base URL structure.

### Authentication

The API distinguishes between public and potentially authenticated (`/pro` or empty segment) access. The exact mechanism for obtaining authentication (setting the `nac_obs_auth` cookie or the `obsWidgetData.auth` flag) is not detailed in this code snippet but likely involves a separate login process via `https://[domain]/v2/login`. Public data is generally accessible via the `/public` path segment.

### Endpoints

#### 1. Fetch Observation Lists (GraphQL)

* **Path:** `/graphql`
* **Method:** `POST`
* **Purpose:** Retrieve lists of general observations and/or avalanche observations based on specific criteria, primarily date ranges and center ID.
* **Request Body:** A JSON object containing a `query` field with a GraphQL query string.
    * **Identified Queries:**
        * `getObservationList(centerId: String!, startDate: String!, endDate: String!)`: Fetches general field observations.
        * `getAvalancheObservationList(centerId: String!, startDate: String!, endDate: String!)`: Fetches specific avalanche occurrences.
    * **Parameters (within GraphQL query):**
        * `centerId` (String, Required): The ID of the avalanche center (e.g., "SNFAC").
        * `startDate` (String, Required): The start date for the query range (likely YYYY-MM-DD format).
        * `endDate` (String, Required): The end date for the query range (likely YYYY-MM-DD format).
* **Response:** A JSON object containing a `data` field with results matching the GraphQL query structure. Fields observed in the code include `id`, `startDate`, `createdAt`, `obsSource`, `locationPoint { lat, lng }`, `locationName`, `name`, `observerType`, `status`, `media`, `avalanches`, `dSize`, `aspect`, `trigger`, etc.

**Example (Conceptual `curl`):**

```bash
curl -X POST \
  'https://api.avalanche.org/obs/v1/public/graphql' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "query { getObservationList(centerId: \"YOUR_CENTER_ID\", startDate: \"YYYY-MM-DD\", endDate: \"YYYY-MM-DD\") { id startDate locationName } getAvalancheObservationList(centerId: \"YOUR_CENTER_ID\", startDate: \"YYYY-MM-DD\", endDate: \"YYYY-MM-DD\") { id date dSize trigger } }"
  }'
```
*(Replace placeholders with actual values)*

#### 2. Fetch Single Observation

* **Path:** `/observation/{observationId}`
* **Method:** `GET`
* **Purpose:** Retrieve details for a single, specific general field observation.
* **URL Parameters:**
    * `observationId` (String, Required): The unique ID of the observation.
* **Response:** A JSON object representing the observation details.

**Example (`curl`):**

```bash
curl 'https://api.avalanche.org/obs/v1/public/observation/YOUR_OBSERVATION_ID'
```
*(Replace placeholder with actual ID)*

#### 3. Fetch Single Avalanche Observation

* **Path:** `/avalanche_observation/{avalancheObservationId}`
* **Method:** `GET`
* **Purpose:** Retrieve details for a single, specific avalanche occurrence report.
* **URL Parameters:**
    * `avalancheObservationId` (String, Required): The unique ID of the avalanche observation.
* **Response:** A JSON object representing the avalanche observation details.

**Example (`curl`):**

```bash
curl 'https://api.avalanche.org/obs/v1/public/avalanche_observation/YOUR_AVALANCHE_OBS_ID'
```
*(Replace placeholder with actual ID)*

---

### Notes

* **Date Format:** Based on common practice and the use of `startDate`/`endDate` in the GraphQL query, dates are likely expected in `YYYY-MM-DD` format.
* **Rate Limiting:** Assume standard rate limits apply. Check API provider documentation or headers for details.
* **Error Handling:** Expect standard HTTP status codes (e.g., 404 for not found, 401/403 for auth issues, 5xx for server errors). The GraphQL endpoint might return a 200 status even with query errors, embedding error details within the JSON response body.
* **Terms of Use:** Ensure your use case complies with the avalanche.org terms of service for API usage.

