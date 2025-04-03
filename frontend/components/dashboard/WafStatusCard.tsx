import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function WafStatusCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">WAF</CardTitle>
        <CardDescription>Web Application Firewall 상태</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">정책</span>
            <span className="text-sm font-medium">wafpolicy</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">모드</span>
            <Badge>Prevention</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">마지막 업데이트</span>
            <span className="text-sm font-medium">2025-03-26</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

