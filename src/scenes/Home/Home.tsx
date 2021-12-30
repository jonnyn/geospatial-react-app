import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  Button,
  Center,
  Spinner,
} from "@chakra-ui/react";
import { useQuery } from "react-query";
import { useHistory } from "react-router-dom";
import { createMap, drawPoints } from "maplibre-gl-js-amplify";
import { fetchStations } from "api";
import { AddStation, UpdateStation, DeleteStation } from "./components";

const Home = () => {
  const history = useHistory();
  const mapRef = useRef(null); // Reference to the map DOM element
  const [coordinates, setCoordinates] = useState<any>([]);

  // Queries
  const { isLoading, isError, data, error } = useQuery<IStation[], Error>(
    "allStations",
    fetchStations,
    {
      onSuccess: (data) => {
        const coords = data.map((item) => {
          return {
            coordinates: [item.longitude, item.latitude],
            title: item.provider,
            address: item.address,
          };
        });
        setCoordinates(coords);
      },
    }
  );

  // Wrapping our code in a useEffect allows us to run initializeMap after the div has been rendered into the DOM
  useEffect(() => {
    let map: any;
    async function initializeMap() {
      // We only want to initialize the underlying maplibre map after the div has been rendered
      if (mapRef.current != null) {
        map = await createMap({
          container: mapRef.current,
          center: [-123.11934, 49.24966],
          zoom: 11,
        });
      }

      map?.on("load", function () {
        drawPoints(
          "mySourceName", // Arbitrary source name
          coordinates, // An array of coordinate data, an array of Feature data, or an array of [NamedLocations](https://github.com/aws-amplify/maplibre-gl-js-amplify/blob/main/src/types.ts#L8)
          map,
          {
            showCluster: true,
            unclusteredOptions: {
              showMarkerPopup: true,
            },
            clusterOptions: {
              showCount: true,
            },
          }
        );
      });
    }

    initializeMap();

    // Cleans up and maplibre DOM elements and other resources - https://maplibre.org/maplibre-gl-js-docs/api/map/#map#remove
    return function cleanup() {
      if (map != null) map.remove();
    };
  }, [coordinates]);

  if (isLoading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  if (isError) {
    return (
      <Center>
        <Box>Error: {error?.message}</Box>;
      </Center>
    );
  }

  return (
    <Box h="full">
      <Box ref={mapRef} h="65vh" id="map" />
      <Flex p={5} direction="column">
        <Flex justify="flex-end" p={5} pb={20}>
          <AddStation />
        </Flex>
        <Table flex="1" variant="striped" size="lg">
          <TableCaption>Electric Vehicle Charging Stations</TableCaption>
          <Thead>
            <Tr>
              <Th>Station Id</Th>
              <Th>Station Address</Th>
              <Th>Provider</Th>
              <Th isNumeric>Quantity</Th>
              <Th>Availability</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data?.map(
              ({ id, address, provider, quantity, availability }: IStation) => (
                <Tr key={id}>
                  <Td>{id}</Td>
                  <Td>{address}</Td>
                  <Td>{provider}</Td>
                  <Td isNumeric>{quantity}</Td>
                  <Td>{availability ? "Yes" : "No"}</Td>
                  <Td>
                    <Box>
                      <Button
                        colorScheme="green"
                        m={3}
                        onClick={() =>
                          history.push({
                            pathname: "/detail",
                            state: { stationId: id },
                          })
                        }
                      >
                        View
                      </Button>
                      <UpdateStation updateId={id} />
                      <DeleteStation deleteId={id} />
                    </Box>
                  </Td>
                </Tr>
              )
            )}
          </Tbody>
        </Table>
      </Flex>
    </Box>
  );
};

export default Home;
