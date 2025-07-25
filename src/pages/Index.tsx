import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Sparkles, Globe, Users, Heart, LogOut, Compass } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import heroImage from "@/assets/hero-adventure.jpg";

const Index = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "Come back soon for more adventures!",
      });
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const features = [
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "Expert Curation",
      description: "Our travel experts create personalized itineraries based on your unique preferences and travel style."
    },
    {
      icon: <MapPin className="h-8 w-8" />,
      title: "Detailed Day-by-Day",
      description: "Get comprehensive daily schedules with activities, restaurants, and transportation all planned out."
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Global Destinations",
      description: "From hidden gems to popular hotspots, discover amazing places around the world tailored to you."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      location: "San Francisco",
      text: "Atlas planned the most incredible 2-week Europe trip. Every detail was perfect!",
      rating: 5
    },
    {
      name: "Michael Torres",
      location: "Austin",
      text: "The experts understood exactly what I wanted - adventure mixed with culture. Amazing experience!",
      rating: 5
    },
    {
      name: "Emma Rodriguez",
      location: "Miami",
      text: "Saved me hours of planning and gave me experiences I never would have found on my own.",
      rating: 5
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="text-center">
          <Globe className="h-12 w-12 text-primary-foreground animate-spin mx-auto mb-4" />
          <p className="text-primary-foreground">Loading your adventure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-adventure">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="font-elegant font-bold text-2xl text-foreground">Atlas</h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">
                    Welcome, {user.email}!
                  </span>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="outline" size="sm">Sign In</Button>
                  </Link>
                  <Link to="/auth">
                    <Button variant="adventure" size="sm">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/80" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 text-center animate-fade-in">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-elegant text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Your Perfect
              <span className="block bg-gradient-hero bg-clip-text text-transparent">
                Adventure Awaits
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Create personalized travel itineraries with expert curation. From hidden gems to bucket-list destinations, 
              we'll craft your perfect journey in minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              {user ? (
                <Button 
                  variant="hero" 
                  size="xl"
                  className="group"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  Plan New Adventure
                  <ArrowRight className={`ml-2 h-5 w-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                </Button>
              ) : (
                <Link to="/auth">
                  <Button 
                    variant="hero" 
                    size="xl"
                    className="group"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    Start Planning Your Trip
                    <ArrowRight className={`ml-2 h-5 w-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="xl" className="bg-background/80 backdrop-blur-sm">
                See Example Itinerary
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="text-3xl font-bold text-primary mb-2">10,000+</div>
                <div className="text-muted-foreground">Trips Planned</div>
              </div>
              <div className="text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="text-3xl font-bold text-secondary mb-2">150+</div>
                <div className="text-muted-foreground">Countries Covered</div>
              </div>
              <div className="text-center animate-slide-up" style={{ animationDelay: '0.6s' }}>
                <div className="text-3xl font-bold text-accent mb-2">4.9★</div>
                <div className="text-muted-foreground">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-elegant text-4xl md:text-5xl font-bold text-foreground mb-6">
              Why Choose Atlas?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our expert travel curation combined with personalized planning creates itineraries that are uniquely yours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card rounded-xl p-8 shadow-adventure hover:shadow-glow transition-all duration-300 hover:-translate-y-2 animate-fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="font-bold text-xl text-card-foreground mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-elegant text-4xl md:text-5xl font-bold text-foreground mb-6">
              Loved by Travelers
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of happy adventurers who've discovered their perfect trips.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-card rounded-xl p-6 shadow-adventure hover:shadow-warm transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Heart key={i} className="h-4 w-4 text-secondary fill-current" />
                  ))}
                </div>
                <p className="text-card-foreground mb-4 italic">"{testimonial.text}"</p>
                <div className="text-sm text-muted-foreground">
                  <div className="font-semibold">{testimonial.name}</div>
                  <div>{testimonial.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="font-elegant text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Ready for Your Next Adventure?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Let our travel experts create your perfect itinerary. Start planning your dream trip today.
          </p>
          {user ? (
            <Button variant="hero" size="xl" className="bg-background text-foreground hover:bg-background/90">
              Plan Your Next Trip
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="hero" size="xl" className="bg-background text-foreground hover:bg-background/90">
                Start Planning Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center">
                <Globe className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-elegant font-bold text-xl text-foreground">Atlas</span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <a href="#privacy" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#terms" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
              <span>© 2024 Atlas. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;