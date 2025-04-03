import React, { useState } from "react"
import { useRouter } from "next/router"

const LoginPage: React.FC = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

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
        throw new Error("로그인에 실패했습니다.")
      }

      const data = await response.json()
      localStorage.setItem("userId", data.user.id.toString())
      localStorage.setItem("clientId", data.user.clientId || "")
      localStorage.setItem("clientSecret", data.user.clientSecret || "")
      localStorage.setItem("tenantId", data.user.tenantId || "")
      localStorage.setItem("subscriptionID", data.user.subscriptionID || "")
      localStorage.setItem("workSpaceID", data.user.workSpaceID || "")
      localStorage.setItem("webSiteUrl", data.user.webSiteUrl || "")
      localStorage.setItem("wafPolicyName", data.user.wafPolicyName || "")
      localStorage.setItem("resourceGroupName", data.user.resourceGroupName || "")
      
      toast.success("로그인 성공!")
      router.push("/dashboard")
    } catch (error) {
      console.error("Login failed:", error)
      setError("로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Render your login form here */}
    </div>
  )
}

export default LoginPage 