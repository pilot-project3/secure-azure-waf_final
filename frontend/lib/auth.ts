// 사용자 정보 타입 정의
export interface User {
  id: number
  loginId: string
  password: string
  sessionValue: string | null
  tenantId: string
  role: string | null
  subscriptionID: string
  workSpaceID: string
  clientId: string
  clientSecret: string
  scope: string | null
  webSiteUrl: string
  resourceGroupName: string | null
  wafApiKey: string
  wafApiKeyExpiresAt: number
  logApiKey: string
  logApiKeyExpiresAt: number
  wafPolicyName: string | null
  wafId: string | null
}

// 로그인 응답 타입 정의
interface LoginResponse {
  user: User
}

// 로그인 함수
export async function loginUser(loginId: string, password: string): Promise<User> {
  try {
    const response = await fetch("http://20.249.205.79/api/v1/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        loginId,
        password,
      }),
    })

    if (!response.ok) {
      throw new Error("로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.")
    }

    const data: LoginResponse = await response.json()

    // 로컬 스토리지에 사용자 정보 저장
    localStorage.setItem("userId", data.user.id.toString())
    localStorage.setItem("clientId", data.user.clientId)
    localStorage.setItem("clientSecret", data.user.clientSecret)
    localStorage.setItem("endpointUrl", data.user.role || "")
    localStorage.setItem("resourceGroupName", data.user.resourceGroupName || "")
    localStorage.setItem("tenantId", data.user.tenantId)
    localStorage.setItem("subscriptionID", data.user.subscriptionID)
    localStorage.setItem("wafApiKey", data.user.wafApiKey)
    localStorage.setItem("wafPolicyName", data.user.wafPolicyName || "")
    localStorage.setItem("wafId", data.user.wafPolicyName || "")
    localStorage.setItem("webSiteUrl", data.user.webSiteUrl)
    localStorage.setItem("workSpaceID", data.user.workSpaceID)

    return data.user
  } catch (error) {
    console.error("Login error:", error)
    throw error
  }
}

// 로그아웃 함수
export function logoutUser(): void {
  localStorage.removeItem("userId")
  localStorage.removeItem("tenantId")
  localStorage.removeItem("subscriptionID")
  localStorage.removeItem("clientId")
  localStorage.removeItem("clientSecret")
  localStorage.removeItem("wafApiKey")
  localStorage.removeItem("webSiteUrl")
  localStorage.removeItem("resourceGroupName")
}

// 로그인 상태 확인 함수
export function isLoggedIn(): boolean {
  return localStorage.getItem("userId") !== null
}

// 사용자 정보 가져오기
export function getUserCredentials(): {
  tenantId: string
  subscriptionId: string
  clientId: string
  clientPassword: string
} | null {
  const tenantId = localStorage.getItem("tenantId")
  const subscriptionId = localStorage.getItem("subscriptionID")
  const clientId = localStorage.getItem("clientId")
  const clientPassword = localStorage.getItem("clientSecret")

  if (!tenantId || !subscriptionId || !clientId || !clientPassword) {
    return null
  }

  return {
    tenantId,
    subscriptionId,
    clientId,
    clientPassword,
  }
}

// 구독 정보 타입 정의
export interface Subscription {
  id: string
  tenantId: string
  displayName: string
}

// 구독 정보 가져오기
export async function getSubscriptionInfo(userId: string): Promise<Subscription> {
  try {
    const response = await fetch(
      `http://20.249.205.79/api/waf/subscription?userId=${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error("구독 정보를 가져오는데 실패했습니다.")
    }

    return await response.json()
  } catch (error) {
    console.error("Subscription error:", error)
    throw error
  }
}

// 리소스 그룹 타입 정의
export interface ResourceGroup {
  id: string
  name: string
  location: string
  tags: Record<string, string> | null
}

// 리소스 타입 정의
export interface Resource {
  id: string
  name: string
  type: string
  location: string
  tags: Record<string, string> | null
  sku: {
    name: string
    tier?: string
  } | null
  properties?: {
    defaultHostName?: string
  }
}

// 리소스 그룹 목록 가져오기
export async function getResourceGroups(userId: string, subscriptionId: string): Promise<ResourceGroup[]> {
  try {
    const response = await fetch(
      `http://20.249.205.79/api/waf/resource-groups?userId=${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error("리소스 그룹 목록을 가져오는데 실패했습니다.")
    }

    return await response.json()
  } catch (error) {
    console.error("Resource groups error:", error)
    throw error
  }
}

// 리소스 목록 가져오기
export async function getResources(userId: string, resourceGroupName: string): Promise<Resource[]> {
  try {
    const response = await fetch(
      `http://20.249.205.79/api/waf/resource-group/resources?userId=${userId}&resourceGroupName=${resourceGroupName}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error("리소스 목록을 가져오는데 실패했습니다.")
    }

    return await response.json()
  } catch (error) {
    console.error("Resources error:", error)
    throw error
  }
}

