"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Headphones, PenTool, MessageSquare, CheckCircle2, Zap, Target, Award, Sparkles } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Use dynamic import for PricingSection to avoid SSR issues and "Lazy element" errors
const PricingSection = dynamic(() => import("@/components/PricingSection"), {
  ssr: false,
  loading: () => <div className="py-24 flex items-center justify-center font-hind-siliguri">লোড হচ্ছে...</div>
});


export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Register plugin inside useEffect for safety in Next.js
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Hero animations - Ultra Fast & Creative
      const tl = gsap.timeline({
        defaults: { ease: "power4.out" }
      });
      
      tl.from(".hero-badge", {
        y: -20,
        opacity: 0,
        duration: 0.4,
      })
      .from(".hero-title span", {
        y: 60,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
      }, "-=0.2")
      .from(".hero-desc", {
        y: 20,
        opacity: 0,
        duration: 0.5,
      }, "-=0.3")
      .from(".hero-cta-btn", {
        scale: 0.9,
        opacity: 0,
        duration: 0.4,
      }, "-=0.2")
      .from(".benefit-badge", {
        y: 10,
        opacity: 0,
        duration: 0.4,
        stagger: 0.05,
      }, "-=0.2");

        // Interactive mouse follow for grid glow effect
        const handleMouseMove = (e: MouseEvent) => {
          // Disable mouse effect in light mode
          const isDark = document.documentElement.classList.contains('dark');
          if (!isDark) return;

          const { clientX, clientY } = e;
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
          const x = clientX - rect.left;
          const y = clientY - rect.top;
          
          // Move the glow
          gsap.to(".mouse-glow", {
            x,
            y,
            duration: 0.8,
            ease: "power2.out",
          });

          // Move bubbles with different speeds for depth
          gsap.to(".hero-bubble-1", { x: (x - rect.width / 2) * 0.05, y: (y - rect.height / 2) * 0.05, duration: 1.5, ease: "power2.out" });
          gsap.to(".hero-bubble-2", { x: -(x - rect.width / 2) * 0.03, y: -(y - rect.height / 2) * 0.03, duration: 2, ease: "power2.out" });
          gsap.to(".hero-bubble-3", { x: (x - rect.width / 2) * 0.02, y: -(y - rect.height / 2) * 0.04, duration: 2.5, ease: "power2.out" });
          gsap.to(".hero-bubble-4", { x: (x - rect.width / 2) * 0.04, y: (y - rect.height / 2) * 0.02, duration: 1.8, ease: "power2.out" });
          gsap.to(".hero-bubble-5", { x: -(x - rect.width / 2) * 0.06, y: (y - rect.height / 2) * 0.03, duration: 2.2, ease: "power2.out" });
        }
      };

      window.addEventListener("mousemove", handleMouseMove);

      // Subtle floating for benefit badges
      gsap.to(".benefit-badge", {
        y: -4,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: {
          each: 0.2,
          from: "random"
        }
      });

      // Background elements animation
      gsap.to(".bg-blob", {
        x: "random(-20, 20)",
        y: "random(-20, 20)",
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 1
      });

      // Bubble floating animation
      [1, 2, 3, 4, 5].forEach((i) => {
        gsap.to(`.hero-bubble-${i}`, {
          x: "random(-30, 30)",
          y: "random(-30, 30)",
          scale: "random(0.9, 1.1)",
          duration: "random(3, 5)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.2
        });
      });

      // Scroll animations
      gsap.utils.toArray(".fade-up").forEach((el: any) => {
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
          },
          y: 30,
          opacity: 0,
          duration: 0.5,
          ease: "power3.out",
        });
      });

      gsap.utils.toArray(".stagger-item").forEach((el: any, i: number) => {
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: "top 95%",
          },
          y: 20,
          opacity: 0,
          duration: 0.4,
          delay: i * 0.05,
          ease: "power2.out",
        });
      });

      return () => window.removeEventListener("mousemove", handleMouseMove);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      title: "রিডিং",
      icon: <BookOpen className="h-6 w-6" />,
      description: "আসল আইইএলটিএস পরীক্ষার প্যাসেজ এবং প্রশ্নের ধরন দিয়ে প্র্যাকটিস করুন।",
    },
    {
      title: "লিসেনিং",
      icon: <Headphones className="h-6 w-6" />,
      description: "নেটিভ স্পিকারদের হাই-কোয়ালিটি অডিওর মাধ্যমে আপনার কানকে ট্রেন করুন।",
    },
    {
      title: "রাইটিং",
      icon: <PenTool className="h-6 w-6" />,
      description: "টাস্ক ১ এবং ২-এর বিস্তারিত ফিডব্যাক এবং ব্যান্ড স্কোর প্রেডিকশন পান।",
    },
    {
      title: "স্পিকিং",
      icon: <MessageSquare className="h-6 w-6" />,
      description: "এআই-চালিত প্র্যাকটিস সেশনের মাধ্যমে আপনার আত্মবিশ্বাস বাড়িয়ে তুলুন।",
    },
  ];

  return (
    <div ref={containerRef} className="relative overflow-hidden font-hind-siliguri">
      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex items-center justify-center pt-16 pb-16 overflow-hidden">
        {/* Apple-style Grid Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808022_1px,transparent_1px),linear-gradient(to_bottom,#80808022_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          
          {/* Mouse Glow Effect */}
          <div className="mouse-glow absolute top-0 left-0 w-[500px] h-[500px] bg-primary/30 dark:bg-primary/20 rounded-full blur-[60px] dark:blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2 opacity-0 dark:opacity-60"></div>

          {/* Floating Bubbles */}
          <div className="hero-bubble-1 absolute top-[20%] left-[15%] w-12 h-12 rounded-full bg-primary/50 dark:bg-primary/30 blur-lg dark:blur-xl"></div>
          <div className="hero-bubble-2 absolute top-[60%] right-[20%] w-16 h-16 rounded-full bg-primary/40 dark:bg-primary/20 blur-lg dark:blur-xl"></div>
          <div className="hero-bubble-3 absolute bottom-[15%] left-[40%] w-10 h-10 rounded-full bg-primary/60 dark:bg-primary/40 blur-md dark:blur-lg"></div>
          <div className="hero-bubble-4 absolute top-[40%] left-[80%] w-8 h-8 rounded-full bg-primary/50 dark:bg-primary/30 blur-sm dark:blur-md"></div>
          <div className="hero-bubble-5 absolute bottom-[30%] left-[10%] w-14 h-14 rounded-full bg-primary/40 dark:bg-primary/20 blur-lg dark:blur-xl"></div>
        </div>

        {/* Animated Background Blobs */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[40px] dark:blur-[100px] bg-blob opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-[50px] dark:blur-[120px] bg-blob opacity-20 pointer-events-none"></div>
        
        <div className="container max-w-4xl mx-auto px-4 relative z-10">
          <div className="hero-content text-center">
            <div className="hero-badge inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 text-foreground/50 text-[10px] font-bold mb-8 border border-border/20 backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="uppercase tracking-wider">বাংলাদেশের ১ নম্বর আইইএলটিএস প্ল্যাটফর্ম</span>
            </div>

            <h1 className="hero-title text-4xl md:text-5xl lg:text-7xl font-black leading-[1] mb-6 tracking-[-0.06em]">
              <span className="block mb-1">আপনার বিদেশের স্বপ্ন</span>
              <span className="block gradient-text bg-clip-text text-transparent pb-2">এখন হাতের মুঠোয়</span>
            </h1>

            <p className="hero-desc text-sm md:text-base text-muted-foreground/80 leading-relaxed mb-10 max-w-md mx-auto font-medium tracking-tight">
              আসল পরীক্ষার মতো মক টেস্ট দিন। এআই প্রযুক্তির মাধ্যমে তাৎক্ষণিক ফলাফল এবং ফিডব্যাক পেয়ে আপনার আইইএলটিএস ব্যান্ড স্কোর নিশ্চিত করুন।
            </p>

            <div className="hero-cta-btn flex justify-center mb-12">
              <Button asChild size="lg" className="h-12 px-8 text-sm font-bold rounded-xl shadow-xl dark:shadow-primary/20 hover:scale-105 transition-all duration-500 active:scale-95 group">
                <Link href="/pricing" className="flex items-center gap-2">
                  মক টেস্ট শুরু করুন
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            <div className="hero-benefits flex flex-wrap justify-center gap-4 md:gap-6">
              {[
                { icon: <Zap className="h-3.5 w-3.5" />, text: "তাৎক্ষণিক ফলাফল" },
                { icon: <Target className="h-3.5 w-3.5" />, text: "সঠিক ব্যান্ড প্রেডিকশন" },
                { icon: <Award className="h-3.5 w-3.5" />, text: "এক্সপার্ট গাইডেন্স" },
              ].map((benefit, i) => (
                <div key={i} className="benefit-badge flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/30 border border-border/20 text-[11px] font-bold text-muted-foreground/90 backdrop-blur-md hover:bg-secondary/50 transition-colors cursor-default">
                  <div className="text-primary">{benefit.icon}</div>
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 border-t border-border/50 bg-secondary/10 relative">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16 md:mb-24">
            <h2 className="fade-up text-3xl md:text-5xl font-black mb-6 tracking-tight">
              পূর্ণাঙ্গ আইইএলটিএস সলিউশন
            </h2>
            <p className="fade-up text-base md:text-lg text-muted-foreground font-medium opacity-80">
              আমরা আপনাকে দিচ্ছি একদম আসল পরীক্ষার মতো অভিজ্ঞতা, যা আপনার আত্মবিশ্বাস বাড়িয়ে তুলবে বহুগুণ।
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="stagger-item group p-8 rounded-[2rem] border border-border/40 bg-card hover:border-primary/30 hover:shadow-xl transition-all duration-500 relative overflow-hidden"
              >
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 md:py-28">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-10 md:gap-16">
            {[
              { value: "ব্যান্ড ৯", label: "পর্যন্ত পাওয়ার সুযোগ" },
              { value: "৪টি", label: "সব মডিউল কভার্ড" },
              { value: "১০০%", label: "নির্ভরযোগ্য ফিডব্যাক" },
            ].map((stat, i) => (
              <div key={i} className="fade-up text-center">
                <div className="text-4xl md:text-6xl font-black text-primary mb-3 tracking-tighter">{stat.value}</div>
                <p className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 md:py-32 border-y border-border/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-[120px] -z-10"></div>
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="fade-up text-3xl md:text-5xl font-black mb-8 leading-[1.15] tracking-tight">
                কেন আমাদের মক টেস্ট <span className="text-primary">সবার সেরা?</span>
              </h2>
              <p className="fade-up text-base md:text-lg text-muted-foreground mb-10 font-medium opacity-80">
                গতানুগতিক পদ্ধতির বাইরে আমরা ব্যবহার করি অত্যাধুনিক এআই প্রযুক্তি, যা আপনাকে দেয় নিখুঁত অ্যাসেসমেন্ট।
              </p>
              <div className="space-y-6">
                {[
                  "আসল আইইএলটিএস ইন্টারফেসের অভিজ্ঞতা",
                  "এআই-চালিত স্পিকিং এবং রাইটিং ইভ্যালুয়েশন",
                  "বিস্তারিত ব্যান্ড স্কোর ব্রেকডাউন",
                  "দুর্বলতা চিহ্নিত করে স্পেশাল গাইডলাইন",
                  "যেকোনো ডিভাইস থেকে যেকোনো সময় প্র্যাকটিস",
                ].map((item, i) => (
                  <div key={i} className="fade-up flex items-center gap-4 group">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-black transition-colors duration-300">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-base font-bold group-hover:text-primary transition-colors">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="fade-up relative">
              <div className="absolute -inset-10 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl opacity-30"></div>
              <div className="relative grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-card border border-border/40 rounded-[2rem] p-8 shadow-lg hover:-translate-y-1 transition-transform duration-300">
                    <div className="text-4xl font-black text-primary mb-2">L R</div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">রিডিং ও লিসেনিং</p>
                  </div>
                  <div className="bg-primary text-primary-foreground rounded-[2rem] p-8 shadow-lg shadow-primary/10 hover:-translate-y-1 transition-transform duration-300">
                    <div className="text-4xl font-black mb-2">W S</div>
                    <p className="text-[10px] font-black opacity-70 uppercase tracking-widest">রাইটিং ও স্পিকিং</p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="bg-card border border-border/40 rounded-[2rem] p-8 shadow-lg hover:-translate-y-1 transition-transform duration-300">
                    <div className="text-4xl font-black text-primary mb-2">AI</div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">তাৎক্ষণিক রেজাল্ট</p>
                  </div>
                  <div className="bg-card border border-border/40 rounded-[2rem] p-8 shadow-lg hover:-translate-y-1 transition-transform duration-300">
                    <div className="text-4xl font-black text-primary mb-2">BD</div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">সেরা প্ল্যাটফর্ম</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}
      <section className="py-24 md:py-32 relative border-t border-border/50">
        <div className="absolute inset-0 bg-secondary/20 dark:bg-card/40 -z-10"></div>
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="fade-up text-3xl md:text-5xl font-black text-foreground mb-6 leading-tight tracking-tight">
            অপেক্ষা কিসের? আপনার প্রস্তুতি শুরু করুন এখন!
          </h2>
          <p className="fade-up text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto font-bold leading-relaxed">
            হাজার হাজার শিক্ষার্থীর আস্থার প্রতীক ieltspracticebd। আপনার সফলতার গল্প শুরু হোক আজই।
          </p>
          <div className="fade-up flex justify-center">
            <Button asChild size="lg" className="h-16 px-10 text-lg font-black rounded-xl shadow-2xl hover:scale-105 transition-transform">
              <Link href="/pricing" className="flex items-center gap-3">
                ফ্রি টেস্ট শুরু করুন
                <ArrowRight className="h-6 w-6" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border/50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black dark:bg-[#74b602] text-white font-black text-2xl">I</div>
              <span className="text-2xl font-black tracking-tighter">
                ielts<span className="text-black dark:text-[#74b602]">practice</span>bd
              </span>
            </Link>
            <div className="flex flex-wrap justify-center gap-8">
              {[
                { label: "টেস্ট", href: "/tests" },
                { label: "প্রাইসিং", href: "/pricing" },
                { label: "আমাদের সম্পর্কে", href: "/about" },
                { label: "যোগাযোগ", href: "/contact" }
              ].map((item) => (
                <Link 
                  key={item.label} 
                  href={item.href} 
                  className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              © {new Date().getFullYear()} ieltspracticebd
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

