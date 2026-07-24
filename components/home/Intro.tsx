function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 8.2H3.3V21h3.2V8.2ZM4.9 3A1.9 1.9 0 1 0 5 6.8 1.9 1.9 0 0 0 4.9 3ZM21 13.7c0-3.9-2.1-5.7-4.9-5.7a4.2 4.2 0 0 0-3.8 2.1V8.2H9.1V21h3.2v-6.3c0-1.7.3-3.3 2.4-3.3 2 0 2.1 1.9 2.1 3.4V21H20v-7.3Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.2 19.5v-2.3c-2.7.6-3.3-1.1-3.3-1.1-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 0 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.8.8.1-.6.4-1.1.7-1.3-2.1-.2-4.4-1-4.4-4.7 0-1 .4-1.9 1-2.6-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.7 1a9.2 9.2 0 0 1 4.9 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.6.7.7 1 1.6 1 2.6 0 3.7-2.3 4.5-4.4 4.7.4.3.7.9.7 1.8v2.7A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

export function Intro() {
  return (
    <section
      className="tile homeIntro"
      id="about"
      aria-label="About Peter"
    >
      <p className="sectionLabel">Hello, I’m Peter</p>
      <h1>
        Product engineer from Slovakia. I love making{" "}
        <em>products and small tools.</em>
      </h1>
      <p className="introCopy">
        I’ve worked at Slido for ten years. We became part of Cisco in 2021. I
        always want to be where product, design, and engineering meet.
      </p>
      <div className="profileLinks" aria-label="Peter elsewhere">
        <a
          href="https://www.linkedin.com/in/hraska/"
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
          title="LinkedIn"
        >
          <LinkedInIcon />
        </a>
        <a
          href="https://github.com/virpo"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          title="GitHub"
        >
          <GitHubIcon />
        </a>
      </div>
    </section>
  );
}
