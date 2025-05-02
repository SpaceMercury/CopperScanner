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

## Resultado completo pero mas lento
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
