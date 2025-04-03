source venv-log-service/bin/activate


### 전제조건
1. 유저는 이미 static-web-app // front door - log analytics  //  WAF를 만들었다. 
2. 나는 여기서 로그만 가져오면 된다.... 


### 방식
1. 유저정보 가져옴...
2. log 정보 가져옴 ...


### API 설계
1. 로그 Return 해주는거
    - 유저가 버튼 클릭해서 내서버로 요청을 보낸다.
    - 나는 유저 정보를 찾아서 정보를 가져온다.
    - azure cli에 요청을 쏴서 .. 유저 로그를 가져와서 리턴한다...
    - DB에다가 저장한다....

2. AI Insight Return 해주는거...
    - 


### 실 방향
az ad sp create-for-rbac \
--name team03-terraform \

<!--  export FLASK_APP=app:create_app
export PYTHONPATH=. -->



export PYTHONPATH=$(pwd)
flask db migrate → flask db upgrade를 아직 안 해서 실제 테이블이 생성되지 않았어.
#!/bin/bash
export PYTHONPATH=$(pwd)
flask run