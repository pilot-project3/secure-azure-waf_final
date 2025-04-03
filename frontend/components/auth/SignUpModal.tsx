import React, { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SignUpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSignUpSuccess: () => void
}

export default function SignUpModal({ open, onOpenChange, onSignUpSuccess }: SignUpModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [signUpForm, setSignUpForm] = useState({
    loginId: "",
    password: "",
    confirmPassword: "",
  })

  const handleSignUpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSignUpForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 비밀번호 확인
      if (signUpForm.password !== signUpForm.confirmPassword) {
        toast.error("비밀번호가 일치하지 않습니다.")
        return
      }

      const response = await fetch("http://20.249.205.79/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loginId: signUpForm.loginId,
          password: signUpForm.password,
        }),
      })

      if (!response.ok) {
        throw new Error("회원가입에 실패했습니다.")
      }

      const data = await response.json()
      
      // 각 필드를 개별적으로 로컬 스토리지에 저장
      if (data.user) {
        localStorage.setItem("userId", data.user.id.toString())
        localStorage.setItem("tenantId", data.user.tenantId || "")
        localStorage.setItem("subscriptionID", data.user.subscriptionID || "")
        localStorage.setItem("clientId", data.user.clientId || "")
        localStorage.setItem("clientSecret", data.user.clientSecret || "")
        localStorage.setItem("webSiteUrl", data.user.webSiteUrl || "")
        localStorage.setItem("resourceGroupName", data.user.resourceGroupName || "")
        localStorage.setItem("wafApiKey", data.user.wafApiKey || "")
        localStorage.setItem("wafPolicyName", data.user.wafPolicyName || "")
      }

      toast.success("회원가입이 완료되었습니다.")
      onSignUpSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Sign up error:", error)
      toast.error("회원가입 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>회원가입</DialogTitle>
          <DialogDescription>
            새로운 계정을 생성하세요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSignUp}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="loginId">아이디</Label>
              <Input
                id="loginId"
                name="loginId"
                value={signUpForm.loginId}
                onChange={handleSignUpInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={signUpForm.password}
                onChange={handleSignUpInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={signUpForm.confirmPassword}
                onChange={handleSignUpInputChange}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "처리 중..." : "회원가입"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 