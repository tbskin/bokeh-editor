import { Hero } from "@/components/Hero";
import { ReelsWall } from "@/components/ReelsWall";

export default function Home() {
  return (
    <main>
      <section
        className="hero-split"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.15fr)",
          gap: 32,
          minHeight: "100vh",
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 28px",
          alignItems: "stretch",
        }}
      >
        <Hero />
        <div className="wall-holder" style={{ height: "100vh", padding: "18px 0" }}>
          <ReelsWall columns={4} />
        </div>
      </section>
    </main>
  );
}
