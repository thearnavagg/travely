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
  const mapContainerId = useRef(`map-container-${Math.random().toString(36).substr(2, 9)}`);
  const markersRef = useRef([]);
  const scriptRef = useRef(null);

  const cleanupMap = () => {
    setMapLoaded(false);
    setMapInitialized(false);
    setMapError(null);

    if (mapRef.current) {
      markersRef.current.forEach((marker) => {
        if (marker && typeof marker.remove === "function") marker.remove();
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
      if (parent) parent.appendChild(newContainer);
    }
  };

  const loadMapScript = () => {
    return new Promise((resolve, reject) => {
      if (window.mappls) {
        resolve();
        return;
      }
      if (!import.meta.env.VITE_MAPPLS_API_KEY) {
        setMapError("API key missing");
        reject(new Error("Mappls API key is not configured"));
        return;
      }
      const script = document.createElement("script");
      script.src = `https://apis.mappls.com/advancedmaps/api/${import.meta.env.VITE_MAPPLS_API_KEY}/map_sdk?layer=vector&v=3.0`;
      script.async = true;
      script.defer = true;
      script.onerror = (error) => {
        setMapError("Script loading failed");
        reject(new Error("Failed to load map script"));
      };
      script.onload = () => {
        let attempts = 0;
        const maxAttempts = 50;
        const checkMapplsLoaded = setInterval(() => {
          attempts++;
          if (window.mappls) {
            clearInterval(checkMapplsLoaded);
            resolve();
          } else if (attempts >= maxAttempts) {
            setMapError("Loading timeout");
            clearInterval(checkMapplsLoaded);
            reject(new Error("Timeout waiting for mappls to load"));
          }
        }, 100);
      };
      document.head.appendChild(script);
      scriptRef.current = script;
    });
  };

  const initMap = async () => {
    try {
      setMapLoaded(false);
      setMapError(null);
      const container = document.getElementById(mapContainerId.current);
      if (!container) throw new Error("Map container not found");
      await loadMapScript();
      if (!window.mappls) throw new Error("Mappls SDK not loaded properly");
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.minHeight = "400px";
      if (!mapRef.current) {
        const map = new window.mappls.Map(mapContainerId.current, {
          center: [28.6139, 77.209],
          zoom: 12,
          search: false,
          zoomControl: true,
          location: true,
        });
        map.on("load", () => {
          setMapLoaded(true);
          setMapError(null);
        });
        map.on("error", (error) => {
          setMapLoaded(false);
          setMapError("Map rendering error");
        });
        mapRef.current = map;
        setMapInitialized(true);
      }
    } catch (error) {
      setMapLoaded(false);
      setMapError(error.message);
      setMessages((prev) => [
        ...prev,
        { text: `Failed to load map: ${error.message}. Please try again.`, sender: "bot", suggestions: { days: [] } },
      ]);
    }
  };

  const updateMapMarkers = (suggestions) => {
    if (!mapRef.current || !mapInitialized || !suggestions?.days) return;
    markersRef.current.forEach((marker) => {
      if (marker && typeof marker.remove === "function") marker.remove();
    });
    markersRef.current = [];
    const bounds = new window.mappls.LatLngBounds();
    const markerColors = ["#FF5733", "#33FF57", "#3357FF", "#FF33F1", "#33FFF1"];
    suggestions.days.forEach((day, dayIndex) => {
      const markerColor = markerColors[dayIndex % markerColors.length];
      day.locations.forEach((loc) => {
        if (loc.lat && loc.lng) {
          const position = new window.mappls.LatLng(loc.lat, loc.lng);
          bounds.extend(position);
          const marker = new window.mappls.Marker({
            map: mapRef.current,
            position: position,
            draggable: false,
            html: `<div style="background-color: ${markerColor}; width: 30px; height: 30px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white;">${day.day}</div>`,
            popupOptions: { content: `<strong>${loc.name}</strong>`, closeButton: true },
          });
          marker.addListener("click", () => marker.openPopup());
          markersRef.current.push(marker);
        }
      });
    });
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: { top: 50, bottom: 50, left: 50, right: 50 }, maxZoom: 13 });
    }
  };

  const generateResponse = async (userMessage) => {
    try {
      const apiUrl = new URL("/chat/suggestions/", import.meta.env.VITE_API_URL);
      const response = await fetch(apiUrl.toString(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: userMessage }) });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      return { text: data.text, suggestions: data.suggestions || { days: [] } };
    } catch (error) {
      if (error.message.includes("504 Gateway Timeout")) {
        return { text: "The server took too long to respond.", suggestions: { days: [] } };
      }
      return { text: "Sorry, I encountered an error.", suggestions: { days: [] } };
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
    // Reset the map if it’s already loaded
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    const newMessages = [...messages, { text: userMessage, sender: "user" }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    try {
      const response = await generateResponse(userMessage);
      setMessages([...newMessages, { text: response.text, sender: "bot", suggestions: response.suggestions }]);
      if (mapInitialized && response.suggestions?.days?.length > 0) updateMapMarkers(response.suggestions);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const initTimeout = setTimeout(() => initMap(), 1000);
    setMessages([{ text: "Hello! Tell me your travel plans.", sender: "bot", suggestions: { days: [] } }]);
    return () => {
      clearTimeout(initTimeout);
      cleanupMap();
      if (scriptRef.current && scriptRef.current.parentNode) scriptRef.current.parentNode.removeChild(scriptRef.current);
      setMapLoaded(false);
    };
  }, []);

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
