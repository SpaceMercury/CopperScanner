# Flights Live Prices API

## /create : Resultado mas rapido pero incompleto:
POST https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/create

Required fields:

* market	Market where search is coming from. E.g.: UK
* locale	Language to be used for the search. E.g.: en-GB
* currency	Currency that the search result prices are returned in. E.g.: GBP
* queryLegs	origin and destination for the given search. See flights live prices API documentation for format
* adults	number of adults traveling

Optional fields:

* childrenAges	Number of children traveling
* Include carriers and agents	Options for search result to only contain inventory from specified carriers (airlines) and / or * agents (OTAs)
* Exclude carrier and agents	Options for search result to exclude inventory from specified carriers and / or agents
* includeSustainabilityData	Option for search to include flights emissions data. Defaults to true
* nearbyAirports	If set to true, the search will include airports near the specified origin airport. Only origin-side nearby * airport support is available; nearby airports for the destination are not supported at this time. Defaults to false
* cabinClass	Class of travel to search for

## /poll : Resultado completo pero mas lento
POST https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/poll/{sessionToken}

* Status	Indicates status of the search request is running or completed
* Action	Indicates how to treat the SearchResults contained in a SearchContent. Prior results should only be replaced if the action is explicitly RESULT_ACTION_REPLACED.
* Itineraries	Bookable itinerary which corresponds with what was requested in the search. A return trip will consist of 2 legs, while a one-way trip will consist of 1 leg. An itinerary will contain a deepLink field which takes the traveler to the booking page.
* Leg	Includes details about the flight leg from destination to origin. A leg has 1 segment if it is a direct flight, and can have multiple segments if there are multiple stopovers.
* Segment	Shows the individual stops in a leg. I.e.: if a leg has 1 stop, the segment will show details about the stopover such as the length of time and where the stopover location is.
* Places	Shows the individual stops in a leg. I.e.: if a leg has 1 stop, the segment will show details about the stopover such as the length of time and where the stopover location is.
* Carriers	Similar to places, carriers contains information about the airlines referenced in itineraries.
* Agents	Similar to places, agents contains information about the OTAs referenced in itineraries.
* Stats	Provides meta information regarding the itineraries returned. It contains the minPrice, minDurtation, maxDuration of the flights and also an aggregated object stops which contains the data of how are direct, have 1 stop, or multiple stops.
Stats can be useful to get fastest/ longest trip amongst other things.
* Sorting options	Sorting options are used to help sort itineraries based on a preferred criteria.

## MASH-UPS: 

To filter out mash-ups, you can filter out results so that `agentIds.length === 1`

## Multi-city:

Same query as the one for Flights Live Prices Query Object by adding more query legs to the queryLeg object indicating it's a multi-city search.

Example: 

<pre>{
  "query": {
    "market": "UK",
    "locale": "en-GB",
    "currency": "GBP",
    "queryLegs": [
      {
        "originPlaceId": {
          "iata": "BER"
        },
        "destinationPlaceId": {
          "iata": "BCN"
        },
        "date": {
          "year": "2024",
          "month": "11",
          "day": "24"
        }
      },
      {
        "originPlaceId": {
          "iata": "MAD"
        },
        "destinationPlaceId": {
          "iata": "SKG"
        },
        "date": {
          "year": "2024",
          "month": "11",
          "day": "30"
        }
      },
      {
        "originPlaceId": {
          "iata": "ATH"
        },
        "destinationPlaceId": {
          "iata": "FCO"
        },
        "date": {
          "year": "2024",
          "month": "12",
          "day": "10"
        }
      },
      {
        "originPlaceId": {
          "iata": "FCO"
        },
        "destinationPlaceId": {
          "iata": "LHR"
        },
        "date": {
          "year": "2024",
          "month": "12",
          "day": "20"
        }
      }
    ],
    "adults": 1,
    "childrenAges": [],
    "cabinClass": "CABIN_CLASS_ECONOMY",
    "excludedAgentsIds": [],
    "excludedCarriersIds": [],
    "includedAgentsIds": [],
    "includedCarriersIds": [],
    "nearbyAirports": false
  }
} </pre>


The response is the same as the Flights Live Prices response object.

* Multi-City is only supported for flights live prices.
* `nearbyAirports` filter has to be set to false as it's not supported for multi-search.
* Maximum 6 places are supported meaning you can have maximum 6 `queryLegs`.

## Query object

<pre>query object
├── currency
├── market
├── locale
├── queryLegs
│   └── originPlaceId
│   │   └── iata
│   │   └── entityId
│   └── destinationPlaceId
│   │   └── iata
│   │   └── entityId
│   └── date
│   │   └── year
│   │   └── month
│   │   └── day
├── adults
└── childrenAges
└── cabinClass
└── includedAgentsIds
└── excludedAgentsIds
└── includedCarriersIds
└── excludedCarriersIds
└── nearbyAirports
└── includeSustainabilityData</pre>

* Currency --> La moneda (GBP)
* Market --> El pais en el que esta el user (UK)
* Locale --> The locale you want the results in (ISO locale) (en-GB)
* Adults --> nº adultos [1-8]
* queryLegs --> All legs to be included in the query, with a maximum of 6. The legs have to be in ascending order by flight date. For return flights, the origin from the first queryLeg needs to match the destination from the last. (Query)
* cabinClass -->	The cabin class. ["CABIN_CLASS_ECONOMY", "CABIN_CLASS_PREMIUM_ECONOMY", "CABIN_CLASS_BUSINESS", "CABIN_CLASS_FIRST"]
* childrenAges -->	Number of children (0-17 years). [0-8] list-like
* includedAgentsIds -->	Only return results from those agents. Comma-separated list of agent ids.	["airg","ctuk"]
* excludedAgentsIds -->	Filter out results from those agents. Comma-separated list of agent ids.	["airg","ctuk"]
* includedCarriersIds -->	Only return results from those carriers. Comma-separated list of carrier iata codes.	["FR","U2"]
* excludedCarriersIds -->	Filter out results from those carriers. Comma-separated list of carrier iata codes.	["FR","U2"]
* nearbyAirports	Option to include airports near the specified origin airport.	true
* includeSustainabilityData	Option to include flights emissions data	true

## QUERY LEGS

* originPlaceId	--> The origin place. It needs to contain either an IATA or an entity ID.	Place
* destinationPlaceId -->	The destination place. It needs to contain either an IATA or an entity ID.	Place
* date -->	The date of flight	Date --> {year: -year-, month: -month-, day: -day-}

* iata --> The IATA code of and origin or destination city or airport	LHR
* entityId --> The internal Skyscanner ID for an origin or destination location	[95565050]

# CULTURE API

GET https://partners.api.skyscanner.net/apiservices/v3/culture/nearestculture?ipAddress={ipAddress}

`ipAddress`	The IP address of the user

