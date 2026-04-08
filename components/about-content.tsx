"use client";

import ReactMarkdown from "react-markdown";
import { BlurFade } from "@/components/magic-ui/blur-fade";
import { TextAnimate } from "@/components/magic-ui/text-animate";
import { ShineBorder } from "@/components/magic-ui/shine-border";

function parseAboutSections(content: string) {
  const sections: { heading: string; body: string }[] = [];
  const lines = content.split("\n");
  let current: { heading: string; body: string[] } | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) {
        sections.push({ heading: current.heading, body: current.body.join("\n") });
      }
      current = { heading: line.replace("## ", ""), body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) {
    sections.push({ heading: current.heading, body: current.body.join("\n") });
  }

  return sections;
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <ShineBorder className="mb-6">
      <div className="p-6">{children}</div>
    </ShineBorder>
  );
}

function MarkdownBlock({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h3: ({ children }) => (
          <h3 className="mt-4 mb-2 text-lg font-semibold text-dark-brown">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="mb-3 leading-7 text-foreground">{children}</p>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-light-brown underline underline-offset-4 hover:text-dark-brown"
            target={href?.startsWith("http") ? "_blank" : undefined}
            rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {children}
          </a>
        ),
        ul: ({ children }) => (
          <ul className="mb-3 ml-6 list-disc space-y-1 text-foreground">{children}</ul>
        ),
        li: ({ children }) => <li className="leading-7">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-dark-brown">{children}</strong>
        ),
        hr: () => <hr className="my-4 border-border" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function AboutContent({ content }: { content: string }) {
  const sections = parseAboutSections(content);
  const aboutMe = sections.find((s) => s.heading.includes("About Me"));
  const tagline = "팀의 생산성과 서비스 안정성을 함께 고민하는 엔지니어입니다.";

  return (
    <div className="mx-auto max-w-3xl">
      <BlurFade delay={0}>
        <h1 className="mb-2 text-3xl font-bold text-dark-brown">이주훈</h1>
      </BlurFade>

      <BlurFade delay={0.1}>
        <TextAnimate
          text={tagline}
          className="mb-4 text-lg font-medium text-light-brown"
          delay={0.2}
        />
      </BlurFade>

      {aboutMe && (
        <BlurFade delay={0.2}>
          <p className="mb-8 leading-7 text-foreground">
            {aboutMe.body.replace(/^\n+/, "").replace(/".*?"\n\n/, "")}
          </p>
        </BlurFade>
      )}

      {sections
        .filter((s) => !s.heading.includes("About Me"))
        .map((section, i) => (
          <BlurFade key={section.heading} delay={0.3 + i * 0.15} inView>
            <SectionCard>
              <h2 className="mb-4 text-xl font-bold text-dark-brown">
                {section.heading}
              </h2>
              <MarkdownBlock content={section.body} />
            </SectionCard>
          </BlurFade>
        ))}
    </div>
  );
}
