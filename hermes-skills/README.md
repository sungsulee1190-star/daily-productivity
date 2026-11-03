# Hermes 스킬

[Hermes Agent](https://github.com/NousResearch/hermes-agent)가 이 앱 데이터(할일·루틴·링크·트래커 등)를 읽고 쓰게 해주는 스킬.
앱 계정으로 로그인하므로 Supabase RLS에 따라 **본인 데이터만** 접근한다. 비밀번호는 저장소에 들어가지 않는다.

## 새 컴퓨터에 설치

```bash
# 1) 스킬 설치
hermes skills install sungsulee1190-star/daily-productivity/hermes-skills/daily-productivity --category productivity

# 2) ~/.hermes/.env 에 로그인 정보 추가 (직접 편집)
#    DP_EMAIL=you@example.com
#    DP_PASSWORD=...

# 3) 확인 — user_id가 나오면 성공
python3 ~/.hermes/skills/productivity/daily-productivity/scripts/dp.py whoami
```

`hermes skills install`이 막히면(사내망 등) 이 폴더를 `~/.hermes/skills/productivity/daily-productivity/`로 그대로 복사해도 된다.

필요: python3 (표준 라이브러리만 사용), `*.supabase.co` 접속 가능 네트워크.
