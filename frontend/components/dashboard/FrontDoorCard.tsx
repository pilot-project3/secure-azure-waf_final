"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { Globe, Server, MapPin, Package, Link, Activity } from "lucide-react"

interface InfrastructureStatus {
  id: string;
  name: string;
  type: string;
  kind: string;
  location: string;
  frontDoorId: string | null;
  tags: Record<string, string>;
  sku: {
    name: string;
  };
  properties: {
    frontDoorId: string;
  };
}

export default function FrontDoorCard() {
  const [infrastructureStatus, setInfrastructureStatus] = useState<InfrastructureStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 인프라 상태 조회 함수
  const fetchInfrastructureStatus = async () => {
    try {
      const userId = localStorage.getItem('userId')
      const resourceGroupName = localStorage.getItem('resourceGroupName')
      const endpointUrl = localStorage.getItem('endpointUrl')

      if (!userId || !resourceGroupName || !endpointUrl) {
        throw new Error('Required data not found in localStorage')
      }

      const response = await fetch(
        `http://20.249.205.79/api/waf/front-door?userId=${userId}&profileName=fdProfileStaticWeb&resourceGroupName=${resourceGroupName}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch infrastructure status')
      }

      const data = await response.json()
      setInfrastructureStatus(data)
    } catch (error) {
      console.error('Error fetching infrastructure status:', error)
      setError('인프라 상태를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchInfrastructureStatus()
  }, [])

  return (
    <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">Azure Front Door</CardTitle>
        </div>
        <CardDescription className="text-sm">Azure Front Door 상태 및 설정</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[100px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">
            {error}
          </div>
        ) : infrastructureStatus ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">상태</span>
              </div>
              <Badge className="bg-green-500 hover:bg-green-600">정상</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <Server className="h-4 w-4 text-primary" />
                <div>
                  <span className="text-xs text-muted-foreground">이름</span>
                  <p className="text-sm font-medium">{infrastructureStatus.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <Package className="h-4 w-4 text-primary" />
                <div>
                  <span className="text-xs text-muted-foreground">타입</span>
                  <p className="text-sm font-medium">{infrastructureStatus.type}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <MapPin className="h-4 w-4 text-primary" />
                <div>
                  <span className="text-xs text-muted-foreground">위치</span>
                  <p className="text-sm font-medium">{infrastructureStatus.location}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <Package className="h-4 w-4 text-primary" />
                <div>
                  <span className="text-xs text-muted-foreground">SKU</span>
                  <p className="text-sm font-medium">{infrastructureStatus.sku.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              <Link className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <span className="text-xs text-muted-foreground">엔드포인트</span>
                <a 
                  href={`https://${localStorage.getItem('endpointUrl')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline block truncate"
                >
                  {`https://${localStorage.getItem('endpointUrl')}`}
                </a>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

