import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Activity, Upload, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const SYMPTOM_OPTIONS = [
  "Chest Pain", "Shortness of Breath", "Headache", "Dizziness",
  "Nausea", "Fever", "Fatigue", "Abdominal Pain",
  "Back Pain", "Cough", "Sore Throat", "Joint Pain",
  "Numbness", "Vision Problems", "Palpitations", "Swelling",
];

const CONDITION_OPTIONS = [
  "Diabetes", "Hypertension", "Asthma", "Heart Disease",
  "COPD", "Kidney Disease", "Liver Disease", "Cancer",
  "Stroke History", "Epilepsy", "Thyroid Disorder", "None",
];

const PatientIntake = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [form, setForm] = useState({
    age: "",
    gender: "",
    symptoms: [] as string[],
    symptomsText: "",
    bloodPressure: "",
    heartRate: "",
    temperature: "",
    preExistingConditions: [] as string[],
  });

  const toggleSymptom = (symptom: string) => {
    setForm((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom],
    }));
  };

  const toggleCondition = (condition: string) => {
    setForm((prev) => ({
      ...prev,
      preExistingConditions: prev.preExistingConditions.includes(condition)
        ? prev.preExistingConditions.filter((c) => c !== condition)
        : [...prev.preExistingConditions, condition],
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("health-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Call AI to parse document
      const { data: parseData, error: parseError } = await supabase.functions.invoke("triage-ai", {
        body: { action: "parse-document", filePath },
      });

      if (parseError) throw parseError;

      if (parseData?.parsed) {
        const p = parseData.parsed;
        setForm((prev) => ({
          ...prev,
          age: p.age?.toString() || prev.age,
          gender: p.gender || prev.gender,
          symptoms: p.symptoms?.length ? p.symptoms : prev.symptoms,
          bloodPressure: p.blood_pressure || prev.bloodPressure,
          heartRate: p.heart_rate?.toString() || prev.heartRate,
          temperature: p.temperature?.toString() || prev.temperature,
          preExistingConditions: p.pre_existing_conditions?.length
            ? p.pre_existing_conditions
            : prev.preExistingConditions,
        }));
        toast.success("Document parsed! Fields auto-filled.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to process document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.age || !form.gender || form.symptoms.length === 0) {
      toast.error("Please fill in age, gender, and at least one symptom.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert patient record
      const { data: patient, error: insertError } = await supabase
        .from("patients")
        .insert({
          age: parseInt(form.age),
          gender: form.gender,
          symptoms: form.symptoms,
          symptoms_text: form.symptomsText || null,
          blood_pressure: form.bloodPressure || null,
          heart_rate: form.heartRate ? parseInt(form.heartRate) : null,
          temperature: form.temperature ? parseFloat(form.temperature) : null,
          pre_existing_conditions: form.preExistingConditions.filter((c) => c !== "None"),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call AI for triage
      const { data: triageData, error: triageError } = await supabase.functions.invoke("triage-ai", {
        body: {
          action: "triage",
          patient: {
            age: parseInt(form.age),
            gender: form.gender,
            symptoms: form.symptoms,
            symptoms_text: form.symptomsText,
            blood_pressure: form.bloodPressure,
            heart_rate: form.heartRate ? parseInt(form.heartRate) : null,
            temperature: form.temperature ? parseFloat(form.temperature) : null,
            pre_existing_conditions: form.preExistingConditions.filter((c) => c !== "None"),
          },
        },
      });

      if (triageError) throw triageError;

      // Update patient with AI results
      if (triageData) {
        await supabase
          .from("patients")
          .update({
            risk_level: triageData.risk_level,
            confidence_score: triageData.confidence_score,
            recommended_department: triageData.recommended_department,
            contributing_factors: triageData.contributing_factors,
            ai_explanation: triageData.explanation,
          })
          .eq("id", patient.id);

        navigate(`/results/${patient.id}`, {
          state: { patient: { ...patient, ...triageData } },
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Patient Intake Form</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Health Document (Optional)</CardTitle>
              <CardDescription>Upload an EHR/EMR document to auto-fill fields</CardDescription>
            </CardHeader>
            <CardContent>
              <Label
                htmlFor="doc-upload"
                className="flex flex-col items-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors"
              >
                {isUploading ? (
                  <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {isUploading ? "Processing..." : "Click to upload PDF or image"}
                </span>
              </Label>
              <Input
                id="doc-upload"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </CardContent>
          </Card>

          {/* Demographics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Demographics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  min="0"
                  max="150"
                  placeholder="e.g. 45"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Symptoms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Symptoms *</CardTitle>
              <CardDescription>Select all that apply</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SYMPTOM_OPTIONS.map((symptom) => (
                  <label
                    key={symptom}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={form.symptoms.includes(symptom)}
                      onCheckedChange={() => toggleSymptom(symptom)}
                    />
                    {symptom}
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="symptoms-text">Additional symptoms (free text)</Label>
                <Textarea
                  id="symptoms-text"
                  placeholder="Describe any other symptoms..."
                  value={form.symptomsText}
                  onChange={(e) => setForm({ ...form, symptomsText: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Vitals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vitals</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bp">Blood Pressure</Label>
                <Input
                  id="bp"
                  placeholder="120/80"
                  value={form.bloodPressure}
                  onChange={(e) => setForm({ ...form, bloodPressure: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hr">Heart Rate (bpm)</Label>
                <Input
                  id="hr"
                  type="number"
                  placeholder="72"
                  value={form.heartRate}
                  onChange={(e) => setForm({ ...form, heartRate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temp">Temp (°F)</Label>
                <Input
                  id="temp"
                  type="number"
                  step="0.1"
                  placeholder="98.6"
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pre-existing conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pre-existing Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CONDITION_OPTIONS.map((condition) => (
                  <label
                    key={condition}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={form.preExistingConditions.includes(condition)}
                      onCheckedChange={() => toggleCondition(condition)}
                    />
                    {condition}
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full gap-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Submit for AI Triage"
            )}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default PatientIntake;
