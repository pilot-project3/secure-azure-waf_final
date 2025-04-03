"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft, FolderClosed, Tag, ShieldCheck, Network, ActivitySquare,
  Globe2, ShieldAlert, BarChart, Cloud, Webhook, NetworkIcon, Shield,
  Activity, DatabaseIcon, Monitor, Settings, FilePieChart, File, Server,
  Globe, Package, HardDrive, Database, LucideIcon, Store
} from "lucide-react"

import { getSubscriptionInfo, getResourceGroups, getResources, ResourceGroup, Resource } from "@/lib/auth"

interface ResourceSelectionPageProps {
  selectedResourceGroup: string | null
  onResourceGroupSelect: (groupId: string) => void
  onResourceSelect: (resource: Resource) => void
  onBack: () => void
}

export default function ResourceSelectionPage({
  selectedResourceGroup,
  onResourceGroupSelect,
  onResourceSelect,
  onBack,
}: ResourceSelectionPageProps) {
  const router = useRouter()
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    displayName: string
    subscriptionId: string
  } | null>(null)
  const [resourceGroups, setResourceGroups] = useState<ResourceGroup[]>([])
  const [resources, setResources] = useState<Record<string, Resource[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedResourceLoading, setSelectedResourceLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedResourceForConfirm, setSelectedResourceForConfirm] = useState<Resource | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showUrlInputDialog, setShowUrlInputDialog] = useState(false)
  const [webSiteUrl, setWebSiteUrl] = useState("")
  const [urlError, setUrlError] = useState<string | null>(null)
  const [terraformLogs, setTerraformLogs] = useState<string[]>([])
  const logEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const [showLogsDialog, setShowLogsDialog] = useState(false)
  const [isTerraformComplete, setIsTerraformComplete] = useState(false)

  // 구독 정보와 리소스 그룹 목록 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const userId = localStorage.getItem("userId")
        const subscriptionId = localStorage.getItem("subscriptionID")

        if (userId && subscriptionId) {
          const info = await getSubscriptionInfo(userId)
          setSubscriptionInfo({
            displayName: info.displayName,
            subscriptionId: info.id.split("/").pop() || "",
          })

          const groups = await getResourceGroups(userId, subscriptionId)
          setResourceGroups(groups)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        setError("데이터를 불러오는데 실패했습니다.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // WebSocket 연결 정리
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [terraformLogs])

  // 선택된 리소스 그룹의 리소스 목록 가져오기
  useEffect(() => {
    const fetchResources = async () => {
      if (!selectedResourceGroup) return

      try {
        setLoading(true)
        setError(null)
        
        const userId = localStorage.getItem("userId")
        
        if (userId) {
          // 리소스 그룹 ID에서 리소스 그룹 이름 추출
          const resourceGroupName = selectedResourceGroup.split("/").pop() || ""
          const resourceList = await getResources(userId, resourceGroupName)
          setResources(prev => ({
            ...prev,
            [selectedResourceGroup]: resourceList
          }))
        }
      } catch (error) {
        console.error("Failed to fetch resources:", error)
        setError("리소스 목록을 불러오는데 실패했습니다.")
      } finally {
        setLoading(false)
      }
    }

    fetchResources()
  }, [selectedResourceGroup])

  // 태그가 비어있는지 확인하는 함수
  const isEmptyTags = (tags: Record<string, string> | null): boolean => {
    return !tags || Object.keys(tags).length === 0
  }

  // 리소스 타입에 따른 아이콘과 색상 매핑
  const getResourceIcon = (type: string): { icon: LucideIcon; color: string } => {
    const typeLower = type.toLowerCase()
    
    if (typeLower.includes("microsoft.web/staticsites")) {
      return { icon: Globe2, color: "text-blue-500" }
    }
    if (typeLower.includes("microsoft.network/frontdoorwebapplicationfirewallpolicies")) {
      return { icon: ShieldAlert, color: "text-red-500" }
    }
    if (typeLower.includes("microsoft.operationalinsights/workspaces")) {
      return { icon: BarChart, color: "text-yellow-500" }
    }
    if (typeLower.includes("microsoft.cdn/profiles")) {
      return { icon: Cloud, color: "text-purple-500" }
    }
    if (typeLower.includes("microsoft.cdn/profiles/afdendpoints")) {
      return { icon: Webhook, color: "text-indigo-500" }
    }
    if (typeLower.includes("microsoft.network/publicipaddresses")) {
      return { icon: NetworkIcon, color: "text-cyan-500" }
    }
    if (typeLower.includes("microsoft.network/networksecuritygroups")) {
      return { icon: Shield, color: "text-orange-500" }
    }
    if (typeLower.includes("microsoft.network/virtualnetworks")) {
      return { icon: Network, color: "text-green-500" }
    }
    if (typeLower.includes("microsoft.network/networkinterfaces")) {
      return { icon: NetworkIcon, color: "text-emerald-500" }
    }
    if (typeLower.includes("microsoft.compute/virtualmachines")) {
      return { icon: Server, color: "text-pink-500" }
    }
    if (typeLower.includes("microsoft.compute/disks")) {
      return { icon: HardDrive, color: "text-rose-500" }
    }
    if (typeLower.includes("microsoft.web/sites")) {
      return { icon: Globe, color: "text-blue-500" }
    }
    if (typeLower.includes("microsoft.dbforpostgresql") || 
        typeLower.includes("microsoft.dbformysql")) {
      return { icon: Database, color: "text-green-500" }
    }
    if (typeLower.includes("microsoft.containerregistry")) {
      return { icon: Package, color: "text-purple-500" }
    }
    if (typeLower.includes("microsoft.containerservice")) {
      return { icon: Server, color: "text-orange-500" }
    }
    if (typeLower.includes("microsoft.network/applicationgateways")) {
      return { icon: Shield, color: "text-red-500" }
    }
    if (typeLower.includes("microsoft.operationalinsights") || 
        typeLower.includes("microsoft.insights")) {
      return { icon: BarChart, color: "text-yellow-500" }
    }
    if (typeLower.includes("microsoft.storage")) {
      return { icon: Store, color: "text-cyan-500" }
    }
    if (typeLower.includes("microsoft.eventhub")) {
      return { icon: Activity, color: "text-pink-500" }
    }
    if (typeLower.includes("microsoft.documentdb")) {
      return { icon: DatabaseIcon, color: "text-emerald-500" }
    }
    if (typeLower.includes("microsoft.appconfiguration")) {
      return { icon: Settings, color: "text-rose-500" }
    }
    if (typeLower.includes("microsoft.alertsmanagement")) {
      return { icon: Monitor, color: "text-amber-500" }
    }
    if (typeLower.includes("microsoft.dashboard")) {
      return { icon: FilePieChart, color: "text-sky-500" }
    }
    if (typeLower.includes("microsoft.monitor")) {
      return { icon: Activity, color: "text-violet-500" }
    }
    
    // 기본 아이콘
    return { icon: File, color: "text-gray-500" }
  }

  // 선택 가능한 리소스 타입 확인 함수
  const isSelectableResource = (type: string): boolean => {
    const typeLower = type.toLowerCase()
    return typeLower.includes("microsoft.web/staticsites")
  }

  // 생성될 리소스 목록 정의
  const resourcesToCreate = [
    {
      category: "Front Door",
      icon: Network,
      color: "text-blue-500",
      resources: [
        "Front Door Profile",
        "Front Door EndPoint",
        "Front Door Origin Group",
        "Front Door Origin",
        "Front Door Route",
        "Front Door Monitor Diagnostic"
      ]
    },
    {
      category: "Web Application Firewall (WAF)",
      icon: ShieldCheck,
      color: "text-red-500",
      resources: [
        "WAF Policy"
      ]
    },
    {
      category: "Log Analytics",
      icon: ActivitySquare,
      color: "text-yellow-500",
      resources: [
        "Log Analytics Workspace"
      ]
    }
  ]

  // URL 유효성 검사 함수
  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // 리소스 선택 핸들러 수정
  const handleResourceSelect = (resource: Resource) => {
    setSelectedResourceForConfirm(resource)
    setShowUrlInputDialog(true)
  }

  // URL 입력 확인 핸들러
  const handleUrlConfirm = () => {
    if (!validateUrl(webSiteUrl)) {
      setUrlError("올바른 URL을 입력해주세요.")
      return
    }
    setUrlError(null)
    // 프론트엔드 URL을 로컬 스토리지에 저장
    localStorage.setItem("webSiteUrl", webSiteUrl)
    setShowUrlInputDialog(false)
    setShowConfirmDialog(true)
  }

  const registerWAF = async (data: any) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000);

    try {
      const response = await fetch('http://20.249.205.79/api/waf/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('WAF 등록에 실패했습니다.');
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('WAF 등록 시간이 초과되었습니다. (10분)');
      }
      throw error
    }
  }

  // 사용자 정보 업데이트 함수
  const updateUserInfo = async (userId: string) => {
    try {
      const response = await fetch(`http://20.249.205.79/api/v1/users/update/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('사용자 정보 업데이트에 실패했습니다.')
      }

    } catch (error) {
      console.error("Failed to update user info:", error)
      toast.error("사용자 정보 업데이트에 실패했습니다.")
    }
  }

  // 사용자 정보 조회 함수
  const fetchUserInfo = async (userId: string) => {
    try {
      const response = await fetch(`http://20.249.205.79/api/v1/users/${userId}`)
      if (!response.ok) {
        throw new Error('사용자 정보 조회에 실패했습니다.')
      }
      const { user } = await response.json()
      
      // 로컬 스토리지 업데이트
      localStorage.setItem("userId", user.id.toString())
      localStorage.setItem("clientId", user.clientId || "")
      localStorage.setItem("clientSecret", user.clientSecret || "")
      localStorage.setItem("tenantId", user.tenantId || "")
      localStorage.setItem("subscriptionID", user.subscriptionID || "")
      localStorage.setItem("workSpaceID", user.workSpaceID || "")
      localStorage.setItem("webSiteUrl", user.webSiteUrl || "")
      localStorage.setItem("wafPolicyName", user.wafPolicyName || "")
      localStorage.setItem("resourceGroupName", user.resourceGroupName || "")
      localStorage.setItem("endpointUrl", user.role || "")
    } catch (error) {
      console.error("Failed to fetch user info:", error)
      toast.error("사용자 정보 조회에 실패했습니다.")
    }
  }

  const handleConfirmResourceCreation = async () => {
    try {
      setSelectedResourceLoading(true)
      setShowLogsDialog(true) // 로그 모달 표시
      const userId = localStorage.getItem("userId")
      const clientId = localStorage.getItem("clientId")
      const clientSecret = localStorage.getItem("clientSecret")
      const tenantId = localStorage.getItem("tenantId")
      const subscriptionId = localStorage.getItem("subscriptionID")
      if (!userId || !clientId || !clientSecret || !tenantId || !subscriptionId || !selectedResourceForConfirm) {
        throw new Error('필수 정보가 누락되었습니다.')
      }
      const resourceGroupName = selectedResourceGroup?.split("/").pop() || ""

      // WebSocket 연결 설정
      if (socketRef.current) {
        socketRef.current.close()
      }
      
      const socket = new WebSocket(`ws://20.249.205.79/ws/terraform-log?userId=${userId}`)
      socketRef.current = socket

      socket.onopen = () => {
        console.log("✅ WebSocket 연결됨")
        toast.message("Terraform 로그 수신을 시작합니다.")
        setTerraformLogs([]) // 이전 로그 초기화
      }

      socket.onmessage = (event) => {
        const logLine = event.data
        console.log("📦 로그 수신:", logLine)
        setTerraformLogs(prevLogs => [...prevLogs, logLine])

        if (logLine.includes("✅ Terraform 실행 완료")) {
          toast.success("WAF 생성이 완료되었습니다!")
          setIsTerraformComplete(true)
        }

        if (logLine.includes("❌ 오류 발생")) {
          toast.error("Terraform 실행 중 오류가 발생했습니다.")
        }
      }

      socket.onerror = (e) => {
        console.error("WebSocket 에러:", e)
        toast.error("로그 수신 중 WebSocket 에러가 발생했습니다.")
      }

      await registerWAF({
        userId,
        clientId,
        clientSecret,
        tenantId,
        subscriptionId,
        staticWebAppUrl: webSiteUrl,
        resourceGroupName,
      })
    } catch (error) {
      console.error("Failed to create WAF:", error)
      toast.error("WAF 생성에 실패했습니다.")
    } finally {
      setSelectedResourceLoading(false)
      setShowConfirmDialog(false)
      setSelectedResourceForConfirm(null)
    }
  }

  const handleResourceGroupSelect = (rgId: string) => {
    onResourceGroupSelect(rgId)
    // 리소스 그룹 이름을 로컬 스토리지에 저장
    const resourceGroupName = rgId.split("/").pop() || ""
    localStorage.setItem("resourceGroupName", resourceGroupName)
  }

  return (
    <>
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: '1.1rem',
            padding: '1rem 2rem',
            borderRadius: '0.5rem',
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
        }}
      />
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            뒤로
          </Button>
          <h2 className="text-2xl font-bold">리소스 선택</h2>
        </div>

        {/* 구독 정보 표시 */}
        <div className="bg-muted p-4 rounded-md mb-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium">구독 이름</p>
              <p className="text-sm font-bold">{subscriptionInfo?.displayName || "로딩 중..."}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">구독 ID</p>
              <p className="text-sm font-mono">{subscriptionInfo?.subscriptionId || "로딩 중..."}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Resource Groups */}
        {!selectedResourceGroup ? (
          <div>
            <h3 className="text-lg font-medium mb-4">리소스 그룹</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <div className="col-span-2 text-center py-8">로딩 중...</div>
              ) : (
                resourceGroups.map((rg) => (
                  <Card
                    key={rg.id}
                    className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                    onClick={() => handleResourceGroupSelect(rg.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center">
                        <FolderClosed className="h-5 w-5 mr-2" />
                        <CardTitle className="text-lg">{rg.name}</CardTitle>
                      </div>
                      <CardDescription>위치: {rg.location}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* 태그 정보 표시 */}
                      {!isEmptyTags(rg.tags) && (
                        <div className="mt-3">
                          <div className="flex items-center mb-1">
                            <Tag className="h-3 w-3 mr-1" />
                            <span className="text-xs text-muted-foreground">태그:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(rg.tags || {}).map(([key, value]) => (
                              <Badge key={key} variant="secondary" className="text-xs">
                                {key}: {value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 태그가 없는 경우 */}
                      {isEmptyTags(rg.tags) && (
                        <div className="mt-3">
                          <div className="flex items-center">
                            <Tag className="h-3 w-3 mr-1" />
                            <span className="text-xs text-muted-foreground">태그 없음</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center mb-4">
              <Button variant="ghost" size="sm" onClick={() => onResourceGroupSelect("")} className="mr-2">
                <ArrowLeft className="h-4 w-4 mr-1" />
                리소스 그룹으로 돌아가기
              </Button>
              <h3 className="text-lg font-medium">리소스</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-2 text-center py-8">로딩 중...</div>
              ) : (
                <>
                  {/* 선택 가능한 리소스 */}
                  <div className="col-span-2">
                    <h4 className="text-md font-medium mb-4 text-primary">선택 가능한 리소스</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {resources[selectedResourceGroup]?.filter(resource => isSelectableResource(resource.type)).length === 0 ? (
                        <div className="col-span-2 text-center py-12 bg-muted/50 rounded-lg">
                          <Globe2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-lg text-muted-foreground">선택 가능한 Static Web App이 없습니다.</p>
                          <p className="text-sm text-muted-foreground mt-2">이 리소스 그룹에는 Static Web App이 생성되어 있지 않습니다.</p>
                        </div>
                      ) : (
                        resources[selectedResourceGroup]?.filter(resource => isSelectableResource(resource.type)).map((resource) => {
                          const { icon: Icon, color } = getResourceIcon(resource.type)
                          return (
                            <Card
                              key={resource.id}
                              className={`cursor-pointer hover:border-primary hover:shadow-md transition-all min-h-[250px] ${
                                selectedResourceLoading ? 'pointer-events-none' : ''
                              }`}
                              onClick={() => handleResourceSelect(resource)}
                            >
                              {selectedResourceLoading && (
                                <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    <p className="text-sm text-muted-foreground">리소스 생성 중...</p>
                                  </div>
                                </div>
                              )}
                              <CardHeader className="pb-3">
                                <div className="flex items-center">
                                  <Icon className={`h-6 w-6 mr-2 ${color}`} />
                                  <CardTitle className="text-lg font-semibold">{resource.name}</CardTitle>
                                </div>
                                <div className="mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {resource.type.replace("Microsoft.", "")}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div className="flex items-center text-muted-foreground">
                                    <Globe className="h-4 w-4 mr-1" />
                                    <span>{resource.location}</span>
                                  </div>
                                  {resource.sku && (
                                    <div className="flex items-center text-muted-foreground">
                                      <Package className="h-4 w-4 mr-1" />
                                      <span>
                                        {resource.sku.name}
                                        {resource.sku.tier && ` (${resource.sku.tier})`}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <Separator />

                                {/* 태그 정보 표시 */}
                                {!isEmptyTags(resource.tags) ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <Tag className="h-3 w-3 mr-1" />
                                      <span>태그</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {Object.entries(resource.tags || {}).map(([key, value]) => (
                                        <Badge 
                                          key={key} 
                                          variant="secondary" 
                                          className="text-xs bg-secondary/50 hover:bg-secondary/80"
                                        >
                                          {key}: {value}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Tag className="h-3 w-3 mr-1" />
                                    <span>태그 없음</span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })
                      )}
                    </div>
                  </div>

                  {/* 선택 불가능한 리소스 */}
                  <div className="col-span-2">
                    <h4 className="text-md font-medium mb-4 text-muted-foreground">선택 불가능한 리소스</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {resources[selectedResourceGroup]?.filter(resource => !isSelectableResource(resource.type)).map((resource) => {
                        const { icon: Icon, color } = getResourceIcon(resource.type)
                        return (
                          <div key={resource.id} className="relative">
                            <Card
                              className="opacity-60 cursor-not-allowed min-h-[250px]"
                            >
                              <div className="absolute inset-0 flex items-center justify-center z-10">
                                <Badge variant="destructive" className="text-xs px-2 py-1">
                                  선택이 불가능한 리소스입니다
                                </Badge>
                              </div>
                              <CardHeader className="pb-3">
                                <div className="flex items-center">
                                  <Icon className={`h-6 w-6 mr-2 ${color}`} />
                                  <CardTitle className="text-lg font-semibold">{resource.name}</CardTitle>
                                </div>
                                <div className="mt-2">
                                  <Badge variant="outline" className="text-xs bg-muted">
                                    {resource.type.replace("Microsoft.", "")}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div className="flex items-center text-muted-foreground">
                                    <Globe className="h-4 w-4 mr-1" />
                                    <span>{resource.location}</span>
                                  </div>
                                  {resource.sku && (
                                    <div className="flex items-center text-muted-foreground">
                                      <Package className="h-4 w-4 mr-1" />
                                      <span>
                                        {resource.sku.name}
                                        {resource.sku.tier && ` (${resource.sku.tier})`}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <Separator />

                                {/* 태그 정보 표시 */}
                                {!isEmptyTags(resource.tags) ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <Tag className="h-3 w-3 mr-1" />
                                      <span>태그</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {Object.entries(resource.tags || {}).map(([key, value]) => (
                                        <Badge 
                                          key={key} 
                                          variant="secondary" 
                                          className="text-xs bg-muted"
                                        >
                                          {key}: {value}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Tag className="h-3 w-3 mr-1" />
                                    <span>태그 없음</span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Terraform 로그 모달 */}
      <Dialog open={showLogsDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Terraform 실행 로그</DialogTitle>
            <DialogDescription>
              WAF 생성 진행 상황을 실시간으로 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-black text-green-400 p-4 rounded-md font-mono h-[60vh] overflow-y-auto text-sm shadow">
            <pre className="whitespace-pre-wrap">
              {terraformLogs.map((log, index) => {
                // ANSI 이스케이프 코드 제거
                const cleanLog = log.replace(/\u001b\[\d+m/g, '')
                
                // 에러 메시지 처리
                if (cleanLog.includes("Error:")) {
                  return (
                    <div key={index} className="text-red-500 font-bold my-2">
                      {cleanLog}
                    </div>
                  )
                }
                // 성공 메시지 처리
                if (cleanLog.includes("✅")) {
                  return (
                    <div key={index} className="text-green-500 font-bold my-2">
                      {cleanLog}
                    </div>
                  )
                }
                // 리소스 생성 시작 메시지 처리
                if (cleanLog.includes("Creating...")) {
                  return (
                    <div key={index} className="text-yellow-500 font-semibold my-1">
                      {cleanLog}
                    </div>
                  )
                }
                // 리소스 정보 블록 처리
                if (cleanLog.includes("resource") && cleanLog.includes("will be created")) {
                  return (
                    <div key={index} className="text-blue-400 font-semibold my-2">
                      {cleanLog}
                    </div>
                  )
                }
                // 기본 로그 처리
                return (
                  <div key={index} className="text-green-400">
                    {cleanLog}
                  </div>
                )
              })}
            </pre>
            <div ref={logEndRef}></div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={async () => {
                const userId = localStorage.getItem("userId")
                if (userId) {
                  await fetchUserInfo(userId)
                }
                setShowLogsDialog(false)
                if (isTerraformComplete) {
                  router.push("/dashboard")
                }
              }}
              disabled={!terraformLogs.some(log => 
                log.includes("✅ Terraform 실행 완료") || 
                log.includes("❌ 오류 발생")
              )}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* URL 입력 모달 */}
      <Dialog open={showUrlInputDialog} onOpenChange={setShowUrlInputDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>프론트엔드 URL 입력</DialogTitle>
            <DialogDescription>
              WAF를 적용할 프론트엔드 URL을 입력해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="webSiteUrl">프론트엔드 URL</Label>
              <Input
                id="webSiteUrl"
                placeholder="https://example.com"
                value={webSiteUrl}
                onChange={(e) => {
                  setWebSiteUrl(e.target.value)
                  setUrlError(null)
                }}
                className={urlError ? "border-destructive" : ""}
              />
              {urlError && (
                <p className="text-sm text-destructive">{urlError}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUrlInputDialog(false)}>
              취소
            </Button>
            <Button onClick={handleUrlConfirm}>
              다음
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 리소스 생성 확인 모달 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>리소스 생성 확인</DialogTitle>
            <DialogDescription>
              선택한 리소스에 대해 다음 리소스들이 생성됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {resourcesToCreate.map((category) => {
              const Icon = category.icon
              return (
                <div key={category.category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${category.color}`} />
                    <h4 className="font-medium">{category.category}</h4>
                  </div>
                  <ul className="ml-7 space-y-1">
                    {category.resources.map((resource) => (
                      <li key={resource} className="text-sm text-muted-foreground">
                        • {resource}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              취소
            </Button>
            <Button onClick={handleConfirmResourceCreation} disabled={selectedResourceLoading}>
              {selectedResourceLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  생성 중...
                </>
              ) : (
                "리소스 생성"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

