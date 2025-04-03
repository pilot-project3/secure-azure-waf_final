"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Banner from "@/components/layout/Banner"
import Footer from "@/components/layout/Footer"
import WafCreationSection from "@/components/waf/WafCreationSection"
import ResourceSelectionPage from "@/components/pages/ResourceSelectionPage"
import LoginForm from "@/components/auth/LoginForm"
import { isLoggedIn, getUserCredentials, loginUser } from "@/lib/auth"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SignUpModal from "@/components/auth/SignUpModal"

// 1. 'terraform' 단계를 제거하고 리소스 선택 후 바로 대시보드로 이동하도록 수정
// 2. 관련 상태 및 함수 수정

// Step management for the wizard
type Step = "initial" | "login" | "credentials" | "resources" | "confirm"
type SelectedResource = null | {
  id: string
  name: string
  type: string
  location: string
  sku?: any
  tags?: any
}

export default function HomePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>("initial")
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [showSignUpModal, setShowSignUpModal] = useState(false)
  const [selectedResourceGroup, setSelectedResourceGroup] = useState<string | null>(null)
  const [selectedResource, setSelectedResource] = useState<SelectedResource>(null)
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 회원가입 폼 상태
  const [signUpForm, setSignUpForm] = useState({
    loginId: "",
    password: "",
    confirmPassword: "",
  })


  // 로그인 상태 확인 및 업데이트
  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn = isLoggedIn()
      setIsUserLoggedIn(loggedIn)

      // 로그인 상태라면 저장된 자격 증명 불러오기
      if (loggedIn) {
        const savedCredentials = getUserCredentials()
        if (savedCredentials) {
          setCredentials(savedCredentials)
        }
      }
    }

    // 초기 상태 확인
    checkLoginStatus()

    // 로그인 상태 변경 감지를 위한 이벤트 리스너
    window.addEventListener('storage', checkLoginStatus)

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('storage', checkLoginStatus)
    }
  }, [])

  // 기존 terraformCode 상태와 관련 함수 제거
  const [terraformCode, setTerraformCode] = useState(``)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

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
      setShowSignUpModal(false)
      setShowCredentialsModal(true)
    } catch (error) {
      console.error("Sign up error:", error)
      toast.error("회원가입 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 로컬 스토리지에서 userId 가져오기
      const userId = localStorage.getItem("userId")

      if (!userId) {
        throw new Error("사용자 ID를 찾을 수 없습니다.")
      }

      // 자격 증명 업데이트 API 요청
      const response = await fetch(`http://20.249.205.79/api/v1/users/update/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId: credentials.tenantId,
          subscriptionID: credentials.subscriptionId,
          clientId: credentials.clientId,
          clientSecret: credentials.clientPassword,
        }),
      })

      if (!response.ok) {
        throw new Error("자격 증명 업데이트에 실패했습니다.")
      }

      // 성공 시 로컬 스토리지에 데이터 저장
      localStorage.setItem("tenantId", credentials.tenantId)
      localStorage.setItem("subscriptionID", credentials.subscriptionId)
      localStorage.setItem("clientId", credentials.clientId)
      localStorage.setItem("clientSecret", credentials.clientPassword)

      toast.success("자격 증명이 저장되었습니다.")
      setShowCredentialsModal(false)
      setCurrentStep("resources")
    } catch (error) {
      console.error("Credentials update error:", error)
      toast.error("자격 증명 저장 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResourceGroupSelect = (rgId: string) => {
    setSelectedResourceGroup(rgId)
    // 리소스 그룹 이름을 로컬 스토리지에 저장
    localStorage.setItem("resourceGroupName", rgId)
  }

  // handleResourceSelect 함수 수정 - 리소스 선택 시 바로 대시보드로 이동
  const handleResourceSelect = (resource: any) => {
    setSelectedResource(resource)
    // 리소스 선택 후 바로 대시보드로 이동
    router.push("/dashboard")
  }

  const handleTerraformSubmit = () => {
    // WAF 생성 시 선택한 리소스 그룹 이름 사용
    const resourceGroupName = localStorage.getItem("resourceGroupName")
    if (!resourceGroupName) {
      toast.error("리소스 그룹을 선택해주세요.")
      return
    }
    // Navigate to dashboard after WAF creation
    router.push("/dashboard")
  }

  const startWAFCreation = () => {
    if (isUserLoggedIn) {
      // 로그인 상태라면 저장된 자격 증명 불러오기
      const savedCredentials = getUserCredentials()
      if (savedCredentials) {
        // 저장된 자격 증명이 있으면 바로 리소스 선택 페이지로 이동
        setCredentials(savedCredentials)
        setCurrentStep("resources")
      } else {
        // 저장된 자격 증명이 없으면 자격 증명 모달 표시
        setShowCredentialsModal(true)
        setCurrentStep("credentials")
      }
    } else {
      // 로그인 상태가 아니면 로그인 페이지로 이동
      setCurrentStep("login")
    }
  }

  const handleLogin = () => {
    setCurrentStep("login")
  }

  const handleLoginSuccess = () => {
    setIsUserLoggedIn(true)

    // 로그인 성공 시 저장된 자격 증명 불러오기
    const savedCredentials = getUserCredentials()
    if (savedCredentials) {
      setCredentials(savedCredentials)
    }

    // 대시보드로 이동
    router.push("/dashboard")
  }

  const handleBackToInitial = () => {
    setCurrentStep("initial")
    setSelectedResourceGroup(null)
    setSelectedResource(null)
  }

  const handleBackToResources = () => {
    setCurrentStep("resources")
  }

  const handleCancelModal = () => {
    setShowCredentialsModal(false)
    setCurrentStep("initial")
  }

  // 회원가입 성공 핸들러 추가
  const handleSignUpSuccess = () => {
    setShowCredentialsModal(true)
  }

  // renderContent 함수에서 terraform 케이스 제거
  const renderContent = () => {
    switch (currentStep) {
      case "initial":
        return <WafCreationSection onStartWAFCreation={startWAFCreation} onLogin={handleLogin} onSignUpSuccess={handleSignUpSuccess} />

      case "login":
        return <LoginForm onLoginSuccess={handleLoginSuccess} />

      case "credentials":
        return <WafCreationSection onStartWAFCreation={startWAFCreation} onLogin={handleLogin} onSignUpSuccess={handleSignUpSuccess} />

      case "resources":
        return (
          <ResourceSelectionPage
            selectedResourceGroup={selectedResourceGroup}
            onResourceGroupSelect={handleResourceGroupSelect}
            onResourceSelect={handleResourceSelect}
            onBack={handleBackToInitial}
          />
        )

      default:
        return <WafCreationSection onStartWAFCreation={startWAFCreation} onLogin={handleLogin} onSignUpSuccess={handleSignUpSuccess} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Banner />
      <main className="flex-1 container mx-auto py-12 px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Cloud Management</h1>
        </div>
        {renderContent()}
      </main>
      <Footer />

      {/* 회원가입 모달 */}
      <SignUpModal 
        open={showSignUpModal} 
        onOpenChange={setShowSignUpModal}
        onSignUpSuccess={handleSignUpSuccess}
      />

      {/* 자격 증명 모달 */}
      <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Azure 자격 증명</DialogTitle>
            <DialogDescription>
              Azure 리소스에 접근하기 위한 자격 증명을 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCredentialsSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tenantId">Tenant ID</Label>
                <Input
                  id="tenantId"
                  name="tenantId"
                  value={credentials.tenantId}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscriptionId">Subscription ID</Label>
                <Input
                  id="subscriptionId"
                  name="subscriptionId"
                  value={credentials.subscriptionId}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  name="clientId"
                  value={credentials.clientId}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPassword">Client Secret</Label>
                <Input
                  id="clientPassword"
                  name="clientPassword"
                  type="password"
                  value={credentials.clientPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "처리 중..." : "확인"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

