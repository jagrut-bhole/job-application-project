"use client";

import { useState } from "react";
import { registerSchema } from "@/types/authTypes";
import { signIn } from "next-auth/react";
import { useToast } from "@/components/ui/toast-1";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const { showToast } = useToast();

    const router = useRouter();

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const [loading, setLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const loginSchema = registerSchema.pick({
        email: true,
        password: true
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);

        const validationResult = loginSchema.safeParse({
            email,
            password
        });

        if (!validationResult.success) {
            showToast(validationResult.error.message, "error", "top-right");
            setLoading(false);
            return null;
        }

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false
            });

            if (result?.error) {
                showToast(result.error);
                setLoading(false);
                return null;
            }

            if (result?.ok) {
                showToast("Login successfull!!", "success", "top-right");
                router.push('/dashboard');
            }
        } catch (error) {
            console.log("Login Error: ", error);
            showToast("Error while signing the user", "error", "top-right");
        } finally {
            setLoading(false);
        }
    }
    return (
    <div className="overflow-y-hidden bg-[#030303]">
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 bg-[#101010] rounded-4xl py-20 px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">
              Sign In to Your Account
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Welcome back! Please enter your details.
            </p>
          </div>

          <form onSubmit={
            handleSubmit
          }>
            <div className="space-y-6">
              {/* Email */}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email..."
                  className="text-white"
                />
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="text-white pr-10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-200 hover:text-gray-400 transition-colors"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 cursor-pointer" />
                    ) : (
                      <Eye className="h-5 w-5 cursor-pointer" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-6 text-black bg-white hover:bg-white/80 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please Wait...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            <div className="text-center text-sm mt-5">
              <span className="text-gray-400">
                Don&apos;t have an account?{" "}
              </span>
              <Link
                href="/register"
                className="font-medium text-white hover:text-gray-300"
              >
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}