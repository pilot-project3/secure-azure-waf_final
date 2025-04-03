user - service : 8080 포트
ip   - service : 8081 포트

log 
frontend



## 주의할점
- shell script 를 만든이후에는 실행권한을 부여해야 한다. 
```
chmod +x {파일명} 
```


## 1. Local 

- 각 msa를 azure acr 에 올리고 실제로 실행시에는 해당 registry를 pull 받아서 실행 
- 각 container들을 port-forwarding 하는 방식으로 local에서 실행할것이다. 
### 1. minikube 설치 및 context 변경 
```
brew install minikube
brew install kubectl


kubectl version
minikube version

kubectl config get-contexts
kubectl config use-context minikube
```

### 2. azure cli 로 로그인
```
az login --use-device-code
az acr login -n team03registry

```

### 2.5 minikube 클러스터에서 acr 접근권한 확보
```
az acr update -n team03registry --admin-enabled true
az acr credential show --name team03registry   
보이는 username과 pw 가져오자


```


### 3. kubectl 실행해봅시다
```
kubectl apply -f saw-local.yaml
kubectl delete -f saw-local.yaml

kubectl port-forward service/user-service 8080:8080
터미널 하나씩 띄워서 이런식으로...! 
```

### 4. 디버깅 or 로그보기
```

```