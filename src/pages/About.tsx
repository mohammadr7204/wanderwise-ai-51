import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Compass, Heart, Globe, Camera, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const About = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="font-elegant font-bold text-2xl text-foreground">Atlas</h1>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
              <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
              <Link to="/about" className="text-foreground font-medium">About</Link>
              {user ? (
                <>
                  <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
                  <span className="text-sm text-muted-foreground">Welcome, {user.email}!</span>
                </>
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
      <section className="pt-24 pb-16 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-elegant text-5xl md:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
              The Magic of
              <span className="block text-white">
                Discovery
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 leading-relaxed">
              Every journey begins with a single step, every adventure with a dream
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <Heart className="h-12 w-12 text-secondary mx-auto mb-6" />
              <h2 className="font-elegant text-4xl md:text-5xl font-bold text-foreground mb-6">
                Why We Travel
              </h2>
            </div>

            <div className="space-y-8 text-lg leading-relaxed text-muted-foreground">
              <p>
                There's a moment in every traveler's journey when the world suddenly feels infinite. 
                Maybe it's watching the sunrise paint the Himalayas in shades of gold, or getting lost 
                in the winding streets of an ancient European city where every cobblestone whispers 
                stories of centuries past.
              </p>

              <p>
                Travel isn't just about visiting new places—it's about discovering parts of yourself 
                you never knew existed. It's about the elderly woman in a Tokyo market who teaches you 
                to fold paper cranes with patient hands, or the spontaneous dance party that breaks out 
                in a bustling Marrakech square under a canopy of stars.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-16">
                <Card className="text-center p-6 border-none shadow-adventure">
                  <CardContent className="pt-6">
                    <Camera className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-bold text-xl text-card-foreground mb-2">Capture Moments</h3>
                    <p className="text-muted-foreground">Not just photographs, but memories that live in your heart forever</p>
                  </CardContent>
                </Card>
                
                <Card className="text-center p-6 border-none shadow-adventure">
                  <CardContent className="pt-6">
                    <Heart className="h-12 w-12 text-secondary mx-auto mb-4" />
                    <h3 className="font-bold text-xl text-card-foreground mb-2">Connect Deeply</h3>
                    <p className="text-muted-foreground">With cultures, with people, and most importantly, with yourself</p>
                  </CardContent>
                </Card>
                
                <Card className="text-center p-6 border-none shadow-adventure">
                  <CardContent className="pt-6">
                    <Globe className="h-12 w-12 text-accent mx-auto mb-4" />
                    <h3 className="font-bold text-xl text-card-foreground mb-2">Expand Horizons</h3>
                    <p className="text-muted-foreground">Every destination opens your mind to new possibilities</p>
                  </CardContent>
                </Card>
              </div>

              <p>
                We believe that travel is one of life's greatest teachers. It shows us that despite our 
                differences in language, culture, and tradition, we share the same hopes, dreams, and 
                capacity for kindness. It breaks down the walls we build in our minds and replaces fear 
                with wonder, prejudice with understanding.
              </p>

              <p>
                But here's the truth: planning the perfect trip can feel overwhelming. Where do you start? 
                How do you find those hidden gems that aren't in every guidebook? How do you ensure your 
                precious vacation time is spent creating memories, not dealing with logistics disasters?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Atlas Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Compass className="h-16 w-16 text-primary mx-auto mb-8" />
            <h2 className="font-elegant text-4xl md:text-5xl font-bold text-foreground mb-8">
              Why Atlas is Your Perfect Travel Companion
            </h2>
            
            <div className="text-lg leading-relaxed text-muted-foreground space-y-6 mb-12">
              <p>
                That's where Atlas comes in. We're not just another booking platform or generic itinerary 
                generator. We're your personal travel storytellers, your adventure architects, your 
                dream-to-reality translators.
              </p>
              
              <p>
                Our expert travel curators don't just know destinations—they understand the soul of travel. 
                They've walked the hidden paths of Kyoto at dawn, shared meals with families in Tuscan 
                farmhouses, and danced until sunrise on Caribbean beaches. They know which local guide 
                will show you the secret waterfall, which restaurant serves the pasta that will make you 
                weep with joy, and which sunset viewpoint will leave you speechless.
              </p>
              
              <p>
                When you trust Atlas with your travel dreams, you're not just getting an itinerary—you're 
                getting a masterpiece crafted by people who understand that travel isn't about checking 
                boxes. It's about moments that take your breath away, connections that change your 
                perspective, and experiences that become part of who you are.
              </p>
            </div>

            <div className="bg-gradient-hero rounded-2xl p-8 text-center">
              <h3 className="font-elegant text-2xl font-bold text-primary-foreground mb-4">
                Ready to Turn Your Travel Dreams Into Reality?
              </h3>
              <p className="text-primary-foreground/90 mb-6 text-lg">
                Let our experts craft your perfect adventure. Every detail, every moment, every memory—carefully curated just for you.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Link to="/create-trip">
                    <Button variant="hero" size="xl" className="bg-background text-foreground hover:bg-background/90">
                      Start Planning Your Adventure
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button variant="hero" size="xl" className="bg-background text-foreground hover:bg-background/90">
                      Begin Your Journey
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
                
                <Link to="/pricing">
                  <Button variant="outline" size="xl" className="bg-background/20 backdrop-blur-sm text-primary-foreground border-primary-foreground hover:bg-background/30">
                    View Our Plans
                    <MapPin className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center">
                <Globe className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-elegant font-bold text-xl text-foreground">Atlas</span>
            </Link>
            
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <a href="#privacy" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#terms" className="hover:text-foreground transition-colors">Terms</a>
              <span>© 2024 Atlas. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;