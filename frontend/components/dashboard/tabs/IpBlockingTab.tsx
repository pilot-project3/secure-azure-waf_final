"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"

interface IpAddress {
  ip: string;
  type: 'blacklist' | 'whitelist';
}

interface Rule {
  name: string;
  action: 'Block' | 'Allow';
  matchConditions: Array<{
    matchVariable: string;
    matchValue: string[];
  }>;
}

interface ApiResponse {
  properties: {
    customRules: {
      rules: Rule[];
    };
  };
}

export default function IpBlockingTab() {
  // IP 주소 상태 관리
  const [ipAddresses, setIpAddresses] = useState<IpAddress[]>([])

  // 새 IP 주소 입력 상태
  const [newIp, setNewIp] = useState("")

  // 리스트 타입 상태 (blacklist 또는 whitelist)
  const [listType, setListType] = useState<'blacklist' | 'whitelist'>("blacklist")

  // 로딩 및 알림 상태
  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // IP 목록 조회 함수
  const fetchIpList = async () => {
    try {
      const userId = localStorage.getItem('userId')
      const policyName = localStorage.getItem('wafPolicyName')
      const resourceGroupName = localStorage.getItem('resourceGroupName')

      if (!userId || !policyName || !resourceGroupName) {
        console.error('Required data not found in localStorage')
        return
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

      const response = await fetch(
        `http://20.249.205.79/api/rule/rule-sets?userId=${userId}&policyName=${policyName}&resourceGroupName=${resourceGroupName}`,
        { signal: controller.signal }
      )

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to fetch IP list')
      }

      const data: ApiResponse = await response.json()
      console.log('IP 목록 응답:', data)

      // customRules에서 IP 목록 추출
      const rules = data.properties.customRules.rules
      const ipList: IpAddress[] = rules.map(rule => {
        const ip = rule.matchConditions[0].matchValue[0].split(' ')[0]
        const type: 'blacklist' | 'whitelist' = rule.action === 'Block' ? 'blacklist' : 'whitelist'
        return { ip, type }
      }).filter(item => item.ip.length > 2) // 두 글자(국가 코드)인 경우 필터링

      setIpAddresses(ipList)
    } catch (error) {
      console.error('Error fetching IP list:', error)
      setError('IP 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchIpList()
  }, [])

  // IP 주소 추가 함수
  const addIpAddress = async () => {
    console.log('addIpAddress 함수 시작')
    
    if (!newIp.trim()) {
      console.log('IP 주소가 비어있음')
      toast({
        title: "오류",
        description: "IP 주소를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    // 간단한 IP 주소 유효성 검사
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipPattern.test(newIp.trim())) {
      console.log('유효하지 않은 IP 주소 형식:', newIp.trim())
      toast({
        title: "오류",
        description: "유효한 IP 주소를 입력하세요. (예: 192.168.1.1)",
        variant: "destructive",
      })
      return
    }

    // 중복 검사
    if (ipAddresses.some((item) => item.ip === newIp.trim())) {
      console.log('중복된 IP 주소:', newIp.trim())
      toast({
        title: "오류",
        description: "이미 추가된 IP 주소입니다.",
        variant: "destructive",
      })
      return
    }

    setIsAdding(true)
    setError(null)

    try {
      const userId = localStorage.getItem('userId')
      console.log('localStorage에서 가져온 userId:', userId)
      
      if (!userId) {
        console.log('userId가 없음')
        toast({
          title: "오류",
          description: "사용자 정보가 없습니다.",
          variant: "destructive",
        })
        return
      }

      const params = new URLSearchParams({
        ip2: String(newIp.trim()),
        action: listType === 'blacklist' ? 'block' : 'allow',
        userId: userId,
        wafId: 'wafPolicyStaticWeb'
      })
      console.log('API 요청 파라미터:', Object.fromEntries(params))

      const response = await fetch(`http://20.249.205.79/api/ip?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      console.log('API 응답 상태:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.log('API 에러 응답:', errorData)
        throw new Error(errorData?.message || 'API 호출에 실패했습니다.')
      }

      const responseData = await response.json()
      console.log('API 성공 응답:', responseData)

      // IP 주소 추가
      setIpAddresses([...ipAddresses, { ip: newIp.trim(), type: listType }])
      setNewIp("")
      
      // 성공 알림 표시
      toast({
        title: "성공",
        description: `IP 주소 ${newIp.trim()}가 성공적으로 ${listType === 'blacklist' ? '차단' : '허용'} 목록에 추가되었습니다.`,
      })

      // 목록 새로고침
      fetchIpList()
    } catch (error) {
      console.error('API 요청 중 에러 발생:', error)
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : 'IP 주소 추가에 실패했습니다.',
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

  // Enter 키로도 추가 가능하도록 처리
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isAdding) {
      addIpAddress()
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>IP 차단</CardTitle>
          <CardDescription>특정 IP 주소를 차단하거나 허용합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ip-address">IP 주소</Label>
              <div className="flex mt-1.5">
                <Input
                  id="ip-address"
                  placeholder="예: 192.168.1.1"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isAdding}
                />
                <Button 
                  className="ml-2 gap-2" 
                  onClick={(e) => {
                    console.log('추가 버튼 클릭됨')
                    e.preventDefault()
                    addIpAddress()
                  }}
                  disabled={isAdding || !newIp.trim()}
                >
                  {isAdding ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      추가 중...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      추가
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>리스트 타입</Label>
              <RadioGroup 
                value={listType} 
                onValueChange={(value: 'blacklist' | 'whitelist') => setListType(value)} 
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="blacklist" id="blacklist" />
                  <Label htmlFor="blacklist">블랙리스트 (차단)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whitelist" id="whitelist" />
                  <Label htmlFor="whitelist">화이트리스트 (허용)</Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground mt-1">
                블랙리스트는 지정된 IP를 차단하고, 화이트리스트는 지정된 IP만 허용합니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>IP 목록</CardTitle>
          <CardDescription>현재 차단 및 허용된 IP 주소 목록</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-[200px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">IP 목록을 불러오는 중...</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {ipAddresses.map((ip, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-md bg-muted"
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className={`w-3 h-3 rounded-full ${
                          ip.type === 'blacklist' ? 'bg-red-500' : 'bg-green-500'
                        }`}
                      />
                      <span className="font-medium">{ip.ip.split(' ')[0]}</span>
                    </div>
                    <span className={`text-sm ${
                      ip.type === 'blacklist' ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {ip.type === 'blacklist' ? '거부됨' : '허용됨'}
                    </span>
                  </div>
                ))}
                {ipAddresses.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    등록된 IP 주소가 없습니다.
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

