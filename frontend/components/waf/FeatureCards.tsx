export default function FeatureCards() {
  return (
    <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="font-medium mb-2">사용자 지정 규칙</h3>
        <p className="text-sm text-muted-foreground">특정 요구 사항에 맞는 맞춤형 보안 규칙을 생성하세요.</p>
      </div>
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="font-medium mb-2">IP 차단</h3>
        <p className="text-sm text-muted-foreground">악의적인 IP 주소를 차단하여 공격을 방지합니다.</p>
      </div>
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="font-medium mb-2">관리형 규칙 세트</h3>
        <p className="text-sm text-muted-foreground">
          사전 구성된 보안 규칙을 사용하여 일반적인 위협으로부터 보호합니다.
        </p>
      </div>
    </div>
  )
}

