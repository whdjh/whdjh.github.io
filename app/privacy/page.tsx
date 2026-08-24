import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Mail, ShieldCheck } from "lucide-react";

const CONTACT_EMAIL = "wngns9807@gmail.com";
const EFFECTIVE_DATE = "2026년 8월 25일";

const sections = [
  ["overview", "개인정보처리방침 개요"],
  ["data", "수집 및 처리하는 정보"],
  ["collection", "정보 수집 방법"],
  ["purpose", "개인정보 이용 목적"],
  ["public-content", "Threads 공개 콘텐츠 처리"],
  ["retention", "개인정보 보관 및 삭제"],
  ["third-parties", "제3자 제공 및 외부 서비스"],
  ["rights", "사용자의 권리와 데이터 삭제 요청"],
  ["disconnect", "Threads 연결 해제"],
  ["security", "개인정보 보호 조치"],
  ["changes", "개인정보처리방침 변경"],
  ["contact", "문의처"],
  ["effective-date", "시행일"],
] as const;

export const metadata: Metadata = {
  title: "YepBuddy 개인정보처리방침",
  description:
    "YepBuddy의 Threads 연동 기능에서 처리하는 정보와 이용 목적, 보관 기간 및 데이터 삭제 방법을 안내합니다.",
};

function PolicySection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-border pt-8">
      <h2 className="mb-4 flex items-baseline gap-3 text-xl font-bold text-dark-brown md:text-2xl">
        <span className="text-sm font-semibold text-light-brown">
          {String(number).padStart(2, "0")}
        </span>
        {title}
      </h2>
      <div className="space-y-4 text-[15px] leading-7 text-foreground md:text-base">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-4xl pb-12">
      <header className="mb-10 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-dark-brown px-6 py-8 text-cream md:px-10 md:py-10">
          <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-cream/10 ring-1 ring-cream/20">
            <ShieldCheck aria-hidden="true" className="size-6" />
          </div>
          <p className="mb-2 text-sm font-semibold tracking-wide text-cream/70">
            YEPBUDDY · 개인 사이드 프로젝트
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            개인정보처리방침
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-cream/80">
            YepBuddy의 Threads 연동 기능에서 어떤 정보를 처리하고, 어떻게
            보호하며, 사용자가 어떻게 삭제를 요청할 수 있는지 안내합니다.
          </p>
        </div>
        <dl className="grid gap-px bg-border sm:grid-cols-2">
          <div className="bg-card px-6 py-4 md:px-10">
            <dt className="text-xs font-semibold text-muted-foreground">
              운영자
            </dt>
            <dd className="mt-1 font-medium text-dark-brown">이주훈</dd>
          </div>
          <div className="bg-card px-6 py-4 md:px-10">
            <dt className="text-xs font-semibold text-muted-foreground">
              시행일
            </dt>
            <dd className="mt-1 font-medium text-dark-brown">
              {EFFECTIVE_DATE}
            </dd>
          </div>
        </dl>
      </header>

      <nav
        aria-label="개인정보처리방침 목차"
        className="mb-10 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8"
      >
        <h2 className="mb-4 text-sm font-bold text-dark-brown">목차</h2>
        <ol className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          {sections.map(([id, title], index) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="group flex gap-3 rounded-md py-1 text-foreground transition-colors hover:text-dark-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="w-5 shrink-0 text-muted-foreground group-hover:text-light-brown">
                  {index + 1}.
                </span>
                <span className="underline-offset-4 group-hover:underline">
                  {title}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-10 rounded-2xl border border-border bg-card px-6 py-8 shadow-sm md:px-10 md:py-10">
        <PolicySection
          id="overview"
          number={1}
          title="개인정보처리방침 개요"
        >
          <p>
            YepBuddy(이하 “서비스”)는 이주훈이 운영하는 개인 사이드
            프로젝트입니다. 본 개인정보처리방침은 서비스의 Threads 계정
            연동, 공개 콘텐츠 검색, 게시물 및 답글 관리, 멘션 확인, 인사이트
            분석 기능에 적용됩니다.
          </p>
          <p>
            서비스는 기능 제공에 필요한 최소한의 정보만 처리하며, 사용자의
            정보를 판매하지 않습니다.
          </p>
        </PolicySection>

        <PolicySection id="data" number={2} title="수집 및 처리하는 정보">
          <p>
            사용자가 선택한 기능과 Meta에서 허용한 권한 범위에 따라 다음
            정보의 전부 또는 일부를 처리할 수 있습니다.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead className="bg-muted/70 text-dark-brown">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    구분
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    처리 항목
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <th scope="row" className="whitespace-nowrap px-4 py-3 font-semibold">
                    계정 및 프로필
                  </th>
                  <td className="px-4 py-3">
                    Threads 사용자 ID, 사용자명(username), 공개 프로필 정보
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="whitespace-nowrap px-4 py-3 font-semibold">
                    게시물
                  </th>
                  <td className="px-4 py-3">
                    게시물 ID, 텍스트, permalink, 게시 시각(timestamp), 미디어
                    유형
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="whitespace-nowrap px-4 py-3 font-semibold">
                    상호작용
                  </th>
                  <td className="px-4 py-3">답글 및 멘션 정보</td>
                </tr>
                <tr>
                  <th scope="row" className="whitespace-nowrap px-4 py-3 font-semibold">
                    인사이트
                  </th>
                  <td className="px-4 py-3">
                    Meta Threads API가 제공하는 게시물 성과 및 인사이트 정보
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="whitespace-nowrap px-4 py-3 font-semibold">
                    검색
                  </th>
                  <td className="px-4 py-3">
                    사용자가 입력한 검색 키워드, 검색 결과에 포함된 공개 게시물
                    정보
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="whitespace-nowrap px-4 py-3 font-semibold">
                    인증
                  </th>
                  <td className="px-4 py-3">Threads API 액세스 토큰</td>
                </tr>
                <tr>
                  <th scope="row" className="whitespace-nowrap px-4 py-3 font-semibold">
                    기술 로그
                  </th>
                  <td className="px-4 py-3">
                    기능 요청 시각, 요청 처리 결과, 오류 정보 등 서비스 운영에
                    필요한 최소한의 로그
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Threads API 액세스 토큰은 계정 연결을 유지하고 사용자가 요청한
            기능을 제공하기 위해 서버에 저장하며, 클라이언트 화면이나 공개
            응답에 노출하지 않습니다.
          </p>
        </PolicySection>

        <PolicySection id="collection" number={3} title="정보 수집 방법">
          <ul className="ml-5 list-disc space-y-2 marker:text-light-brown">
            <li>사용자가 서비스에 검색어 등 정보를 직접 입력하는 경우</li>
            <li>
              사용자가 Threads 계정을 연결하고 권한을 부여한 후, Meta Threads
              API를 통해 정보를 제공받는 경우
            </li>
            <li>
              Threads Keyword Search API를 통해 키워드와 관련된 공개 Threads
              콘텐츠를 검색하는 경우
            </li>
            <li>
              서비스 이용 중 기능 요청 결과나 오류 정보가 자동으로 생성되는
              경우
            </li>
          </ul>
        </PolicySection>

        <PolicySection id="purpose" number={4} title="개인정보 이용 목적">
          <ul className="grid gap-2 sm:grid-cols-2">
            {[
              "Threads 계정 연동 및 인증 유지",
              "공개 Threads 콘텐츠 키워드 검색",
              "Threads 게시물 작성 및 관리",
              "Threads 답글 작성 및 관리",
              "사용자 계정에 대한 멘션 확인",
              "게시물 성과 및 인사이트 분석",
              "사용자 요청 처리 및 문의 대응",
              "서비스 오류 확인과 안정성 개선",
            ].map((purpose) => (
              <li
                key={purpose}
                className="rounded-lg border border-border bg-background/40 px-4 py-3"
              >
                {purpose}
              </li>
            ))}
          </ul>
        </PolicySection>

        <PolicySection
          id="public-content"
          number={5}
          title="Threads 공개 콘텐츠 처리"
        >
          <p>
            YepBuddy는 사용자가 입력한 키워드와 관련된 공개 Threads 게시물을
            찾기 위해 Threads Keyword Search API를 사용할 수 있습니다. 검색
            결과에는 게시물 작성자의 사용자명, 게시물 내용, 게시물 ID,
            permalink, 게시 시각, 미디어 유형 등의 공개 정보가 포함될 수
            있습니다.
          </p>
          <div className="rounded-xl border-l-4 border-light-brown bg-muted/50 px-5 py-4">
            <p className="font-semibold text-dark-brown">저장 여부</p>
            <p className="mt-1">
              사용자가 입력한 검색 키워드와 공개 게시물 검색 결과는 검색 요청을
              처리하고 화면에 결과를 제공하는 동안 일시적으로만 처리하며, 별도
              데이터베이스에 영구 저장하지 않습니다.
            </p>
          </div>
          <p>
            공개 콘텐츠는 사용자가 요청한 검색 결과 제공 목적으로만 처리하며,
            광고 대상 선정이나 제3자 판매에 사용하지 않습니다. 비공개
            콘텐츠를 의도적으로 수집하지 않습니다.
          </p>
        </PolicySection>

        <PolicySection id="retention" number={6} title="개인정보 보관 및 삭제">
          <p>
            서비스는 각 정보를 아래 기간 동안 보관하고, 이용 목적이 달성되거나
            사용자가 삭제를 요청하면 지체 없이 삭제합니다.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-muted/70 text-dark-brown">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    정보
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    보관 기간
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <th scope="row" className="px-4 py-3 font-semibold">
                    계정 연동 정보 및 액세스 토큰
                  </th>
                  <td className="px-4 py-3">
                    Threads 연결 해제 또는 데이터 삭제 요청 시까지
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-3 font-semibold">
                    게시물·답글·멘션·인사이트 관련 정보
                  </th>
                  <td className="px-4 py-3">
                    해당 기능 제공에 필요한 기간 동안 보관하며, 연결 해제 또는
                    삭제 요청 시 삭제
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-3 font-semibold">
                    검색 키워드 및 공개 검색 결과
                  </th>
                  <td className="px-4 py-3">
                    검색 요청 처리 중에만 일시적으로 처리하며 별도 DB에 미보관
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-3 font-semibold">
                    서비스 기술 로그
                  </th>
                  <td className="px-4 py-3">생성일로부터 최대 30일</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            관계 법령에 따라 일정 기간 보관할 의무가 있는 경우에는 해당
            기간에만 별도로 보관한 후 삭제합니다. YepBuddy가 보유한 정보를
            삭제하더라도 Threads에 이미 게시된 원본 게시물이나 답글은 자동으로
            삭제되지 않을 수 있으며, 해당 콘텐츠는 Threads에서 직접 관리해야
            합니다.
          </p>
        </PolicySection>

        <PolicySection
          id="third-parties"
          number={7}
          title="제3자 제공 및 외부 서비스"
        >
          <p>
            YepBuddy는 사용자의 개인정보를 판매하지 않으며, 원칙적으로
            사용자의 동의 없이 제3자에게 제공하지 않습니다. 다만 서비스 운영에
            필요한 범위에서 다음 외부 서비스를 이용할 수 있습니다.
          </p>
          <ul className="space-y-3">
            <li className="rounded-lg border border-border px-4 py-3">
              <strong className="text-dark-brown">Meta Platforms, Inc.</strong>
              <span className="mt-1 block">
                Threads 계정 연동, 콘텐츠 검색·작성·관리 및 인사이트 제공
              </span>
            </li>
            <li className="rounded-lg border border-border px-4 py-3">
              <strong className="text-dark-brown">Vercel Inc.</strong>
              <span className="mt-1 block">
                애플리케이션 호스팅, 요청 처리 및 서비스 운영
              </span>
            </li>
            <li className="rounded-lg border border-border px-4 py-3">
              <strong className="text-dark-brown">Supabase Inc.</strong>
              <span className="mt-1 block">
                계정 연동 정보와 서비스 데이터의 안전한 저장 및 관리
              </span>
            </li>
          </ul>
          <p>
            법령에 특별한 규정이 있거나 법적 의무를 이행해야 하는 경우에는
            필요한 범위에서 정보가 제공될 수 있습니다.
          </p>
        </PolicySection>

        <PolicySection
          id="rights"
          number={8}
          title="사용자의 권리와 데이터 삭제 요청"
        >
          <p>
            사용자는 본인의 개인정보에 대해 열람, 정정, 삭제 또는 처리 중지를
            요청할 수 있습니다. 데이터 삭제는 아래 이메일로 요청할 수 있으며,
            본인 확인 후 YepBuddy가 보유한 관련 데이터를 삭제합니다.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
              "[YepBuddy] 개인정보 삭제 요청"
            )}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-background/50 px-5 py-4 font-semibold text-dark-brown transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Mail aria-hidden="true" className="size-5 shrink-0" />
            <span className="break-all">{CONTACT_EMAIL}</span>
          </a>
          <p>
            요청 시 연결된 Threads 사용자명과 요청 내용을 알려 주세요. 비밀번호나
            액세스 토큰은 보내지 마세요. 계정 도용을 방지하기 위해 필요한 범위의
            본인 확인을 요청할 수 있으며, 확인된 요청은 통상 30일 이내에 처리
            결과를 안내합니다.
          </p>
        </PolicySection>

        <PolicySection id="disconnect" number={9} title="Threads 연결 해제">
          <p>
            사용자는 Meta 또는 Threads의 앱 및 권한 설정에서 YepBuddy에 부여한
            권한을 철회하거나, YepBuddy에서 제공하는 연결 해제 기능을 사용할 수
            있습니다.
          </p>
          <p>
            연결 해제가 확인되면 YepBuddy는 보유한 Threads API 액세스 토큰과
            계정 연동 정보를 삭제합니다. Meta 또는 Threads에서 권한을 먼저
            철회한 뒤에도 YepBuddy 보유 데이터 삭제가 필요한 경우 위 문의처로
            삭제를 요청할 수 있습니다.
          </p>
        </PolicySection>

        <PolicySection id="security" number={10} title="개인정보 보호 조치">
          <p>
            YepBuddy는 처리하는 정보를 보호하기 위해 HTTPS 통신, 서버 측 인증
            정보 보관, 접근 권한 제한, 액세스 토큰의 공개 로그 및 클라이언트 노출
            방지 등 합리적인 기술적·관리적 조치를 적용합니다.
          </p>
        </PolicySection>

        <PolicySection id="changes" number={11} title="개인정보처리방침 변경">
          <p>
            서비스 기능 또는 관련 기준의 변경으로 본 개인정보처리방침이
            달라지는 경우, 변경 내용과 시행일을 이 페이지를 통해 안내합니다.
          </p>
        </PolicySection>

        <PolicySection id="contact" number={12} title="문의처">
          <dl className="grid gap-3 rounded-xl border border-border bg-background/40 p-5 sm:grid-cols-[8rem_1fr]">
            <dt className="font-semibold text-dark-brown">서비스명</dt>
            <dd>YepBuddy</dd>
            <dt className="font-semibold text-dark-brown">운영자</dt>
            <dd>이주훈</dd>
            <dt className="font-semibold text-dark-brown">문의 이메일</dt>
            <dd>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="break-all underline decoration-light-brown underline-offset-4 hover:text-dark-brown"
              >
                {CONTACT_EMAIL}
              </a>
            </dd>
          </dl>
        </PolicySection>

        <PolicySection id="effective-date" number={13} title="시행일">
          <p>본 개인정보처리방침은 {EFFECTIVE_DATE}부터 시행합니다.</p>
        </PolicySection>
      </div>
    </article>
  );
}
