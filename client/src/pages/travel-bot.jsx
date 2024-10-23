import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Map } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function TravelBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const chatContainerRef = useRef(null);
  const mapRef = useRef(null);
  const mapContainerId = useRef(
    `map-container-${Math.random().toString(36).substr(2, 9)}`
  );
  const markersRef = useRef([]);
  const routesRef = useRef([]);
  const scriptRef = useRef(null);

  const cleanupMap = () => {
    if (mapRef.current) {
      markersRef.current.forEach((marker) => {
        if (marker && typeof marker.remove === "function") {
          marker.remove();
        }
      });
      markersRef.current = [];

      routesRef.current.forEach((route) => {
        if (route && typeof route.remove === "function") {
          route.remove();
        }
      });
      routesRef.current = [];

      mapRef.current.remove();
      mapRef.current = null;
    }

    const oldContainer = document.getElementById(mapContainerId.current);
    if (oldContainer) {
      const parent = oldContainer.parentElement;
      const newContainer = document.createElement("div");
      newContainer.id = mapContainerId.current;
      newContainer.style.width = "100%";
      newContainer.style.height = "100%";
      newContainer.style.minHeight = "400px";
      oldContainer.remove();
      if (parent) {
        parent.appendChild(newContainer);
      }
    }

    setMapInitialized(false);
  };

  useEffect(() => {
    const loadMapScript = () => {
      return new Promise((resolve, reject) => {
        if (window.mappls) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src =
          "https://apis.mappls.com/advancedmaps/api/" +
          import.meta.env.VITE_MAPPLS_API_KEY +
          "/map_sdk?layer=vector&v=3.0&libraries=direction";
        script.async = true;
        script.defer = true;

        script.onload = () => {
          const checkMapplsLoaded = setInterval(() => {
            if (window.mappls) {
              clearInterval(checkMapplsLoaded);
              resolve();
            }
          }, 100);

          setTimeout(() => {
            clearInterval(checkMapplsLoaded);
            reject(new Error("Timeout waiting for mappls to load"));
          }, 10000);
        };

        script.onerror = reject;

        document.head.appendChild(script);
        scriptRef.current = script;
      });
    };

    const initMap = async () => {
      try {
        await loadMapScript();

        const container = document.getElementById(mapContainerId.current);
        if (!container) {
          throw new Error("Map container not found");
        }

        container.style.width = "100%";
        container.style.height = "100%";
        container.style.minHeight = "400px";

        if (!mapRef.current) {
          const map = new window.mappls.Map(mapContainerId.current, {
            center: [28.6139, 77.209], // Delhi
            zoom: 12,
            search: false,
            zoomControl: true,
            location: true,
          });

          mapRef.current = map;
          setMapInitialized(true);
          setMapLoaded(true);
        }
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    initMap();

    return () => {
      cleanupMap();
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
      setMapLoaded(false);
    };
  }, []);

  const updateMapMarkersAndRoutes = async (suggestions) => {
    if (!mapRef.current || !mapInitialized) {
      console.warn("Map not ready yet");
      return;
    }

    try {
      markersRef.current.forEach((marker) => {
        if (marker && typeof marker.remove === "function") {
          marker.remove();
        }
      });
      markersRef.current = [];

      routesRef.current.forEach((route) => {
        if (route && typeof route.remove === "function") {
          route.remove();
        }
      });
      routesRef.current = [];

      const bounds = new window.mappls.LatLngBounds();
      const markerColors = [
        "#FF5733",
        "#33FF57",
        "#3357FF",
        "#FF33F1",
        "#33FFF1",
        "#F1FF33",
      ];

      for (const day of suggestions) {
        const markerColor = markerColors[(day.day - 1) % markerColors.length];

        for (let i = 0; i < day.locations.length; i++) {
          const loc = day.locations[i];
          const position = new window.mappls.LatLng(loc.lat, loc.lng);
          bounds.extend(position);

          const marker = new window.mappls.Marker({
            map: mapRef.current,
            position: position,
            draggable: false,
            html: `<div style="background-color: ${markerColor}; width: 30px; height: 30px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold;">${day.day}</div>`,
            popupOptions: {
              content: `
                <div style="padding: 10px;">
                  <strong>Day ${day.day}: ${loc.name}</strong><br/>
                  ${loc.time}
                </div>
              `,
              closeButton: true,
              autoClose: false,
            },
          });

          marker.addListener("click", function () {
            marker.openPopup();
          });

          markersRef.current.push(marker);

          // Draw route to next location
          if (i < day.locations.length - 1) {
            const nextLoc = day.locations[i + 1];
            const routePromise = new Promise((resolve, reject) => {
              // Calculate distance between the two locations
              mappls.getDistance(
                {
                  coordinates: `${loc.lat},${loc.lng};${nextLoc.lat},${nextLoc.lng}`,
                },
                function (data) {
                  if (data && data.results && data.results.length > 0) {
                    const distance = data.results[0].distance; // Get distance in meters
                    const travelTime = Math.round(
                      data.results[0].duration / 60
                    ); // Convert travel time to minutes
                    loc.distanceToNext = `${(distance / 1000).toFixed(2)} km`;
                    loc.travelTimeToNext = `${travelTime} minutes`;

                    // Draw route on the map
                    window.mappls.direction({
                      map: mapRef.current,
                      start: `${loc.lat},${loc.lng}`,
                      end: `${nextLoc.lat},${nextLoc.lng}`,
                      resource: "route",
                      profile: "driving",
                      rtype: 0,
                      callback: function (routeData) {
                        if (routeData.status === "success") {
                          const route = new window.mappls.Polyline({
                            map: mapRef.current,
                            path: routeData.routes[0].geometry.coordinates,
                            strokeColor: markerColor,
                            strokeOpacity: 0.8,
                            strokeWeight: 4,
                          });
                          routesRef.current.push(route);
                          resolve();
                        } else {
                          reject(new Error("Route calculation failed"));
                        }
                      },
                    });
                  } else {
                    reject(new Error("Distance calculation failed"));
                  }
                }
              );
            });

            try {
              await routePromise;
            } catch (error) {
              console.error("Error calculating distance or route:", error);
            }
          }
        }
      }

      if (!bounds.isEmpty()) {
        mapRef.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 13,
        });
      }
    } catch (error) {
      console.error("Error updating markers and routes:", error);
    }
  };

  const generateResponse = async (userMessage) => {
    const suggestions = [
      {
        day: 1,
        locations: [
          {
            name: "India Gate",
            lat: 28.612912,
            lng: 77.22951,
            time: "09:00 AM",
          },
          {
            name: "Red Fort",
            lat: 28.656159,
            lng: 77.24102,
            time: "02:00 PM",
          },
        ],
      },
      {
        day: 2,
        locations: [
          {
            name: "Qutub Minar",
            lat: 28.524428,
            lng: 77.185455,
            time: "10:00 AM",
          },
          {
            name: "Lotus Temple",
            lat: 28.553501,
            lng: 77.258824,
            time: "01:00 PM",
          },
        ],
      },
    ];

    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", content: userMessage },
    ]);
    setInput("");

    // Simulate an AI response
    setTimeout(() => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "bot", content: "Here are the suggestions for your trip!" },
      ]);

      updateMapMarkersAndRoutes(suggestions);
    }, 1000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (input.trim() !== "") {
      generateResponse(input.trim());
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle className="text-lg font-bold">
            Travel Suggestion Bot
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <ScrollArea className="h-[400px]" ref={chatContainerRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "bot" && (
                    <Avatar className="mr-2">
                      <AvatarImage
                        src="https://via.placeholder.com/40"
                        alt="Bot"
                      />
                      <AvatarFallback>Bot</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg p-2 max-w-xs ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-black"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <form className="w-full flex gap-2" onSubmit={handleSubmit}>
            <Input
              type="text"
              placeholder="Ask for suggestions..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button type="submit">
              <Send className="mr-2 h-4 w-4" /> Send
            </Button>
          </form>
        </CardFooter>
      </Card>

      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Map Suggestions</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <div id={mapContainerId.current} style={{ height: "100%" }}></div>
        </CardContent>
      </Card>
    </div>
  );
}
