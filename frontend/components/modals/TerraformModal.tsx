// 이 파일은 더 이상 사용되지 않으므로 내용을 간소화하거나 삭제할 수 있습니다.
// 하지만 완전히 삭제하면 다른 파일에서 import 문제가 발생할 수 있으므로
// 최소한의 기능만 유지하도록 수정합니다.

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

interface TerraformModalProps {
  terraformCode: string
  onTerraformChange: (code: string) => void
  onBack: () => void
  onSubmit: () => void
  selectedResource: {
    id: string
    name: string
    type: string
    location: string
  } | null
  isOpen: boolean
}

export default function TerraformModal({
  terraformCode,
  onTerraformChange,
  onBack,
  onSubmit,
  selectedResource,
  isOpen,
}: TerraformModalProps) {
  // 간소화된 모달 - 이 컴포넌트는 더 이상 사용되지 않습니다
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onBack()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>WAF 생성</DialogTitle>
          <DialogDescription>WAF 생성 중입니다...</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={onSubmit}>
            WAF 생성 및 배포
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

