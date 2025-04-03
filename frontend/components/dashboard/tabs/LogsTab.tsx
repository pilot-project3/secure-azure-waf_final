"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Shield, AlertTriangle, Brain } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"

// 로그 데이터 타입 정의
interface LogEntry {
  Action: string
  Created: string
  IP: string
  Path: string
  Rule: string
  Score: number | null
}

interface PaginationInfo {
  currentPage: number
  hasNext: boolean
  hasPrev: boolean
  perPage: number
  totalItems: number
  totalPages: number
}

interface ApiResponse {
  insight: any
  logs: LogEntry[]
  message: string
  pagination: PaginationInfo
}

// 시간 변환 함수 추가
const convertToKoreanTime = (timeStr: string) => {
  try {
    // "03.31. PM 09:45:34" 형식을 파싱
    const parts = timeStr.split(' ')
    if (parts.length !== 3) {
      console.error('잘못된 시간 형식:', timeStr)
      return timeStr
    }

    const [datePart, period, time] = parts
    const [month, day] = datePart.split('.')
    const [hours, minutes, seconds] = time.split(':')

    // 숫자로 변환
    const monthNum = parseInt(month)
    const dayNum = parseInt(day)
    const hourNum = parseInt(hours)
    const minuteNum = parseInt(minutes)
    const secondNum = parseInt(seconds)

    // 유효성 검사
    if (isNaN(monthNum) || isNaN(dayNum) || isNaN(hourNum) || isNaN(minuteNum) || isNaN(secondNum)) {
      console.error('시간 파싱 오류:', timeStr)
      return timeStr
    }

    // 현재 연도 가져오기
    const currentYear = new Date().getFullYear()

    // Date 객체 생성
    const date = new Date(currentYear, monthNum - 1, dayNum)
    let finalHour = hourNum

    // AM/PM 처리
    if (period === 'PM' && finalHour !== 12) {
      finalHour += 12
    } else if (period === 'AM' && finalHour === 12) {
      finalHour = 0
    }

    // 시간 설정
    date.setHours(finalHour, minuteNum, secondNum)

    // 한국 시간으로 변환 (UTC+9)
    const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000))

    // 포맷팅
    return koreanTime.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  } catch (error) {
    console.error('시간 변환 중 오류:', error, timeStr)
    return timeStr // 변환 실패 시 원본 반환
  }
}

export default function LogsTab() {
  // 로그 데이터 상태
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 차단 대화상자 상태
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [selectedIp, setSelectedIp] = useState("")

  // AI 분석 대화상자 상태
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiInsight, setAiInsight] = useState<any>(null)
  const [isLoadingAi, setIsLoadingAi] = useState(false)

  // 로그 데이터 조회 함수
  const fetchLogs = async (page: number) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const userId = localStorage.getItem('userId')
      if (!userId) {
        throw new Error('사용자 정보가 없습니다.')
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(
        `http://20.249.205.79/api/v1/logs/${userId}?page=${page}`,
        { signal: controller.signal }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('로그 데이터를 불러오는데 실패했습니다.')
      }

      const data: ApiResponse = await response.json()
      setLogs(data.logs)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching logs:', error)
      setError(error instanceof Error ? error.message : '로그 데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // AI 인사이트 조회 함수
  const fetchAiInsight = async () => {
    try {
      setIsLoadingAi(true)
      setError(null)
      
      const userId = localStorage.getItem('userId')
      if (!userId) {
        throw new Error('사용자 정보가 없습니다.')
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(
        `http://20.249.205.79/api/v1/users/ai-insight/${userId}`,
        { signal: controller.signal }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('AI 분석 데이터를 불러오는데 실패했습니다.')
      }

      // 응답을 텍스트로 먼저 받습니다
      const text = await response.text()
      
      try {
        // JSON으로 파싱을 시도합니다
        const data = JSON.parse(text)
        setAiInsight(data)
      } catch (parseError) {
        // JSON 파싱에 실패하면 텍스트 그대로 저장합니다
        setAiInsight(text)
      }
    } catch (error) {
      console.error('Error fetching AI insight:', error)
      setError(error instanceof Error ? error.message : 'AI 분석 데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoadingAi(false)
    }
  }

  // 페이지 변경 시 데이터 조회
  useEffect(() => {
    fetchLogs(currentPage)
  }, [currentPage])

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchLogs(1)
  }, []) // 빈 의존성 배열로 컴포넌트 마운트 시에만 실행

  // 로그 항목 클릭 핸들러
  const handleLogClick = (log: LogEntry) => {
    setSelectedIp(log.IP)
    setBlockDialogOpen(true)
  }

  // IP 차단 처리
  const blockIp = () => {
    console.log(`IP 주소 차단: ${selectedIp}`)
    setBlockDialogOpen(false)
    toast({
      title: "IP 차단 완료",
      description: `IP 주소 ${selectedIp}가 성공적으로 차단되었습니다.`,
      action: <ToastAction altText="확인">확인</ToastAction>,
    })
  }

  // AI 분석 버튼 클릭 핸들러
  const handleAiAnalysis = async () => {
    await fetchAiInsight()
    setAiDialogOpen(true)
  }

  // 페이지네이션 버튼 렌더링
  const renderPaginationButtons = () => {
    if (!pagination) return null

    const buttons = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    // 이전 페이지 버튼
    buttons.push(
      <Button
        key="prev"
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(pagination.currentPage - 1)}
        disabled={!pagination.hasPrev}
      >
        이전
      </Button>
    )

    // 페이지 번호 버튼들
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={i === pagination.currentPage ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Button>
      )
    }

    // 다음 페이지 버튼
    buttons.push(
      <Button
        key="next"
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(pagination.currentPage + 1)}
        disabled={!pagination.hasNext}
      >
        다음
      </Button>
    )

    return buttons
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>로그 분석</CardTitle>
          <CardDescription>WAF 로그 및 분석 데이터 (행을 클릭하여 해당 IP 주소를 차단할 수 있습니다)</CardDescription>
        </div>
        <Button 
          onClick={handleAiAnalysis} 
          className="gap-2"
          disabled={isLoadingAi}
        >
          {isLoadingAi ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              AI 분석 중...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4" />
              AI 분석
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="rounded-md border">
            <div className="grid grid-cols-5 p-3 bg-muted text-sm font-medium">
              <div>시간</div>
              <div>IP 주소</div>
              <div>요청 경로</div>
              <div>규칙</div>
              <div>액션</div>
            </div>
            <div className="divide-y">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : error ? (
                <div className="p-4 text-red-500 text-sm">{error}</div>
              ) : logs.length > 0 ? (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-5 p-3 text-sm hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleLogClick(log)}
                  >
                    <div className="font-medium">{convertToKoreanTime(log.Created)}</div>
                    <div className="font-mono">{log.IP}</div>
                    <div className="truncate">{log.Path}</div>
                    <div className="font-medium">{log.Rule}</div>
                    <div>
                      <Badge 
                        variant={log.Action === "Block" ? "destructive" : "default"}
                        className={
                          log.Action === "Block" ? "bg-red-500" :
                          log.Action === "AnomalyScoring" ? "bg-orange-500" :
                          "bg-gray-500"
                        }
                      >
                        {log.Action}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  로그 데이터가 없습니다.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center space-x-2">
            {renderPaginationButtons()}
          </div>
        </div>
      </CardContent>

      {/* AI 분석 결과 모달 */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI 분석 결과
            </DialogTitle>
            <DialogDescription>로그 데이터에 대한 AI 분석 결과입니다.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isLoadingAi ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
              <div className="p-4 text-red-500 text-sm">{error}</div>
            ) : aiInsight ? (
              <div className="space-y-4">
                <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px] whitespace-pre-wrap">
                  {typeof aiInsight === 'string' ? aiInsight : JSON.stringify(aiInsight, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                분석 결과가 없습니다.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setAiDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IP 차단 확인 대화상자 */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              IP 주소 차단
            </DialogTitle>
            <DialogDescription>선택한 IP 주소를 WAF 블랙리스트에 추가하시겠습니까?</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center p-3 rounded-md bg-muted/50 border">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              <div>
                <p className="font-medium">IP 주소: {selectedIp}</p>
                <p className="text-sm text-muted-foreground">
                  이 IP 주소를 차단하면 해당 IP에서의 모든 접근이 차단됩니다.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={blockIp}>
              IP 차단
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

