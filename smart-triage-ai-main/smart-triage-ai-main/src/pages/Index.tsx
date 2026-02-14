import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Shield, Users, Brain, BarChart3, FileText } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-foreground">TriageAI</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link to="/intake">
              <Button variant="outline" size="sm">Patient Intake</Button>
            </Link>
            <Link to="/dashboard">
              <Button size="sm">Staff Dashboard</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Brain className="h-4 w-4" />
            AI-Powered Healthcare Triage
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
            Smarter Patient Triage,{" "}
            <span className="text-primary">Faster Care</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our AI analyzes patient symptoms and medical history to classify risk levels,
            recommend departments, and provide explainable insights — reducing wait times
            and improving outcomes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/intake">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <FileText className="h-5 w-5" />
                I'm a Patient
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                <BarChart3 className="h-5 w-5" />
                Staff Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="border-none shadow-md bg-card">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Risk Classification</h3>
              <p className="text-sm text-muted-foreground">
                AI classifies patients into Low, Medium, or High risk levels with confidence scores.
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-card">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Dept. Recommendation</h3>
              <p className="text-sm text-muted-foreground">
                Automatically routes patients to the appropriate department based on symptoms.
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-card">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Explainable AI</h3>
              <p className="text-sm text-muted-foreground">
                Transparent reasoning shows contributing factors behind every classification.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">Built for Healthcare AI · TriageAI © 2026

        </div>
      </footer>
    </div>);

};

export default Index;