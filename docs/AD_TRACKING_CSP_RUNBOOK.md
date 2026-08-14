# 광고 추적과 CSP 운영 기준

## 원칙

CSP는 방문자가 어디에서 들어왔는지를 제한하지 않습니다. CSP가 제한하는 것은 현재 페이지가 스크립트·이미지·iframe·네트워크 요청을 어디로 보낼 수 있는지입니다. 따라서 광고 지면이나 리디렉션에 새로운 퍼블리셔 도메인이 추가되는 것만으로는 CSP 허용목록을 늘리지 않습니다.

반대로 새 픽셀·태그·전환 API·외부 위젯을 추가할 때는 실제로 사용하는 리소스 유형에 맞춰 `src/static/_headers`의 허용목록을 최소 범위로 갱신해야 합니다.

## 현재 허용 대상

| 용도 | CSP 지시어 | 허용 대상 |
| --- | --- | --- |
| Meta Pixel | `script-src`, `img-src`, `connect-src` | `connect.facebook.net`, `www.facebook.com` |
| Google tag/GTM | `script-src`, `frame-src`, `img-src`, `connect-src` | `www.googletagmanager.com` |
| Google Ads | `script-src`, `img-src`, `connect-src` | `www.googleadservices.com`, `googleads.g.doubleclick.net`, `www.google.com`, `www.google.co.kr` |
| Supabase | `connect-src`, `img-src`, `media-src` | `*.supabase.co` |
| Meta CAPI gateway | `connect-src` | 현재 발급된 게이트웨이 호스트만 |

광고 클릭의 유입 도메인, 퍼블리셔 앱, 리디렉션 도메인은 이 목록에 추가하지 않습니다. 그 도메인은 우리 페이지의 outbound 리소스가 아니기 때문입니다.

## 전환 누락 방지

신청 완료 식별자는 다음 순서로 보존합니다.

1. `sessionStorage`
2. `localStorage`
3. 두 저장소 중 하나라도 브라우저에서 차단된 경우에만 제한된 완료 URL fallback

완료 URL fallback은 `app-...` 형식의 신청 ID만 허용합니다. 저장소가 정상인 환경에서는 URL만 복사해 열어도 일반 Purchase 전환이 생성되지 않도록 제한합니다.

Meta `Purchase`의 `eventID`와 GTM dataLayer의 `transaction_id`에는 같은 신청 ID를 사용합니다. 새 CAPI 또는 Google Ads 서버 이벤트를 추가할 때도 이 값을 deduplication 키로 유지해야 합니다.

## 변경 후 검증

```powershell
node tools/verify-security-boundaries.mjs
node tools/build-cloudflare-pages.mjs
node tools/verify-dist-links.mjs
```

실서비스에서는 Meta Events Manager의 Test Events, Google Ads 전환 진단, 그리고 실제 Facebook·Instagram 인앱 브라우저에서 신청 완료까지 확인합니다. 해외 타겟팅으로 Google 국가 도메인이 추가되면 해당 도메인을 추측해 와일드카드로 열지 말고, 실제 Console 차단 로그와 네트워크 요청을 확인한 후 필요한 호스트만 추가합니다.
