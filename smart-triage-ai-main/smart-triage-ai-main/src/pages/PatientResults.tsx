import { useLocation, useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ArrowLeft, Printer, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PatientData {
  id: string;
  age: number;
  gender: string;
  symptoms: string[];
  symptoms_text?: string;
  blood_pressure?: string;
  heart_rate?: number;
  temperature?: number;
  pre_existing_conditions?: string[];
  risk_level: string;
  confidence_score: number;
  recommended_department: string;
  contributing_factors: Array<{ factor: string; weight: string }>;
  ai_explanation?: string;
  explanation?: string;
}

const riskConfig = {
  Low: { color: "bg-green-500", textColor: "text-green-700", bgLight: "bg-green-50", icon: CheckCircle, label: "Low Risk" },
  Medium: { color: "bg-yellow-500", textColor: "text-yellow-700", bgLight: "bg-yellow-50", icon: Clock, label: "Medium Risk" },
  High: { color: "bg-red-500", textColor: "text-red-700", bgLight: "bg-red-50", icon: AlertTriangle, label: "High Risk" },
};

const PatientResults = () => {
  const { id } = useParams();
  const location = useLocation();
  const [patient, setPatient] = useState<PatientData | null>(location.state?.patient || null);
  const [loading, setLoading] = useState(!patient);

  useEffect(() => {
    if (!patient && id) {
      supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single()
        .then(({ data }) => {
          if (data) setPatient(data as unknown as PatientData);
          setLoading(false);
        });
    }
  }, [id, patient]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading results...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Patient not found.</p>
          <Link to="/intake"><Button>Go to Intake Form</Button></Link>
        </div>
      </div>
    );
  }

  const risk = riskConfig[patient.risk_level as keyof typeof riskConfig] || riskConfig.Medium;
  const RiskIcon = risk.icon;
  const factors = patient.contributing_factors || [];
  const explanation = patient.ai_explanation || patient.explanation || "";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/intake"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Triage Results</h1>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {/* Risk Level */}
        <Card className={`${risk.bgLight} border-none`}>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className={`${risk.color} p-3 rounded-full`}>
              <RiskIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Risk Classification</p>
              <h2 className={`text-2xl font-bold ${risk.textColor}`}>{risk.label}</h2>
              <p className="text-sm text-muted-foreground">
                Confidence: {patient.confidence_score}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Department */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommended Department</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-base px-4 py-2">
              {patient.recommended_department}
            </Badge>
          </CardContent>
        </Card>

        {/* Contributing Factors */}
        {factors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contributing Factors</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {factors.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <span>
                      <strong>{f.factor}</strong>
                      {f.weight && <span className="text-muted-foreground"> — {f.weight}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* AI Explanation */}
        {explanation && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{explanation}</p>
            </CardContent>
          </Card>
        )}

        {/* Patient Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Patient Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Age:</span> {patient.age}</div>
            <div><span className="text-muted-foreground">Gender:</span> {patient.gender}</div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Symptoms:</span>{" "}
              {patient.symptoms.join(", ")}
            </div>
            {patient.blood_pressure && (
              <div><span className="text-muted-foreground">BP:</span> {patient.blood_pressure}</div>
            )}
            {patient.heart_rate && (
              <div><span className="text-muted-foreground">HR:</span> {patient.heart_rate} bpm</div>
            )}
            {patient.temperature && (
              <div><span className="text-muted-foreground">Temp:</span> {patient.temperature}°F</div>
            )}
            {patient.pre_existing_conditions && patient.pre_existing_conditions.length > 0 && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Conditions:</span>{" "}
                {patient.pre_existing_conditions.join(", ")}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Link to="/intake" className="flex-1">
            <Button variant="outline" className="w-full">New Patient</Button>
          </Link>
          <Link to="/dashboard" className="flex-1">
            <Button className="w-full">View Dashboard</Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default PatientResults;
