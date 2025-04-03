import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function InfrastructureTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Azure Front Door</CardTitle>
            <CardDescription>Azure Front Door 상태 및 설정</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Azure Front Door 내용 */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Azure CDN</CardTitle>
            <CardDescription>Azure CDN 상태 및 설정</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Azure CDN 내용 */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 