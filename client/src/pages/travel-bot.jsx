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
  const scriptRef = useRef(null);

  const cleanupMap = () => {
    if (mapRef.current) {
      markersRef.current.forEach((marker) => {
        if (marker && typeof marker.remove === "function") {
          marker.remove();
        }
      });
      markersRef.current = [];

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
          "/map_sdk?layer=vector&v=3.0&callback=initMap1";
        script.async = true;
        script.defer = true;

        script.onload = () => {
          setTimeout(resolve, 1000);
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

  const updateMapMarkers = (suggestions) => {
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

      const bounds = new window.mappls.LatLngBounds();

      suggestions.forEach((day) => {
        day.locations.forEach((loc) => {
          try {
            const position = new window.mappls.LatLng(loc.lat, loc.lng);
            bounds.extend(position);

            const marker = new window.mappls.Marker({
              map: mapRef.current,
              position: position,
              draggable: false,
              popupHtml: `
                <div style="padding: 10px;">
                  <strong>${loc.name}</strong><br/>
                  ${loc.time}
                </div>
              `,
              className: "custom-marker",
            });

            marker.addPopup(marker.getPopup());
            markersRef.current.push(marker);
          } catch (err) {
            console.error("Error creating marker:", err);
          }
        });
      });

      if (!bounds.isEmpty()) {
        mapRef.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 13,
        });
      }
    } catch (error) {
      console.error("Error updating markers:", error);
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
    ];

    return {
      text: "Here are my suggestions for your trip:",
      suggestions,
    };
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { text: input, sender: "user" }];
    setMessages(newMessages);
    setInput("");

    const response = await generateResponse(input);

    setMessages([
      ...newMessages,
      { text: response.text, sender: "bot", suggestions: response.suggestions },
    ]);

    if (mapInitialized) {
      updateMapMarkers(response.suggestions);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100 p-4 gap-4">
      {/* Chat Section */}
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            TravelBot Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea
            className="h-[calc(100vh-12rem)] lg:h-[calc(100vh-16rem)]"
            ref={chatContainerRef}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex items-start gap-2 max-w-[80%] ${
                    message.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar>
                    <AvatarFallback>
                      {message.sender === "user" ? "U" : "B"}
                    </AvatarFallback>
                    <AvatarImage
                      src={
                        message.sender === "user"
                          ? "/placeholder.svg?height=40&width=40"
                          : "/placeholder.svg?height=40&width=40"
                      }
                    />
                  </Avatar>
                  <div
                    className={`p-4 rounded-lg ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <p>{message.text}</p>
                    {message.suggestions && (
                      <div className="mt-2">
                        {message.suggestions.map((day, dayIndex) => (
                          <div key={dayIndex} className="mb-2">
                            <h4 className="font-bold">Day {day.day}:</h4>
                            {day.locations.map((loc, locIndex) => (
                              <p key={locIndex}>
                                {loc.time} - {loc.name}
                              </p>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex w-full items-center space-x-2"
          >
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for travel suggestions..."
              className="flex-1"
            />
            <Button type="submit">
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </form>
        </CardFooter>
      </Card>

      {/* Map Section */}
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            Trip Map
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 relative">
          <div
            id={mapContainerId.current}
            className="absolute inset-0 rounded-lg"
            style={{
              minHeight: "400px",
              width: "100%",
              height: "100%",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
