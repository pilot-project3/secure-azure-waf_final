"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Banner from "@/components/layout/Banner"
import Footer from "@/components/layout/Footer"
import FrontDoorCard from "@/components/dashboard/FrontDoorCard"
import DashboardTab from "@/components/dashboard/tabs/DashboardTab"
import ManagedRulesTab from "@/components/dashboard/tabs/ManagedRulesTab"
import CountryBlockingTab from "@/components/dashboard/tabs/CountryBlockingTab"
import IpBlockingTab from "@/components/dashboard/tabs/IpBlockingTab"
import LogsTab from "@/components/dashboard/tabs/LogsTab"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Activity, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const [selectedTab, setSelectedTab] = useState("dashboard")
  const router = useRouter()

  const handleLogout = () => {
    // 로컬 스토리지의 모든 정보 삭제
    localStorage.removeItem("userId")
    localStorage.removeItem("tenantId")
    localStorage.removeItem("subscriptionID")
    localStorage.removeItem("clientId")
    localStorage.removeItem("clientSecret")
    localStorage.removeItem("webSiteUrl")
    localStorage.removeItem("resourceGroupName")
    localStorage.removeItem("wafApiKey")
    localStorage.removeItem("wafPolicyName")
    
    // 메인 페이지로 이동
    router.push("/")
  }

  // Render the appropriate tab content based on the selected tab
  const renderTabContent = () => {
    switch (selectedTab) {
      case "dashboard":
        return <DashboardTab />
      case "managed-rules":
        return <ManagedRulesTab />
      case "country-blocking":
        return <CountryBlockingTab />
      case "ip-blocking":
        return <IpBlockingTab />
      case "logs":
        return <LogsTab />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Banner />
      <main className="flex-1 container mx-auto py-8 px-4 md:px-6 lg:px-8">
        {/* 로그아웃 버튼 */}
        <div className="flex justify-end mb-6">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="bg-white hover:bg-gray-100"
          >
            로그아웃
          </Button>
        </div>

        {/* WAF Info Cards Section */}
        <div className="mb-10">
          <div className="flex items-center mb-4">
            <Activity className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-xl font-semibold">인프라 상태</h2>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <FrontDoorCard />
          </div>
        </div>

        {/* Visual separator */}
        <Separator className="my-8" />

        {/* WAF Management Section */}
        <div className="mt-10 bg-muted/20 p-6 rounded-lg border">
          <div className="flex items-center mb-6">
            <Shield className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-xl font-semibold">WAF 관리</h2>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="dashboard" value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid grid-cols-5 w-full bg-background">
              <TabsTrigger value="dashboard">대시보드</TabsTrigger>
              <TabsTrigger value="managed-rules">Azure Managed Rule Set</TabsTrigger>
              <TabsTrigger value="country-blocking">국가 차단</TabsTrigger>
              <TabsTrigger value="ip-blocking">IP 차단</TabsTrigger>
              <TabsTrigger value="logs">로그 분석</TabsTrigger>
            </TabsList>

            <div className="mt-6 bg-background p-6 rounded-md border">{renderTabContent()}</div>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}

