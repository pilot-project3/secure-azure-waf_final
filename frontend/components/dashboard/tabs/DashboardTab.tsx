"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface CountryStats {
  count: number
  country: string
}

interface TrafficStats {
  block_rate_percent: number
  blocked: number
  not_blocked: number
  total: number
}

interface RecentBlockedRequest {
  action: string
  country: string
  ip: string
  rule: string
  timestamp: string
}

interface RecentBlockedResponse {
  recent_blocked: RecentBlockedRequest[]
}

interface IpStats {
  count: number
  ip: string
}

interface IpStatsResponse {
  ip_counts: IpStats[]
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

export default function DashboardTab() {
  const [countryStats, setCountryStats] = useState<CountryStats[]>([])
  const [trafficStats, setTrafficStats] = useState<TrafficStats | null>(null)
  const [recentBlocked, setRecentBlocked] = useState<RecentBlockedRequest[]>([])
  const [ipStats, setIpStats] = useState<IpStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = localStorage.getItem("userId")
        if (!userId) {
          throw new Error("User ID not found")
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

        // 모든 통계 데이터를 동시에 가져옴
        const [countryResponse, trafficResponse, recentBlockedResponse, ipResponse] = await Promise.all([
          fetch(`http://20.249.205.79/api/v1/stats/${userId}/country`, { signal: controller.signal }),
          fetch(`http://20.249.205.79/api/v1/stats/${userId}/traffic`, { signal: controller.signal }),
          fetch(`http://20.249.205.79/api/v1/stats/${userId}/recent-blocked`, { signal: controller.signal }),
          fetch(`http://20.249.205.79/api/v1/stats/${userId}/ip`, { signal: controller.signal })
        ])

        clearTimeout(timeoutId);

        if (!countryResponse.ok || !trafficResponse.ok || !recentBlockedResponse.ok || !ipResponse.ok) {
          throw new Error("Failed to fetch statistics")
        }

        const [countryData, trafficData, recentBlockedData, ipData] = await Promise.all([
          countryResponse.json(),
          trafficResponse.json(),
          recentBlockedResponse.json() as Promise<RecentBlockedResponse>,
          ipResponse.json() as Promise<IpStatsResponse>
        ])

        const sortedStats = countryData.country_counts.sort((a: CountryStats, b: CountryStats) => b.count - a.count)
        setCountryStats(sortedStats)
        setTrafficStats(trafficData.traffic_stats)
        // 최근 차단된 요청을 시간 역순으로 정렬
        const sortedRecentBlocked = recentBlockedData.recent_blocked.sort((a, b) => {
          // 시간 문자열을 파싱
          const parseTime = (timeStr: string) => {
            const [period, time] = timeStr.split(' ')
            const [hours, minutes, seconds] = time.split(':')
            let hourNum = parseInt(hours)
            const minuteNum = parseInt(minutes)
            const secondNum = parseInt(seconds)

            if (isNaN(hourNum) || isNaN(minuteNum) || isNaN(secondNum)) {
              return 0
            }

            // AM/PM 처리
            if (period === 'PM' && hourNum !== 12) {
              hourNum += 12
            } else if (period === 'AM' && hourNum === 12) {
              hourNum = 0
            }

            return hourNum * 3600 + minuteNum * 60 + secondNum
          }

          const timeA = parseTime(a.timestamp)
          const timeB = parseTime(b.timestamp)
          return timeB - timeA
        })
        setRecentBlocked(sortedRecentBlocked)
        setIpStats(ipData.ip_counts.sort((a, b) => b.count - a.count))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load statistics")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // 최대 요청 수 계산 (막대 그래프의 100% 기준)
  const maxCount = Math.max(...countryStats.map(stat => stat.count), 0)
  const maxIpCount = Math.max(...ipStats.map(stat => stat.count), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>트래픽 상태</CardTitle>
            <CardDescription>실시간 트래픽 통계</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mx-auto"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-sm">{error}</div>
            ) : trafficStats ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      {/* 배경 원 */}
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="3"
                      />
                      {/* 프로그레스 원 */}
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#22C55E"
                        strokeWidth="3"
                        strokeDasharray={`${trafficStats.block_rate_percent}, 100`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{trafficStats.block_rate_percent}%</div>
                        <div className="text-xs text-muted-foreground">차단율</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-lg col-span-2">
                    <div className="text-sm text-muted-foreground">총 요청</div>
                    <div className="text-2xl font-bold">{trafficStats.total}</div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">허용된 요청</div>
                    <div className="text-2xl font-bold text-green-500">{trafficStats.not_blocked}</div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">차단된 요청</div>
                    <div className="text-2xl font-bold text-red-500">{trafficStats.blocked}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">
                데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IP 요청 통계</CardTitle>
            <CardDescription>IP별 요청 통계</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mx-auto"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 text-sm">{error}</div>
              ) : ipStats.length > 0 ? (
                <div className="space-y-4">
                  {ipStats.map((stat, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium font-mono">{stat.ip || "알 수 없음"}</span>
                        <span className="text-sm text-muted-foreground">{stat.count}회</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(stat.count / maxIpCount) * 100}%`,
                            backgroundColor: index === 0 ? '#22C55E' : '#3B82F6'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                  데이터가 없습니다
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>국가별 요청</CardTitle>
            <CardDescription>국가별 요청 통계</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mx-auto"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 text-sm">{error}</div>
              ) : countryStats.length > 0 ? (
                <div className="space-y-4">
                  {countryStats.map((stat, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{stat.country || "알 수 없음"}</span>
                        <span className="text-sm text-muted-foreground">{stat.count}회</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(stat.count / maxCount) * 100}%`,
                            backgroundColor: index === 0 ? '#22C55E' : '#3B82F6'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                  데이터가 없습니다
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 차단된 요청</CardTitle>
          <CardDescription>최근 차단된 요청 목록</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-5 p-3 bg-muted text-sm font-medium">
              <div>시간</div>
              <div>IP 주소</div>
              <div>국가</div>
              <div>규칙</div>
              <div>액션</div>
            </div>
            <div className="divide-y">
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                </div>
              ) : error ? (
                <div className="p-4 text-red-500 text-sm">{error}</div>
              ) : recentBlocked.length > 0 ? (
                recentBlocked.map((request, index) => (
                  <div key={index} className="grid grid-cols-5 p-3 text-sm hover:bg-muted/50 transition-colors">
                    <div className="font-medium">{request.timestamp}</div>
                    <div className="font-mono">{request.ip || "-"}</div>
                    <div>{request.country === "-" ? "알 수 없음" : request.country}</div>
                    <div className="font-medium">{request.rule}</div>
                    <div>
                      <Badge 
                        variant="destructive"
                        className="bg-red-500"
                      >
                        {request.action}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  차단된 요청이 없습니다
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

