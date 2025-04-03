"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Database, FileCode, Globe, Server } from "lucide-react"
import { useEffect } from "react"

// Sample resource groups
const resourceGroups = [
  { id: "rg1", name: "production-resources", type: "Resource Group", location: "East US" },
  { id: "rg2", name: "development-resources", type: "Resource Group", location: "West Europe" },
  { id: "rg3", name: "staging-resources", type: "Resource Group", location: "Southeast Asia" },
]

// Sample resources
const resources = {
  rg1: [
    { id: "res1", name: "prod-webapp", type: "Static Web App", location: "East US" },
    { id: "res2", name: "prod-vm", type: "Virtual Machine", location: "East US" },
    { id: "res3", name: "prod-storage", type: "Storage Account", location: "East US" },
    { id: "res4", name: "prod-sql", type: "SQL Database", location: "East US" },
  ],
  rg2: [
    { id: "res5", name: "dev-webapp", type: "Static Web App", location: "West Europe" },
    { id: "res6", name: "dev-function", type: "Function App", location: "West Europe" },
  ],
  rg3: [
    { id: "res7", name: "staging-vm", type: "Virtual Machine", location: "Southeast Asia" },
    { id: "res8", name: "staging-cosmos", type: "Cosmos DB", location: "Southeast Asia" },
  ],
}

interface ResourceSelectionModalProps {
  selectedResourceGroup: string | null
  onResourceGroupSelect: (rgId: string) => void
  onResourceSelect: (resource: any) => void
  onBack: () => void
  onCancel: () => void
  selectedResource: any
  onNext: () => void
  isOpen: boolean
}

export default function ResourceSelectionModal({
  selectedResourceGroup,
  onResourceGroupSelect,
  onResourceSelect,
  onBack,
  onCancel,
  selectedResource,
  onNext,
  isOpen,
}: ResourceSelectionModalProps) {
  // 테스트를 위해 리소스 그룹이 선택되면 자동으로 첫 번째 선택 가능한 리소스 선택
  useEffect(() => {
    if (selectedResourceGroup && !selectedResource && isOpen) {
      // 리소스 그룹이 선택되었지만 리소스는 아직 선택되지 않은 경우
      const timer = setTimeout(() => {
        const selectableResources = resources[selectedResourceGroup as keyof typeof resources].filter(
          (res) => res.type === "Static Web App" || res.type === "Virtual Machine",
        )

        if (selectableResources.length > 0) {
          // 첫 번째 선택 가능한 리소스 자동 선택
          onResourceSelect(selectableResources[0])
        }
      }, 500) // 0.5초 후 자동 선택

      return () => clearTimeout(timer)
    }
  }, [selectedResourceGroup, selectedResource, onResourceSelect, isOpen])

  // 테스트를 위해 모달이 열리면 자동으로 첫 번째 리소스 그룹 선택
  useEffect(() => {
    if (isOpen && !selectedResourceGroup) {
      const timer = setTimeout(() => {
        onResourceGroupSelect(resourceGroups[0].id)
      }, 500) // 0.5초 후 자동 선택

      return () => clearTimeout(timer)
    }
  }, [isOpen, selectedResourceGroup, onResourceGroupSelect])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>리소스 선택</DialogTitle>
          <DialogDescription>WAF를 적용할 리소스를 선택하세요.</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Subscription and Tenant Info */}
          <div className="bg-muted p-4 rounded-md mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">구독</p>
                <p className="text-sm text-muted-foreground">Azure Subscription</p>
              </div>
              <div>
                <p className="text-sm font-medium">테넌트</p>
                <p className="text-sm text-muted-foreground">Azure Active Directory</p>
              </div>
            </div>
          </div>

          {/* Resource Groups */}
          {!selectedResourceGroup ? (
            <div>
              <h3 className="text-sm font-medium mb-3">리소스 그룹</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resourceGroups.map((rg) => (
                  <Card
                    key={rg.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => onResourceGroupSelect(rg.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{rg.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">유형:</p>
                          <p>{rg.type}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">위치:</p>
                          <p>{rg.location}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">리소스</h3>
                <Button variant="ghost" size="sm" onClick={() => onResourceGroupSelect("")}>
                  리소스 그룹으로 돌아가기
                </Button>
              </div>

              <h4 className="text-sm font-medium mb-2">선택 가능한 리소스</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {resources[selectedResourceGroup as keyof typeof resources]
                  .filter((res) => res.type === "Static Web App" || res.type === "Virtual Machine")
                  .map((res) => (
                    <Card
                      key={res.id}
                      className={`cursor-pointer hover:border-primary transition-colors ${
                        selectedResource && selectedResource.id === res.id ? "border-primary" : ""
                      }`}
                      onClick={() => onResourceSelect(res)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                          {res.type === "Static Web App" ? (
                            <Globe className="h-4 w-4 mr-2" />
                          ) : (
                            <Server className="h-4 w-4 mr-2" />
                          )}
                          {res.name}
                        </CardTitle>
                        <CardDescription>{res.type}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm">
                          <span className="text-muted-foreground">위치:</span> {res.location}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>

              <Separator className="my-4" />

              <h4 className="text-sm font-medium mb-2">선택 불가능한 리소스</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources[selectedResourceGroup as keyof typeof resources]
                  .filter((res) => res.type !== "Static Web App" && res.type !== "Virtual Machine")
                  .map((res) => (
                    <Card key={res.id} className="opacity-60">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                          {res.type === "Storage Account" ? (
                            <Database className="h-4 w-4 mr-2" />
                          ) : (
                            <FileCode className="h-4 w-4 mr-2" />
                          )}
                          {res.name}
                        </CardTitle>
                        <CardDescription>{res.type}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm">
                          <span className="text-muted-foreground">위치:</span> {res.location}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Badge variant="outline" className="bg-muted">
                          선택 불가
                        </Badge>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onBack}>
            이전
          </Button>
          <Button type="button" disabled={!selectedResource} onClick={onNext}>
            리소스 선택 완료
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

