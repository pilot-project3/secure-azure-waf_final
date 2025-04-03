"use client"

import { useRouter } from "next/navigation"

export default function Banner() {
  const router = useRouter()

  return (
    <div className="bg-primary text-primary-foreground py-12 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">클라우드 관리 플랫폼</h1>
          <p className="text-lg md:text-xl max-w-2xl">
            안전하고 효율적인 클라우드 인프라 관리를 위한 올인원 솔루션입니다. 웹 애플리케이션 방화벽(WAF)으로 보안을
            강화하세요.
          </p>
        </div>
      </div>
    </div>
  )
}

