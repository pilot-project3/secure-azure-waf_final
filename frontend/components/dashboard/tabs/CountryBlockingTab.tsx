"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Save, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { Feature, Geometry, GeoJsonProperties } from "geojson"

const countries = [
  { code: "AD", name: "안도라", blocked: false, color: "#22C55E", region: "europe" },
  { code: "AE", name: "아랍에미리트", blocked: false, color: "#22C55E", region: "asia" },
  { code: "AF", name: "아프가니스탄", blocked: false, color: "#22C55E", region: "asia" },
  { code: "AG", name: "앤티가 바부다", blocked: false, color: "#22C55E", region: "americas" },
  { code: "AI", name: "앵귈라", blocked: false, color: "#22C55E", region: "americas" },
  { code: "AL", name: "알바니아", blocked: false, color: "#22C55E", region: "europe" },
  { code: "AM", name: "아르메니아", blocked: false, color: "#22C55E", region: "asia" },
  { code: "AO", name: "앙골라", blocked: false, color: "#22C55E", region: "africa" },
  { code: "AQ", name: "남극", blocked: false, color: "#22C55E", region: "antarctica" },
  { code: "AR", name: "아르헨티나", blocked: false, color: "#22C55E", region: "americas" },
  { code: "AS", name: "미국령 사모아", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "AT", name: "오스트리아", blocked: false, color: "#22C55E", region: "europe" },
  { code: "AU", name: "호주", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "AW", name: "아루바", blocked: false, color: "#22C55E", region: "americas" },
  { code: "AX", name: "올란드 제도", blocked: false, color: "#22C55E", region: "europe" },
  { code: "AZ", name: "아제르바이잔", blocked: false, color: "#22C55E", region: "asia" },
  { code: "BA", name: "보스니아 헤르체고비나", blocked: false, color: "#22C55E", region: "europe" },
  { code: "BB", name: "바베이도스", blocked: false, color: "#22C55E", region: "americas" },
  { code: "BD", name: "방글라데시", blocked: false, color: "#22C55E", region: "asia" },
  { code: "BE", name: "벨기에", blocked: false, color: "#22C55E", region: "europe" },
  { code: "BF", name: "부르키나파소", blocked: false, color: "#22C55E", region: "africa" },
  { code: "BG", name: "불가리아", blocked: false, color: "#22C55E", region: "europe" },
  { code: "BH", name: "바레인", blocked: false, color: "#22C55E", region: "asia" },
  { code: "BI", name: "부룬디", blocked: false, color: "#22C55E", region: "africa" },
  { code: "BJ", name: "베냉", blocked: false, color: "#22C55E", region: "africa" },
  { code: "BL", name: "생바르텔레미", blocked: false, color: "#22C55E", region: "americas" },
  { code: "BM", name: "버뮤다", blocked: false, color: "#22C55E", region: "americas" },
  { code: "BN", name: "브루나이", blocked: false, color: "#22C55E", region: "asia" },
  { code: "BO", name: "볼리비아", blocked: false, color: "#22C55E", region: "americas" },
  { code: "BQ", name: "보네르", blocked: false, color: "#22C55E", region: "americas" },
  { code: "BR", name: "브라질", blocked: false, color: "#22C55E", region: "americas" },
  { code: "BS", name: "바하마", blocked: false, color: "#22C55E", region: "americas" },
  { code: "BT", name: "부탄", blocked: false, color: "#22C55E", region: "asia" },
  { code: "BV", name: "부베 섬", blocked: false, color: "#22C55E", region: "antarctica" },
  { code: "BW", name: "보츠와나", blocked: false, color: "#22C55E", region: "africa" },
  { code: "BY", name: "벨라루스", blocked: false, color: "#22C55E", region: "europe" },
  { code: "BZ", name: "벨리즈", blocked: false, color: "#22C55E", region: "americas" },
  { code: "CA", name: "캐나다", blocked: false, color: "#22C55E", region: "americas" },
  { code: "CC", name: "코코스 제도", blocked: false, color: "#22C55E", region: "asia" },
  { code: "CD", name: "콩고 민주 공화국", blocked: false, color: "#22C55E", region: "africa" },
  { code: "CF", name: "중앙아프리카 공화국", blocked: false, color: "#22C55E", region: "africa" },
  { code: "CG", name: "콩고", blocked: false, color: "#22C55E", region: "africa" },
  { code: "CH", name: "스위스", blocked: false, color: "#22C55E", region: "europe" },
  { code: "CI", name: "코트디부아르", blocked: false, color: "#22C55E", region: "africa" },
  { code: "CK", name: "쿡 제도", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "CL", name: "칠레", blocked: false, color: "#22C55E", region: "americas" },
  { code: "CM", name: "카메룬", blocked: false, color: "#22C55E", region: "africa" },
  { code: "CN", name: "중국", blocked: false, color: "#22C55E", region: "asia" },
  { code: "CO", name: "콜롬비아", blocked: false, color: "#22C55E", region: "americas" },
  { code: "CR", name: "코스타리카", blocked: false, color: "#22C55E", region: "americas" },
  { code: "CU", name: "쿠바", blocked: false, color: "#22C55E", region: "americas" },
  { code: "CV", name: "카보베르데", blocked: false, color: "#22C55E", region: "africa" },
  { code: "CW", name: "퀴라소", blocked: false, color: "#22C55E", region: "americas" },
  { code: "CX", name: "크리스마스 섬", blocked: false, color: "#22C55E", region: "asia" },
  { code: "CY", name: "키프로스", blocked: false, color: "#22C55E", region: "europe" },
  { code: "CZ", name: "체코", blocked: false, color: "#22C55E", region: "europe" },
  { code: "DE", name: "독일", blocked: false, color: "#22C55E", region: "europe" },
  { code: "DJ", name: "지부티", blocked: false, color: "#22C55E", region: "africa" },
  { code: "DK", name: "덴마크", blocked: false, color: "#22C55E", region: "europe" },
  { code: "DM", name: "도미니카", blocked: false, color: "#22C55E", region: "americas" },
  { code: "DO", name: "도미니카 공화국", blocked: false, color: "#22C55E", region: "americas" },
  { code: "DZ", name: "알제리", blocked: false, color: "#22C55E", region: "africa" },
  { code: "EC", name: "에콰도르", blocked: false, color: "#22C55E", region: "americas" },
  { code: "EE", name: "에스토니아", blocked: false, color: "#22C55E", region: "europe" },
  { code: "EG", name: "이집트", blocked: false, color: "#22C55E", region: "africa" },
  { code: "ER", name: "에리트레아", blocked: false, color: "#22C55E", region: "africa" },
  { code: "ES", name: "스페인", blocked: false, color: "#22C55E", region: "europe" },
  { code: "ET", name: "에티오피아", blocked: false, color: "#22C55E", region: "africa" },
  { code: "FI", name: "핀란드", blocked: false, color: "#22C55E", region: "europe" },
  { code: "FJ", name: "피지", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "FK", name: "포클랜드 제도", blocked: false, color: "#22C55E", region: "americas" },
  { code: "FM", name: "미크로네시아", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "FO", name: "페로 제도", blocked: false, color: "#22C55E", region: "europe" },
  { code: "FR", name: "프랑스", blocked: false, color: "#22C55E", region: "europe" },
  { code: "GA", name: "가봉", blocked: false, color: "#22C55E", region: "africa" },
  { code: "GB", name: "영국", blocked: false, color: "#22C55E", region: "europe" },
  { code: "GD", name: "그레나다", blocked: false, color: "#22C55E", region: "americas" },
  { code: "GE", name: "조지아", blocked: false, color: "#22C55E", region: "asia" },
  { code: "GF", name: "프랑스령 기아나", blocked: false, color: "#22C55E", region: "americas" },
  { code: "GG", name: "건지", blocked: false, color: "#22C55E", region: "europe" },
  { code: "GH", name: "가나", blocked: false, color: "#22C55E", region: "africa" },
  { code: "GI", name: "지브롤터", blocked: false, color: "#22C55E", region: "europe" },
  { code: "GL", name: "그린란드", blocked: false, color: "#22C55E", region: "americas" },
  { code: "GM", name: "감비아", blocked: false, color: "#22C55E", region: "africa" },
  { code: "GN", name: "기니", blocked: false, color: "#22C55E", region: "africa" },
  { code: "GP", name: "과들루프", blocked: false, color: "#22C55E", region: "americas" },
  { code: "GQ", name: "적도 기니", blocked: false, color: "#22C55E", region: "africa" },
  { code: "GR", name: "그리스", blocked: false, color: "#22C55E", region: "europe" },
  { code: "GS", name: "사우스조지아 사우스샌드위치 제도", blocked: false, color: "#22C55E", region: "antarctica" },
  { code: "GT", name: "과테말라", blocked: false, color: "#22C55E", region: "americas" },
  { code: "GU", name: "괌", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "GW", name: "기니비사우", blocked: false, color: "#22C55E", region: "africa" },
  { code: "GY", name: "가이아나", blocked: false, color: "#22C55E", region: "americas" },
  { code: "HK", name: "홍콩", blocked: false, color: "#22C55E", region: "asia" },
  { code: "HM", name: "허드 맥도널드 제도", blocked: false, color: "#22C55E", region: "antarctica" },
  { code: "HN", name: "온두라스", blocked: false, color: "#22C55E", region: "americas" },
  { code: "HR", name: "크로아티아", blocked: false, color: "#22C55E", region: "europe" },
  { code: "HT", name: "아이티", blocked: false, color: "#22C55E", region: "americas" },
  { code: "HU", name: "헝가리", blocked: false, color: "#22C55E", region: "europe" },
  { code: "ID", name: "인도네시아", blocked: false, color: "#22C55E", region: "asia" },
  { code: "IE", name: "아일랜드", blocked: false, color: "#22C55E", region: "europe" },
  { code: "IL", name: "이스라엘", blocked: false, color: "#22C55E", region: "asia" },
  { code: "IM", name: "맨 섬", blocked: false, color: "#22C55E", region: "europe" },
  { code: "IN", name: "인도", blocked: false, color: "#22C55E", region: "asia" },
  { code: "IO", name: "영국령 인도양 지역", blocked: false, color: "#22C55E", region: "asia" },
  { code: "IQ", name: "이라크", blocked: false, color: "#22C55E", region: "asia" },
  { code: "IR", name: "이란", blocked: false, color: "#22C55E", region: "asia" },
  { code: "IS", name: "아이슬란드", blocked: false, color: "#22C55E", region: "europe" },
  { code: "IT", name: "이탈리아", blocked: false, color: "#22C55E", region: "europe" },
  { code: "JE", name: "저지", blocked: false, color: "#22C55E", region: "europe" },
  { code: "JM", name: "자메이카", blocked: false, color: "#22C55E", region: "americas" },
  { code: "JO", name: "요르단", blocked: false, color: "#22C55E", region: "asia" },
  { code: "JP", name: "일본", blocked: false, color: "#22C55E", region: "asia" },
  { code: "KE", name: "케냐", blocked: false, color: "#22C55E", region: "africa" },
  { code: "KG", name: "키르기스스탄", blocked: false, color: "#22C55E", region: "asia" },
  { code: "KH", name: "캄보디아", blocked: false, color: "#22C55E", region: "asia" },
  { code: "KI", name: "키리바시", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "KM", name: "코모로", blocked: false, color: "#22C55E", region: "africa" },
  { code: "KN", name: "세인트키츠 네비스", blocked: false, color: "#22C55E", region: "americas" },
  { code: "KP", name: "북한", blocked: false, color: "#22C55E", region: "asia" },
  { code: "KR", name: "한국", blocked: false, color: "#22C55E", region: "asia" },
  { code: "KW", name: "쿠웨이트", blocked: false, color: "#22C55E", region: "asia" },
  { code: "KY", name: "케이맨 제도", blocked: false, color: "#22C55E", region: "americas" },
  { code: "KZ", name: "카자흐스탄", blocked: false, color: "#22C55E", region: "asia" },
  { code: "LA", name: "라오스", blocked: false, color: "#22C55E", region: "asia" },
  { code: "LB", name: "레바논", blocked: false, color: "#22C55E", region: "asia" },
  { code: "LC", name: "세인트루시아", blocked: false, color: "#22C55E", region: "americas" },
  { code: "LI", name: "리히텐슈타인", blocked: false, color: "#22C55E", region: "europe" },
  { code: "LK", name: "스리랑카", blocked: false, color: "#22C55E", region: "asia" },
  { code: "LR", name: "라이베리아", blocked: false, color: "#22C55E", region: "africa" },
  { code: "LS", name: "레소토", blocked: false, color: "#22C55E", region: "africa" },
  { code: "LT", name: "리투아니아", blocked: false, color: "#22C55E", region: "europe" },
  { code: "LU", name: "룩셈부르크", blocked: false, color: "#22C55E", region: "europe" },
  { code: "LV", name: "라트비아", blocked: false, color: "#22C55E", region: "europe" },
  { code: "LY", name: "리비아", blocked: false, color: "#22C55E", region: "africa" },
  { code: "MA", name: "모로코", blocked: false, color: "#22C55E", region: "africa" },
  { code: "MC", name: "모나코", blocked: false, color: "#22C55E", region: "europe" },
  { code: "MD", name: "몰도바", blocked: false, color: "#22C55E", region: "europe" },
  { code: "ME", name: "몬테네그로", blocked: false, color: "#22C55E", region: "europe" },
  { code: "MF", name: "생마르탱", blocked: false, color: "#22C55E", region: "americas" },
  { code: "MG", name: "마다가스카르", blocked: false, color: "#22C55E", region: "africa" },
  { code: "MH", name: "마셜 제도", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "MK", name: "북마케도니아", blocked: false, color: "#22C55E", region: "europe" },
  { code: "ML", name: "말리", blocked: false, color: "#22C55E", region: "africa" },
  { code: "MM", name: "미얀마", blocked: false, color: "#22C55E", region: "asia" },
  { code: "MN", name: "몽골", blocked: false, color: "#22C55E", region: "asia" },
  { code: "MO", name: "마카오", blocked: false, color: "#22C55E", region: "asia" },
  { code: "MP", name: "북마리아나 제도", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "MQ", name: "마르티니크", blocked: false, color: "#22C55E", region: "americas" },
  { code: "MR", name: "모리타니", blocked: false, color: "#22C55E", region: "africa" },
  { code: "MS", name: "몬트세랫", blocked: false, color: "#22C55E", region: "americas" },
  { code: "MT", name: "몰타", blocked: false, color: "#22C55E", region: "europe" },
  { code: "MU", name: "모리셔스", blocked: false, color: "#22C55E", region: "africa" },
  { code: "MV", name: "몰디브", blocked: false, color: "#22C55E", region: "asia" },
  { code: "MW", name: "말라위", blocked: false, color: "#22C55E", region: "africa" },
  { code: "MX", name: "멕시코", blocked: false, color: "#22C55E", region: "americas" },
  { code: "MY", name: "말레이시아", blocked: false, color: "#22C55E", region: "asia" },
  { code: "MZ", name: "모잠비크", blocked: false, color: "#22C55E", region: "africa" },
  { code: "NA", name: "나미비아", blocked: false, color: "#22C55E", region: "africa" },
  { code: "NC", name: "뉴칼레도니아", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "NE", name: "니제르", blocked: false, color: "#22C55E", region: "africa" },
  { code: "NF", name: "노퍽 섬", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "NG", name: "나이지리아", blocked: false, color: "#22C55E", region: "africa" },
  { code: "NI", name: "니카라과", blocked: false, color: "#22C55E", region: "americas" },
  { code: "NL", name: "네덜란드", blocked: false, color: "#22C55E", region: "europe" },
  { code: "NO", name: "노르웨이", blocked: false, color: "#22C55E", region: "europe" },
  { code: "NP", name: "네팔", blocked: false, color: "#22C55E", region: "asia" },
  { code: "NR", name: "나우루", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "NU", name: "니우에", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "NZ", name: "뉴질랜드", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "OM", name: "오만", blocked: false, color: "#22C55E", region: "asia" },
  { code: "PA", name: "파나마", blocked: false, color: "#22C55E", region: "americas" },
  { code: "PE", name: "페루", blocked: false, color: "#22C55E", region: "americas" },
  { code: "PF", name: "프랑스령 폴리네시아", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "PG", name: "파푸아뉴기니", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "PH", name: "필리핀", blocked: false, color: "#22C55E", region: "asia" },
  { code: "PK", name: "파키스탄", blocked: false, color: "#22C55E", region: "asia" },
  { code: "PL", name: "폴란드", blocked: false, color: "#22C55E", region: "europe" },
  { code: "PM", name: "생피에르 미클롱", blocked: false, color: "#22C55E", region: "americas" },
  { code: "PN", name: "핏케언 제도", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "PR", name: "푸에르토리코", blocked: false, color: "#22C55E", region: "americas" },
  { code: "PS", name: "팔레스타인", blocked: false, color: "#22C55E", region: "asia" },
  { code: "PT", name: "포르투갈", blocked: false, color: "#22C55E", region: "europe" },
  { code: "PW", name: "팔라우", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "PY", name: "파라과이", blocked: false, color: "#22C55E", region: "americas" },
  { code: "QA", name: "카타르", blocked: false, color: "#22C55E", region: "asia" },
  { code: "RE", name: "레위니옹", blocked: false, color: "#22C55E", region: "africa" },
  { code: "RO", name: "루마니아", blocked: false, color: "#22C55E", region: "europe" },
  { code: "RS", name: "세르비아", blocked: false, color: "#22C55E", region: "europe" },
  { code: "RU", name: "러시아", blocked: false, color: "#22C55E", region: "europe" },
  { code: "RW", name: "르완다", blocked: false, color: "#22C55E", region: "africa" },
  { code: "SA", name: "사우디아라비아", blocked: false, color: "#22C55E", region: "asia" },
  { code: "SB", name: "솔로몬 제도", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "SC", name: "세이셸", blocked: false, color: "#22C55E", region: "africa" },
  { code: "SD", name: "수단", blocked: false, color: "#22C55E", region: "africa" },
  { code: "SE", name: "스웨덴", blocked: false, color: "#22C55E", region: "europe" },
  { code: "SG", name: "싱가포르", blocked: false, color: "#22C55E", region: "asia" },
  { code: "SH", name: "세인트헬레나", blocked: false, color: "#22C55E", region: "africa" },
  { code: "SI", name: "슬로베니아", blocked: false, color: "#22C55E", region: "europe" },
  { code: "SJ", name: "스발바르 얀마옌", blocked: false, color: "#22C55E", region: "europe" },
  { code: "SK", name: "슬로바키아", blocked: false, color: "#22C55E", region: "europe" },
  { code: "SL", name: "시에라리온", blocked: false, color: "#22C55E", region: "africa" },
  { code: "SM", name: "산마리노", blocked: false, color: "#22C55E", region: "europe" },
  { code: "SN", name: "세네갈", blocked: false, color: "#22C55E", region: "africa" },
  { code: "SO", name: "소말리아", blocked: false, color: "#22C55E", region: "africa" },
  { code: "SR", name: "수리남", blocked: false, color: "#22C55E", region: "americas" },
  { code: "SS", name: "남수단", blocked: false, color: "#22C55E", region: "africa" },
  { code: "ST", name: "상투메 프린시페", blocked: false, color: "#22C55E", region: "africa" },
  { code: "SV", name: "엘살바도르", blocked: false, color: "#22C55E", region: "americas" },
  { code: "SX", name: "신트외스타위위스 사바", blocked: false, color: "#22C55E", region: "americas" },
  { code: "SY", name: "시리아", blocked: false, color: "#22C55E", region: "asia" },
  { code: "SZ", name: "에스와티니", blocked: false, color: "#22C55E", region: "africa" },
  { code: "TC", name: "터크스 케이커스 제도", blocked: false, color: "#22C55E", region: "americas" },
  { code: "TD", name: "차드", blocked: false, color: "#22C55E", region: "africa" },
  { code: "TF", name: "프랑스령 남부 지역", blocked: false, color: "#22C55E", region: "antarctica" },
  { code: "TG", name: "토고", blocked: false, color: "#22C55E", region: "africa" },
  { code: "TH", name: "태국", blocked: false, color: "#22C55E", region: "asia" },
  { code: "TJ", name: "타지키스탄", blocked: false, color: "#22C55E", region: "asia" },
  { code: "TK", name: "토켈라우", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "TL", name: "동티모르", blocked: false, color: "#22C55E", region: "asia" },
  { code: "TM", name: "투르크메니스탄", blocked: false, color: "#22C55E", region: "asia" },
  { code: "TN", name: "튀니지", blocked: false, color: "#22C55E", region: "africa" },
  { code: "TO", name: "통가", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "TR", name: "터키", blocked: false, color: "#22C55E", region: "asia" },
  { code: "TT", name: "트리니다드 토바고", blocked: false, color: "#22C55E", region: "americas" },
  { code: "TV", name: "투발루", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "TW", name: "대만", blocked: false, color: "#22C55E", region: "asia" },
  { code: "TZ", name: "탄자니아", blocked: false, color: "#22C55E", region: "africa" },
  { code: "UA", name: "우크라이나", blocked: false, color: "#22C55E", region: "europe" },
  { code: "UG", name: "우간다", blocked: false, color: "#22C55E", region: "africa" },
  { code: "UM", name: "미국령 군소 제도", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "US", name: "미국", blocked: false, color: "#22C55E", region: "americas" },
  { code: "UY", name: "우루과이", blocked: false, color: "#22C55E", region: "americas" },
  { code: "UZ", name: "우즈베키스탄", blocked: false, color: "#22C55E", region: "asia" },
  { code: "VA", name: "바티칸 시국", blocked: false, color: "#22C55E", region: "europe" },
  { code: "VC", name: "세인트빈센트 그레나딘", blocked: false, color: "#22C55E", region: "americas" },
  { code: "VE", name: "베네수엘라", blocked: false, color: "#22C55E", region: "americas" },
  { code: "VG", name: "영국령 버진 아일랜드", blocked: false, color: "#22C55E", region: "americas" },
  { code: "VI", name: "미국령 버진 아일랜드", blocked: false, color: "#22C55E", region: "americas" },
  { code: "VN", name: "베트남", blocked: false, color: "#22C55E", region: "asia" },
  { code: "VU", name: "바누아투", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "WF", name: "왈리스 푸투나", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "WS", name: "사모아", blocked: false, color: "#22C55E", region: "oceania" },
  { code: "YE", name: "예멘", blocked: false, color: "#22C55E", region: "asia" },
  { code: "YT", name: "마요트", blocked: false, color: "#22C55E", region: "africa" },
  { code: "ZA", name: "남아프리카 공화국", blocked: false, color: "#22C55E", region: "africa" },
  { code: "ZM", name: "잠비아", blocked: false, color: "#22C55E", region: "africa" },
  { code: "ZW", name: "짐바브웨", blocked: false, color: "#22C55E", region: "africa" }
]

// Leaflet 아이콘 설정
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center)
  }, [center, map])
  return null
}

export default function CountryBlockingTab() {
  const [clickedCountries, setClickedCountries] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [geoData, setGeoData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isApplying, setIsApplying] = useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)

  useEffect(() => {
    // GeoJSON 데이터 로드
    fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
      .then((response) => response.json())
      .then((data) => {
        setGeoData(data)
      })
      .catch((error) => {
        setMapError("지도 데이터를 불러오는데 실패했습니다.")
        console.error("Error loading GeoJSON:", error)
      })

    // 차단된 국가 정보 로드
    const fetchBlockedCountries = async () => {
      try {
        const userId = localStorage.getItem('userId')
        const wafPolicyName = localStorage.getItem('wafPolicyName')
        const resourceGroupName = localStorage.getItem('resourceGroupName')

        if (!userId || !wafPolicyName || !resourceGroupName) {
          throw new Error('필수 정보가 누락되었습니다.')
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

        const response = await fetch(
          `http://20.249.205.79/api/country/polices?userId=${userId}&policyName=${wafPolicyName}&resourceGroupName=${resourceGroupName}`,
          { signal: controller.signal }
        )

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('API 호출에 실패했습니다.')
        }

        const data = await response.json()
        
        // 모든 규칙에서 차단된 국가 코드 수집
        const blockedCountryCodes = data.properties.customRules.rules.reduce((acc: string[], rule: any) => {
          const matchCondition = rule.matchConditions.find((mc: any) => mc.matchVariable === 'SocketAddr')
          if (matchCondition) {
            return [...acc, ...matchCondition.matchValue]
          }
          return acc
        }, [])

        setClickedCountries(blockedCountryCodes)
      } catch (error) {
        console.error('Error fetching blocked countries:', error)
        setError('차단된 국가 정보를 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBlockedCountries()
  }, [])

  const toggleCountryBlock = (code: string) => {
    setClickedCountries((prev) =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  const toggleRegionBlock = (region: string) => {
    const regionCountries = countries.filter((country) => country.region === region)
    const regionCountryCodes = regionCountries.map((country) => country.code)
    
    // 해당 지역의 모든 국가가 이미 차단되어 있는지 확인
    const allBlocked = regionCountryCodes.every((code) => clickedCountries.includes(code))
    
    if (allBlocked) {
      // 모든 국가가 차단되어 있다면, 해당 지역의 모든 국가를 차단 해제
      setClickedCountries((prev) => prev.filter((code) => !regionCountryCodes.includes(code)))
    } else {
      // 일부만 차단되어 있거나 아무것도 차단되어 있지 않다면, 해당 지역의 모든 국가를 차단
      setClickedCountries((prev) => [...new Set([...prev, ...regionCountryCodes])])
    }
  }

  const validateInputs = () => {
    if (clickedCountries.length === 0) {
      setError("최소 하나 이상의 국가를 차단해야 합니다.")
      return false
    }

    setError(null)
    return true
  }

  const applyChanges = async () => {
    if (!validateInputs()) return

    setIsApplying(true)
    setError(null)
    setShowSuccessAlert(false)

    try {
      const userId = localStorage.getItem('userId')
      const wafPolicyName = localStorage.getItem('wafPolicyName')
      const resourceGroupName = localStorage.getItem('resourceGroupName')

      if (!userId || !wafPolicyName || !resourceGroupName) {
        setError('필수 정보가 누락되었습니다.')
        return
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

      const response = await fetch('http://20.249.205.79/api/country/polices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          resourceGroupName,
          policyName: wafPolicyName,
          rules: [
            {
              ruleName: "BlockCountries",
              priority: "50",
              countryList: clickedCountries
            }
          ]
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('API 호출에 실패했습니다.')
      }

      setShowSuccessAlert(true)
      setTimeout(() => setShowSuccessAlert(false), 5000)
    } catch (error) {
      console.error('Error applying country blocking:', error)
      setError('국가 차단 설정 적용에 실패했습니다.')
    } finally {
      setIsApplying(false)
    }
  }

  const getCountryName = (countryCode: string) =>
    countries.find((c) => c.code === countryCode)?.name || countryCode

  const style = (feature: Feature<Geometry, GeoJsonProperties> | undefined) => {
    if (!feature) return {}
    
    const countryCode = (feature.properties as any).ISO_A2
    const isBlocked = clickedCountries.includes(countryCode)
    const isKnownCountry = countries.some(c => c.code === countryCode)

    return {
      fillColor: isKnownCountry ? (isBlocked ? "#EF4444" : "#22C55E") : "#D1D5DB",
      weight: 1,
      color: "#FFF",
      fillOpacity: 0.7,
    }
  }

  const onEachFeature = (feature: Feature<Geometry, GeoJsonProperties>, layer: L.Layer) => {
    const countryCode = (feature.properties as any).ISO_A2
    const matchedCountry = countries.find((c) => c.code === countryCode)

    if (matchedCountry) {
      layer.on({
        mouseover: (e: L.LeafletMouseEvent) => {
          const layer = e.target as L.Path
          const isBlocked = clickedCountries.includes(countryCode)
          layer.setStyle({
            fillOpacity: 0.9,
            fillColor: isBlocked ? "#DC2626" : "#16A34A",
          })
        },
        mouseout: (e: L.LeafletMouseEvent) => {
          const layer = e.target as L.Path
          const isBlocked = clickedCountries.includes(countryCode)
          layer.setStyle({
            fillOpacity: 0.7,
            fillColor: isBlocked ? "#EF4444" : "#22C55E",
          })
        },
        click: (e: L.LeafletMouseEvent) => {
          toggleCountryBlock(countryCode)
          const layer = e.target as L.Path
          const isBlocked = clickedCountries.includes(countryCode)
          layer.setStyle({
            fillOpacity: 0.7,
            fillColor: isBlocked ? "#EF4444" : "#22C55E",
          })
        },
      })
    }
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center h-[500px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">데이터를 불러오는 중...</p>
          </div>
        </div>
      ) : (
        <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>국가 차단</CardTitle>
            <CardDescription>지도에서 국가를 클릭하여 선택하세요.</CardDescription>
          </CardHeader>
          <CardContent>
                <div className="relative bg-muted rounded-md p-4 h-[500px] overflow-hidden">
              {mapError ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-500">{mapError}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setMapError(null)}>
                      다시 시도
                    </Button>
                  </div>
                </div>
              ) : (
                    <MapContainer
                      center={[20, 0] as L.LatLngExpression}
                      zoom={2}
                      style={{ height: "100%", width: "100%" }}
                      maxBounds={[[-90, -180], [90, 180]]}
                      maxBoundsViscosity={1.0}
                      minZoom={2}
                      maxZoom={4}
                      worldCopyJump={false}
                      scrollWheelZoom={false}
                      dragging={true}
                      bounds={[[-90, -180], [90, 180]]}
                    >
                      <MapUpdater center={[20, 0]} />
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        noWrap={true}
                        bounds={[[-90, -180], [90, 180]]}
                        tileSize={256}
                        zoomOffset={0}
                        updateWhenIdle={true}
                        updateWhenZooming={false}
                      />
                      {geoData && (
                        <GeoJSON
                          key={`countries-${clickedCountries.join(',')}`}
                          data={geoData}
                          style={style}
                          onEachFeature={onEachFeature}
                        />
                      )}
                    </MapContainer>
                  )}
                  <div className="absolute bottom-4 right-4 bg-white/80 p-2 rounded-md text-xs z-[1000]">
                <div className="flex items-center mb-1">
                      <div className="w-3 h-3 bg-[#EF4444] rounded-sm mr-1"></div>
                      <span>차단됨</span>
                </div>
                <div className="flex items-center">
                      <div className="w-3 h-3 bg-[#22C55E] rounded-sm mr-1"></div>
                      <span>허용됨</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 국가 리스트 체크박스 */}
        <Card>
          <CardHeader>
            <CardTitle>국가 선택</CardTitle>
            <CardDescription>차단할 국가를 선택하세요.</CardDescription>
          </CardHeader>
          <CardContent>
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                  {["europe", "asia", "africa", "americas", "oceania", "antarctica"].map((region) => {
                    const regionCountries = countries.filter((country) => country.region === region)
                    const regionNames = {
                      europe: "유럽",
                      asia: "아시아",
                      africa: "아프리카",
                      americas: "아메리카",
                      oceania: "오세아니아",
                      antarctica: "남극"
                    }
                    const regionCountryCodes = regionCountries.map((country) => country.code)
                    const allBlocked = regionCountryCodes.every((code) => clickedCountries.includes(code))
                    const someBlocked = regionCountryCodes.some((code) => clickedCountries.includes(code))

                    return (
                      <div key={region} className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`region-${region}`}
                            checked={allBlocked}
                            ref={ref => {
                              if (ref) {
                                (ref as unknown as HTMLInputElement).indeterminate = someBlocked && !allBlocked
                              }
                            }}
                            onCheckedChange={() => toggleRegionBlock(region)}
                          />
                          <Label htmlFor={`region-${region}`} className="font-semibold text-sm text-muted-foreground">
                            {regionNames[region as keyof typeof regionNames]}
                          </Label>
                        </div>
                        <div className="space-y-2 ml-6">
                          {regionCountries.map((country) => (
                <div key={country.code} className="flex items-center space-x-3">
                  <Checkbox
                    id={country.code}
                    checked={clickedCountries.includes(country.code)}
                    onCheckedChange={() => toggleCountryBlock(country.code)}
                  />
                  <Label htmlFor={country.code} className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-2" 
                                  style={{ 
                                    backgroundColor: clickedCountries.includes(country.code) ? "#EF4444" : "#22C55E" 
                                  }}
                                ></div>
                    {country.name} ({country.code})
                  </Label>
                </div>
              ))}
                        </div>
                      </div>
                    )
                  })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 차단된 국가 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>차단된 국가</CardTitle>
          <CardDescription>현재 차단된 국가 목록</CardDescription>
        </CardHeader>
        <CardContent>
              <div className="space-y-6">
                {["europe", "asia", "africa", "americas", "oceania", "antarctica"].map((region) => {
                  const regionCountries = clickedCountries
                    .filter((code) => countries.find((c) => c.code === code)?.region === region)
                    .map((code) => countries.find((c) => c.code === code)!)
                  
                  if (regionCountries.length === 0) return null

                  const regionNames = {
                    europe: "유럽",
                    asia: "아시아",
                    africa: "아프리카",
                    americas: "아메리카",
                    oceania: "오세아니아",
                    antarctica: "남극"
                  }

                  return (
                    <div key={region} className="space-y-2">
                      <h3 className="font-semibold text-sm text-muted-foreground">{regionNames[region as keyof typeof regionNames]}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {regionCountries.map((country) => (
                          <div key={country.code} className="flex justify-between items-center p-2 rounded-md bg-red-50 border border-red-200">
                            <span className="text-sm font-medium">{country.name}</span>
                          </div>
                        ))}
                      </div>
                </div>
                  )
                })}
                {clickedCountries.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                차단된 국가가 없습니다.
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
              <Button 
                onClick={applyChanges} 
                className="w-full sm:w-auto gap-2" 
                size="lg"
                disabled={isApplying}
              >
                {isApplying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    적용 중...
                  </>
                ) : (
                  <>
            <Save className="h-4 w-4" />
            국가 차단 설정 적용
                  </>
                )}
          </Button>
        </CardFooter>
      </Card>

          {/* 알림 */}
          {showSuccessAlert && (
            <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-4">
              <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-12 max-w-2xl relative">
                <button
                  onClick={() => setShowSuccessAlert(false)}
                  className="absolute top-4 right-4 text-green-500 hover:text-green-700 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-12 w-12 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-6">
                    <h3 className="text-2xl font-medium text-green-800">성공</h3>
                    <div className="mt-4 text-xl text-green-700">
                      <p>국가 차단 설정이 성공적으로 적용되었습니다.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-4">
              <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-12 max-w-2xl relative">
                <button
                  onClick={() => setError(null)}
                  className="absolute top-4 right-4 text-red-500 hover:text-red-700 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-12 w-12 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-6">
                    <h3 className="text-2xl font-medium text-red-800">오류</h3>
                    <div className="mt-4 text-xl text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
