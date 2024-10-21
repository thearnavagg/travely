"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plane, Map, Calendar, Star, ChevronRight, Menu } from "lucide-react";
import { motion } from "framer-motion";
import bgImage from "../assets/image.jpg"

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen items-center">
      <header
        className={`px-4 lg:px-6 h-16 flex items-center fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-white shadow-md" : "bg-transparent"
        }`}
      >
        <a className="flex items-center justify-center" href="#">
          <Plane className="h-6 w-6 text-primary" />
          <span className="ml-2 text-2xl font-bold text-primary">Travely</span>
        </a>
      </header>
      <main className="flex-1 pt-10">
        <section
          className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-cover bg-center"
          style={{
            backgroundImage: `url(${bgImage})`,
          }}
        >
          <div className="container px-4 md:px-6">
            <motion.div
              className="flex flex-col items-center space-y-4 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
                  AI-Powered Travel Planning Made Easy
                </h1>
                <p className="mx-auto max-w-[700px] text-white md:text-xl">
                  Discover your perfect trip with Travely. Personalized
                  itineraries, seamless bookings, and unforgettable experiences
                  await.
                </p>
              </div>
              <div className="space-x-4">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Get Started
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white text-primary hover:bg-white/90"
                >
                  Learn More
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted"
        >
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">
              Why Choose Travely?
            </h2>
            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
              {[
                {
                  icon: Map,
                  title: "Personalized Itineraries",
                  description:
                    "AI-crafted travel plans tailored to your preferences and budget.",
                },
                {
                  icon: Calendar,
                  title: "Smart Booking",
                  description:
                    "Effortlessly book flights, hotels, and activities all in one place.",
                },
                {
                  icon: Star,
                  title: "Curated Experiences",
                  description:
                    "Discover hidden gems and unique experiences recommended just for you.",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex flex-col items-center space-y-4 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <feature.icon className="h-12 w-12 text-primary" />
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">
              How Travely Works
            </h2>
            <div className="grid gap-10 lg:grid-cols-3">
              {[
                {
                  step: 1,
                  title: "Tell Us Your Dream Trip",
                  description:
                    "Share your travel preferences, dates, and budget with our AI.",
                },
                {
                  step: 2,
                  title: "Get Your Custom Itinerary",
                  description:
                    "Receive a personalized travel plan crafted by our advanced AI.",
                },
                {
                  step: 3,
                  title: "Book and Enjoy",
                  description:
                    "Easily book your entire trip and embark on your adventure!",
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  className="flex flex-col items-center space-y-4 text-center"
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-3xl font-bold text-white">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <motion.div
              className="flex flex-col items-center space-y-4 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Start Your Journey?
              </h2>
              <p className="mx-auto max-w-[600px] text-primary-foreground/90 md:text-xl">
                Join Travely today and let AI plan your next unforgettable
                adventure.
              </p>
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
              >
                Get Started
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-4 sm:flex-row py-10 w-full shrink-0 items-center justify-between px-4 md:px-6">
        <p className="text-xs text-muted-foreground">
          © 2024 Travely. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
