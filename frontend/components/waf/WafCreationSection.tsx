"use client"

import { Button } from "@/components/ui/button"
import { Shield, LogIn } from "lucide-react"
import FeatureCards from "@/components/waf/FeatureCards"
import { isLoggedIn } from "@/lib/auth"
import { useEffect, useState } from "react"
import SignUpModal from "@/components/auth/SignUpModal"

interface WafCreationSectionProps {
  onStartWAFCreation: () => void
  onLogin: () => void
  onSignUpSuccess: () => void
}

export default function WafCreationSection({ onStartWAFCreation, onLogin, onSignUpSuccess }: WafCreationSectionProps) {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false)
  const [showSignUpModal, setShowSignUpModal] = useState(false)

  // 로그인 상태 확인 및 업데이트
  useEffect(() => {
    const checkLoginStatus = () => {
      setIsUserLoggedIn(isLoggedIn())
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

  const handleSignUpClick = () => {
    setShowSignUpModal(true)
  }

  return (
    <div className="max-w-3xl mx-auto text-center">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">웹 애플리케이션 방화벽(WAF) 생성</h2>
      <p className="mb-8 text-muted-foreground">
        Vercel WAF는 모든 플랜에서 사용 가능하며 맞춤형 보호 전략을 정의할 수 있습니다. 사용자 지정 규칙, IP 차단,
        관리형 규칙 세트 및 공격 챌린지 모드를 통해 애플리케이션을 보호하세요.
      </p>

      {isUserLoggedIn ? (
        <Button size="lg" className="gap-2" onClick={onStartWAFCreation}>
          <Shield className="w-5 h-5" />
          WAF 생성하기
        </Button>
      ) : (
        <div className="flex gap-4 justify-center">
          <Button size="lg" className="gap-2" onClick={handleSignUpClick}>
            <LogIn className="w-5 h-5" />
            회원가입하여 WAF 생성하기
          </Button>
          <Button size="lg" variant="outline" className="gap-2" onClick={onLogin}>
            <LogIn className="w-5 h-5" />
            로그인하여 대시보드 보기
          </Button>
        </div>
      )}

      <FeatureCards />

      <SignUpModal 
        open={showSignUpModal} 
        onOpenChange={setShowSignUpModal}
        onSignUpSuccess={() => {
          setShowSignUpModal(false)
          onSignUpSuccess()
        }}
      />
    </div>
  )
}

