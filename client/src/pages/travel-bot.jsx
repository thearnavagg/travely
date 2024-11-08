import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Map, Loader2, RefreshCw } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function TravelBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapError, setMapError] = useState(null);
  const chatContainerRef = useRef(null);
  const mapRef = useRef(null);
  const mapContainerId = useRef(
    `map-container-${Math.random().toString(36).substr(2, 9)}`
  );
  const markersRef = useRef([]);
  const scriptRef = useRef(null);

  const cleanupMap = () => {
    console.log("Cleaning up map...");
    setMapLoaded(false);
    setMapInitialized(false);
    setMapError(null);

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
      console.log("Removing old container and creating new one");
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
  };

  const loadMapScript = () => {
    return new Promise((resolve, reject) => {
      console.log("Loading map script...");

      if (window.mappls) {
        console.log("Mappls already loaded");
        resolve();
        return;
      }

      if (!import.meta.env.VITE_MAPPLS_API_KEY) {
        const error = new Error("Mappls API key is not configured");
        console.error(error);
        setMapError("API key missing");
        reject(error);
        return;
      }

      const script = document.createElement("script");
      script.src =
        "https://apis.mappls.com/advancedmaps/api/" +
        import.meta.env.VITE_MAPPLS_API_KEY +
        "/map_sdk?layer=vector&v=3.0";
      script.async = true;
      script.defer = true;

      script.onerror = (error) => {
        console.error("Map script failed to load:", error);
        setMapError("Script loading failed");
        reject(new Error("Failed to load map script"));
      };

      script.onload = () => {
        console.log("Script loaded, waiting for mappls object...");
        let attempts = 0;
        const maxAttempts = 50;

        const checkMapplsLoaded = setInterval(() => {
          attempts++;
          if (window.mappls) {
            console.log("Mappls object detected");
            clearInterval(checkMapplsLoaded);
            resolve();
          } else if (attempts >= maxAttempts) {
            const error = new Error("Timeout waiting for mappls to load");
            console.error(error);
            setMapError("Loading timeout");
            clearInterval(checkMapplsLoaded);
            reject(error);
          }
        }, 100);
      };

      document.head.appendChild(script);
      scriptRef.current = script;
    });
  };

  const initMap = async () => {
    try {
      console.log("Initializing map...");
      setMapLoaded(false);
      setMapError(null);

      const container = document.getElementById(mapContainerId.current);
      if (!container) {
        throw new Error("Map container not found");
      }
      console.log("Map container found:", container);

      await loadMapScript();

      if (!window.mappls) {
        throw new Error("Mappls SDK not loaded properly");
      }
      console.log("Mappls SDK loaded successfully");

      container.style.width = "100%";
      container.style.height = "100%";
      container.style.minHeight = "400px";

      if (!mapRef.current) {
        try {
          console.log("Creating new map instance...");
          const map = new window.mappls.Map(mapContainerId.current, {
            center: [28.6139, 77.209],
            zoom: 12,
            search: false,
            zoomControl: true,
            location: true,
          });

          map.on("load", () => {
            console.log("Map loaded successfully");
            setMapLoaded(true);
            setMapError(null);
          });

          map.on("error", (error) => {
            console.error("Map error:", error);
            setMapLoaded(false);
            setMapError("Map rendering error");
          });

          mapRef.current = map;
          setMapInitialized(true);
        } catch (error) {
          console.error("Error creating map instance:", error);
          setMapError("Map creation failed");
          throw error;
        }
      }
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapLoaded(false);
      setMapError(error.message);
      setMessages((prev) => [
        ...prev,
        {
          text: `Failed to load map: ${error.message}. Please check your internet connection and try again.`,
          sender: "bot",
          suggestions: { days: [] },
        },
      ]);
    }
  };

  const updateMapMarkers = (suggestions) => {
    if (!mapRef.current || !mapInitialized || !suggestions?.days) {
      console.warn("Map not ready or no suggestions available");
      return;
    }

    try {
      console.log("Updating map markers...");
      markersRef.current.forEach((marker) => {
        if (marker && typeof marker.remove === "function") {
          marker.remove();
        }
      });
      markersRef.current = [];

      const bounds = new window.mappls.LatLngBounds();

      const markerColors = [
        "#FF5733",
        "#33FF57",
        "#3357FF",
        "#FF33F1",
        "#33FFF1",
        "#F1FF33",
        "#F4A460",
        "#FA8072",
        "#FFD700",
        "#DDA0DD",
        "#E6E6FA",
        "#FFF0F5",
        "#FF69B4",
        "#BA55D3",
        "#9370DB",
        "#7B68EE",
        "#6A5ACD",
        "#483D8B",
        "#BC8F8F",
        "#D2691E",
        "#FFB6C1",
        "#D8BFD8",
        "#DCDCDC",
        "#B0C4DE",
        "#5F9EA0",
        "#4682B4",
        "#6495ED",
        "#00CED1",
        "#20B2AA",
        "#3CB371",
      ];

      suggestions.days.forEach((day, dayIndex) => {
        const markerColor = markerColors[dayIndex % markerColors.length];

        day.locations.forEach((loc) => {
          if (loc.lat && loc.lng) {
            try {
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
                      ${loc.time || "Time not specified"}
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
            } catch (err) {
              console.error("Error creating marker:", err);
            }
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
  try {
    const apiUrl = new URL("/chat/suggestions/", import.meta.env.VITE_API_URL);

    const response = await fetch(apiUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });

    if (response.status === 504) {
      throw new Error("504 Gateway Timeout");
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || typeof data.text !== "string") {
      throw new Error("Invalid response format");
    }

    return {
      text: data.text,
      suggestions: data.suggestions || { days: [] },
    };
  } catch (error) {
    console.error("Error in generateResponse:", error);

    if (error.message.includes("504 Gateway Timeout")) {
      return {
        text: "The server took too long to respond. Please try again in a few moments.",
        suggestions: { days: [] },
      };
    }

    if (error.message.includes("Failed to fetch")) {
      return {
        text: "Unable to connect to the suggestions service. Please check your internet connection and try again.",
        suggestions: { days: [] },
      };
    } else if (error.message.includes("Invalid response format")) {
      return {
        text: "Received invalid data from the server. Please try again.",
        suggestions: { days: [] },
      };
    }

    return {
      text: "Sorry, I encountered an error. Please try again.",
      suggestions: { days: [] },
    };
  }
};


  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const newMessages = [...messages, { text: userMessage, sender: "user" }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await generateResponse(userMessage);

      setMessages([
        ...newMessages,
        {
          text: response.text,
          sender: "bot",
          suggestions: response.suggestions,
        },
      ]);

      if (mapInitialized && response.suggestions?.days?.length > 0) {
        updateMapMarkers(response.suggestions);
      }
    } catch (error) {
      console.error("Error in handleSend:", error);
      setMessages([
        ...newMessages,
        {
          text: "Sorry, I encountered an error. Please try again.",
          sender: "bot",
          suggestions: { days: [] },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([
      {
        text: "Hello! I'm your travel assistant. Tell me your place to visit and for how many days you're planning your trip.",
        sender: "bot",
        suggestions: { days: [] },
      },
    ]);
    setInput("");
    if (!mapLoaded) {
      setMapLoaded(false);
      cleanupMap();
      initMap();
    } else {
      markersRef.current.forEach((marker) => {
        if (marker && typeof marker.remove === "function") {
          marker.remove();
        }
      });
      markersRef.current = [];
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    console.log("Component mounted");
    const initTimeout = setTimeout(() => {
      initMap();
    }, 1000); // Give DOM time to properly mount

    // Add initial bot message
    setMessages([
      {
        text: "Hello! I'm your travel assistant. Tell me your place to visit and for how many days you're planning your trip.",
        sender: "bot",
        suggestions: { days: [] },
      },
    ]);

    return () => {
      console.log("Component unmounting");
      clearTimeout(initTimeout);
      cleanupMap();
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
      setMapLoaded(false);
    };
  }, []);

  const renderSuggestions = (suggestions) => {
    if (!suggestions?.days?.length) return null;

    return suggestions.days.map((day, dayIndex) => (
      <div key={dayIndex} className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="text-xs bg-blue-100 text-blue-700"
          >
            Day {day.day}
          </Badge>
          <Separator className="flex-1" />
        </div>
        <div className="space-y-1.5 pl-2">
          {day.locations.map((loc, locIndex) => (
            <div
              key={locIndex}
              className="text-sm flex items-start gap-2 hover:bg-gray-50 p-1 rounded transition-colors"
            >
              <span className="font-medium text-gray-600 min-w-[60px]">
                {loc.time || "Time not specified"}
              </span>
              <span className="text-gray-800">{loc.name}</span>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full max-w-5xl mx-auto p-4">
      <Card className="w-full shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-blue-500 to-blue-600">
          <CardTitle className="flex items-center gap-3 text-white">
            <MessageCircle className="w-6 h-6" />
            <span className="text-xl font-semibold">Travel Assistant</span>
            {!mapLoaded && (
              <Badge variant="secondary" className="ml-auto animate-pulse">
                Loading Map...
              </Badge>
            )}
            <Button
              onClick={handleNewChat}
              variant="secondary"
              size="sm"
              className="ml-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[400px] p-4">
            <div ref={chatContainerRef} className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`
                      ${
                        message.sender === "user"
                          ? "bg-blue-500 text-white ml-12"
                          : "bg-gray-100 text-gray-900 mr-12"
                      }
                      p-4 rounded-lg shadow-sm max-w-[85%] transition-all duration-200 hover:shadow-md
                    `}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.text}
                    </p>
                    {message.suggestions?.days?.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {renderSuggestions(message.suggestions)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 p-4 rounded-lg shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-sm">Processing your request...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="border-t p-4 bg-gray-50">
          <div className="flex w-full gap-2">
            <Input
              placeholder="Ask me about travel suggestions or places..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-blue-500 hover:bg-blue-600 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Card className="w-full shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-500" />
            <span>Interactive Map</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div
            id={mapContainerId.current}
            className="w-full h-[400px] rounded-b-lg"
          />
        </CardContent>
      </Card>
    </div>
  );
}
