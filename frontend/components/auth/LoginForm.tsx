"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, User, AlertCircle } from "lucide-react"
import { loginUser } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface LoginFormProps {
  onLoginSuccess: () => void
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const user = await loginUser(loginId, password)
      if (user) {
        router.push("/dashboard")
      }
    } catch (err) {
      setError("로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">로그인</CardTitle>
        <CardDescription>WAF 생성을 위해 로그인해주세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="warning" className="bg-yellow-50 border-yellow-200 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="loginId">아이디</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="loginId"
                type="text"
                placeholder="아이디를 입력하세요"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col justify-center border-t pt-4 gap-2">
        <p className="text-sm text-muted-foreground">테스트 계정: project03-id / project03-pw</p>
      </CardFooter>
    </Card>
  )
}

