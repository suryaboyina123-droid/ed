import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, ArrowLeft, RefreshCw, Users, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Patient = Tables<"patients">;

const RISK_COLORS: Record<string, string> = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#22c55e",
};

const Dashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [filterDept, setFilterDept] = useState<string>("all");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load patients");
    } else {
      setPatients(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const generateSyntheticData = async () => {
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke("triage-ai", {
        body: { action: "generate-synthetic" },
      });
      if (error) throw error;
      toast.success("Synthetic patients generated!");
      await fetchPatients();
    } catch {
      toast.error("Failed to generate data");
    } finally {
      setGenerating(false);
    }
  };

  const filtered = patients.filter((p) => {
    if (filterRisk !== "all" && p.risk_level !== filterRisk) return false;
    if (filterDept !== "all" && p.recommended_department !== filterDept) return false;
    return true;
  });

  // Sort by risk: High first
  const riskOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
  const sorted = [...filtered].sort(
    (a, b) => (riskOrder[a.risk_level || "Low"] ?? 3) - (riskOrder[b.risk_level || "Low"] ?? 3)
  );

  // Charts data
  const riskCounts = ["High", "Medium", "Low"].map((level) => ({
    name: level,
    value: patients.filter((p) => p.risk_level === level).length,
  }));

  const departments = Array.from(new Set(patients.map((p) => p.recommended_department).filter(Boolean)));
  const deptData = departments.map((dept) => ({
    name: dept,
    count: patients.filter((p) => p.recommended_department === dept).length,
  }));

  const riskBadge = (level: string | null) => {
    const colors: Record<string, string> = {
      High: "bg-red-100 text-red-700",
      Medium: "bg-yellow-100 text-yellow-700",
      Low: "bg-green-100 text-green-700",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[level || ""] || "bg-muted text-muted-foreground"}`}>
        {level || "Pending"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Staff Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={fetchPatients}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button size="sm" className="gap-2" onClick={generateSyntheticData} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
              Generate Sample Data
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{patients.length}</p>
              <p className="text-xs text-muted-foreground">Total Patients</p>
            </CardContent>
          </Card>
          {["High", "Medium", "Low"].map((level) => (
            <Card key={level}>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold" style={{ color: RISK_COLORS[level] }}>
                  {patients.filter((p) => p.risk_level === level).length}
                </p>
                <p className="text-xs text-muted-foreground">{level} Risk</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Risk Distribution</CardTitle></CardHeader>
            <CardContent>
              {riskCounts.some((r) => r.value > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={riskCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {riskCounts.map((entry) => (
                        <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Department Load</CardTitle></CardHeader>
            <CardContent>
              {deptData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={deptData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(187, 70%, 38%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <Select value={filterRisk} onValueChange={setFilterRisk}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Risk Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risks</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d!}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Patient Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Patient Queue ({sorted.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-4">Loading...</p>
            ) : sorted.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No patients found. Generate sample data to get started.</p>
            ) : (
              <div className="space-y-2">
                {sorted.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatient(selectedPatient?.id === p.id ? null : p)}
                    className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {riskBadge(p.risk_level)}
                        <span className="text-sm font-medium">
                          {p.gender}, Age {p.age}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {p.recommended_department || "Pending"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    {selectedPatient?.id === p.id && (
                      <div className="mt-3 pt-3 border-t text-sm space-y-2">
                        <div><strong>Symptoms:</strong> {p.symptoms.join(", ")}</div>
                        {p.blood_pressure && <div><strong>BP:</strong> {p.blood_pressure}</div>}
                        {p.heart_rate && <div><strong>HR:</strong> {p.heart_rate} bpm</div>}
                        {p.temperature && <div><strong>Temp:</strong> {p.temperature}°F</div>}
                        {p.pre_existing_conditions && p.pre_existing_conditions.length > 0 && (
                          <div><strong>Conditions:</strong> {p.pre_existing_conditions.join(", ")}</div>
                        )}
                        {p.confidence_score && (
                          <div><strong>Confidence:</strong> {p.confidence_score}%</div>
                        )}
                        {p.ai_explanation && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <strong>AI Reasoning:</strong> {p.ai_explanation}
                          </div>
                        )}
                        <Link to={`/results/${p.id}`}>
                          <Button size="sm" variant="outline" className="mt-2">View Full Results</Button>
                        </Link>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
