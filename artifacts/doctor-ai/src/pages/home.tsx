import { Link } from "wouter";
import { HeartPulse, MessageCircle, Stethoscope, Pill, FileText, Activity, Shield, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: MessageCircle, title: "AI Symptom Chat", desc: "Describe your symptoms and get instant guidance from our AI doctor — with voice input support." },
  { icon: Stethoscope, title: "Doctor Directory", desc: "Browse verified specialists by specialty and book appointments directly in the app." },
  { icon: Pill, title: "Medication Tracker", desc: "Keep track of your prescriptions, dosages, and schedules all in one place." },
  { icon: FileText, title: "Report Analyzer", desc: "Upload blood tests, X-rays, or prescriptions and get plain-language explanations powered by AI." },
  { icon: Activity, title: "Recovery Log", desc: "Log your daily health score and symptoms to chart your recovery progress over time." },
  { icon: Shield, title: "Private & Secure", desc: "Your health data stays yours. Secure login and private records you can trust." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-semibold text-lg">
            <HeartPulse className="h-6 w-6" />
            AI Doctor
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-32 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <Zap className="h-3.5 w-3.5" />
          Powered by GPT-5 AI
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-tight mb-6">
          Your Personal<br />
          <span className="text-primary">AI Doctor</span> Assistant
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Describe your symptoms, analyze medical reports, track medications, and find the right specialist — all in one private, AI-powered health companion.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 px-8">
              Create Free Account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="px-8">
              Sign In
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-6">
          For informational purposes only. Always consult a licensed physician for medical decisions.
        </p>
      </section>

      {/* Features */}
      <section className="bg-secondary/30 border-y border-border py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Everything you need in one place</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">A complete health assistant that works around the clock to keep you informed and cared for.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="bg-primary rounded-3xl p-12 text-primary-foreground">
          <HeartPulse className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl font-bold mb-3">Start your health journey today</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto text-lg">
            Join thousands of people using AI Doctor to understand their health better and make informed decisions.
          </p>
          <Link href="/sign-up">
            <Button size="lg" variant="secondary" className="gap-2 px-10">
              Create your free account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <HeartPulse className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">AI Doctor</span>
        </div>
        <p>AI-powered health guidance. Not a substitute for professional medical advice.</p>
      </footer>
    </div>
  );
}
