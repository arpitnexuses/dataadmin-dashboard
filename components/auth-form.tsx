"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AuthFormProps {
  type: "login" | "signup";
  isAdmin?: boolean;
  showSignup?: boolean;
  variant?: "default" | "admin";
}

export function AuthForm({
  type,
  isAdmin = false,
  showSignup = false,
  variant = "default",
}: AuthFormProps) {
  const router = useRouter();
  const [formType, setFormType] = useState<"login" | "signup">(type);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const colors = {
    default: {
      primary: "#1D9EE3",
      gradient: "from-[#1D9EE3] to-[#60a5fa]",
      ring: "ring-[#1D9EE3]/20",
      hover: "hover:bg-[#1D9EE3]/90",
    },
    admin: {
      primary: "#0D9488",
      gradient: "from-[#0D9488] to-[#2DD4BF]",
      ring: "ring-[#0D9488]/20",
      hover: "hover:bg-[#0D9488]/90",
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isAdmin
        ? formType === "login"
          ? "/api/admin/login"
          : "/api/admin/signup"
        : "/api/login";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Redirect based on user role
      if (isAdmin) {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleFormType = () => {
    setFormType(formType === "login" ? "signup" : "login");
    setError("");
  };

  return (
    <div className="flex w-full min-h-screen">
      {/* Left side - Login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Image
              src="https://cdn-nexlink.s3.us-east-2.amazonaws.com/Nexuses_logo_blue_(2)_3_721ee160-2cac-429c-af66-f55b7233f6ed.png"
              alt="Nexuses Logo"
              width={250}
              height={60}
              className="object-contain"
              priority
            />
          </div>
          
          <h1 className="text-3xl font-bold mb-1">Login</h1>
          
          {error && (
            <Alert variant="destructive" className="mb-6 animate-shake">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                className="block text-sm text-gray-600"
                htmlFor="email"
              >
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5"
              />
            </div>
            
            <div className="space-y-2">
              <label
                className="block text-sm text-gray-600"
                htmlFor="password"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full text-white py-2.5 rounded-lg transition-all duration-300"
              style={{ backgroundColor: "#1D9EE3" }}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "LOGIN"
              )}
            </Button>
          </form>

          {/* <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={toggleFormType}
                className="font-medium text-[#1D9EE3] hover:underline"
              >
                Contact admin
              </button>
            </p>
          </div> */}
        </div>
      </div>

      {/* Right side - Marketing/branding section */}
      <div className="hidden md:block md:w-1/2 bg-[#1D4ED8] relative overflow-hidden">
        <Image
          src="/Login_img.png"
          alt="Marketing visual"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
